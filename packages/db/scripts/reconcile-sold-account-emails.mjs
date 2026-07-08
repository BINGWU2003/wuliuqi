/* global console, process */

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EMAIL_BOUND_STATUS = 1;
const EMAIL_UNBOUND_STATUS = 2;
const ACCOUNT_UNLISTED_STATUS = 2;
const ACCOUNT_SOLD_STATUS = 3;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const shouldWrite = process.argv.includes("--write");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

loadEnvFile(path.join(repoRoot, ".env"));
loadEnvFile(path.join(repoRoot, "apps/admin/.env"));

const prisma = new PrismaClient({ log: ["error"] });

function emailAddress(email) {
  return `${email.prefix}${email.postfix}`;
}

function pushMapValue(map, key, value) {
  const values = map.get(key);

  if (values) {
    values.push(value);
    return;
  }

  map.set(key, [value]);
}

function serializeAccount(account) {
  return {
    id: account.id.toString(),
    serialNumber: account.serialNumber,
    title: account.title,
    status: account.status,
    email: account.email,
  };
}

function serializeEmail(email, expectedBindStatus) {
  return {
    id: email.id.toString(),
    email: emailAddress(email),
    currentBindStatus: email.bindStatus,
    expectedBindStatus,
  };
}

function buildEmailReconcileReport(emails, activeAccounts) {
  const emailRowsByAddress = new Map();
  const activeAccountsByEmail = new Map();

  for (const email of emails) {
    pushMapValue(emailRowsByAddress, emailAddress(email), email);
  }

  for (const account of activeAccounts) {
    if (account.email) {
      pushMapValue(activeAccountsByEmail, account.email, account);
    }
  }

  const mismatchedEmails = [];
  const missingEmailRecords = [];
  const duplicateEmailRows = [];
  const duplicateActiveAccounts = [];

  for (const email of emails) {
    const address = emailAddress(email);
    const expectedBindStatus = activeAccountsByEmail.has(address)
      ? EMAIL_BOUND_STATUS
      : EMAIL_UNBOUND_STATUS;

    if (email.bindStatus !== expectedBindStatus) {
      mismatchedEmails.push(serializeEmail(email, expectedBindStatus));
    }
  }

  for (const [address, accounts] of activeAccountsByEmail) {
    if (!emailRowsByAddress.has(address)) {
      missingEmailRecords.push({
        email: address,
        activeAccounts: accounts.map(serializeAccount),
      });
    }

    if (accounts.length > 1) {
      duplicateActiveAccounts.push({
        email: address,
        activeAccounts: accounts.map(serializeAccount),
      });
    }
  }

  for (const [address, rows] of emailRowsByAddress) {
    if (rows.length > 1) {
      duplicateEmailRows.push({
        email: address,
        emailIds: rows.map((row) => row.id.toString()),
      });
    }
  }

  return {
    mismatchedEmails,
    missingEmailRecords,
    duplicateEmailRows,
    duplicateActiveAccounts,
  };
}

async function loadCurrentState(client) {
  const [emails, historicalSoldAccounts, activeAccounts] = await Promise.all([
    client.codmEmail.findMany({
      orderBy: [{ postfix: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        prefix: true,
        postfix: true,
        bindStatus: true,
      },
    }),
    client.codmAccount.findMany({
      where: { status: ACCOUNT_UNLISTED_STATUS },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        serialNumber: true,
        title: true,
        status: true,
        email: true,
      },
    }),
    client.codmAccount.findMany({
      where: {
        email: { not: null },
        status: {
          notIn: [ACCOUNT_UNLISTED_STATUS, ACCOUNT_SOLD_STATUS],
        },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        serialNumber: true,
        title: true,
        status: true,
        email: true,
      },
    }),
  ]);

  return {
    emails,
    historicalSoldAccounts,
    activeAccounts,
  };
}

async function main() {
  const initialState = await loadCurrentState(prisma);
  const initialEmailReport = buildEmailReconcileReport(
    initialState.emails,
    initialState.activeAccounts,
  );
  const historicalSoldAccountsWithEmail =
    initialState.historicalSoldAccounts.filter((account) => account.email);

  let writtenEmailRows = 0;
  let writtenSoldAccounts = 0;

  if (shouldWrite) {
    await prisma.$transaction(async (tx) => {
      const soldAccountResult = await tx.codmAccount.updateMany({
        where: { status: ACCOUNT_UNLISTED_STATUS },
        data: {
          status: ACCOUNT_SOLD_STATUS,
          email: null,
        },
      });

      writtenSoldAccounts = soldAccountResult.count;

      for (const email of initialEmailReport.mismatchedEmails) {
        await tx.codmEmail.update({
          where: { id: BigInt(email.id) },
          data: { bindStatus: email.expectedBindStatus },
        });
        writtenEmailRows += 1;
      }
    });
  }

  const finalState = shouldWrite
    ? await loadCurrentState(prisma)
    : initialState;
  const finalEmailReport = buildEmailReconcileReport(
    finalState.emails,
    finalState.activeAccounts,
  );

  console.log(
    JSON.stringify(
      {
        mode: shouldWrite ? "write" : "dry-run",
        warning:
          "此脚本用于一次性修正历史下架即已售数据；新业务上线后不要把未来 status=2 的真实下架账号重复当作已售处理。",
        pendingSoldAccounts: shouldWrite
          ? 0
          : initialState.historicalSoldAccounts.length,
        pendingAccountEmailClears: shouldWrite
          ? 0
          : historicalSoldAccountsWithEmail.length,
        pendingEmailRows: shouldWrite
          ? 0
          : initialEmailReport.mismatchedEmails.length,
        updatedSoldAccounts: writtenSoldAccounts,
        updatedEmailRows: writtenEmailRows,
        historicalSoldAccounts:
          initialState.historicalSoldAccounts.map(serializeAccount),
        historicalSoldAccountsWithEmail:
          historicalSoldAccountsWithEmail.map(serializeAccount),
        mismatchedEmails: shouldWrite
          ? finalEmailReport.mismatchedEmails
          : initialEmailReport.mismatchedEmails,
        missingEmailRecords: finalEmailReport.missingEmailRecords,
        duplicateEmailRows: finalEmailReport.duplicateEmailRows,
        duplicateActiveAccounts: finalEmailReport.duplicateActiveAccounts,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
