/* global console, process */

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EMAIL_BOUND_STATUS = 1;
const EMAIL_UNBOUND_STATUS = 2;
const ACCOUNT_LISTED_STATUS = 1;

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

async function main() {
  const [emails, activeAccounts] = await Promise.all([
    prisma.codmEmail.findMany({
      orderBy: [{ postfix: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        prefix: true,
        postfix: true,
        bindStatus: true,
      },
    }),
    prisma.codmAccount.findMany({
      where: {
        email: { not: null },
        status: ACCOUNT_LISTED_STATUS,
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        serialNumber: true,
        title: true,
        email: true,
      },
    }),
  ]);

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

  if (shouldWrite) {
    for (const email of mismatchedEmails) {
      await prisma.codmEmail.update({
        where: { id: BigInt(email.id) },
        data: { bindStatus: email.expectedBindStatus },
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: shouldWrite ? "write" : "dry-run",
        updatedEmailRows: shouldWrite ? mismatchedEmails.length : 0,
        pendingEmailRows: shouldWrite ? 0 : mismatchedEmails.length,
        mismatchedEmails,
        missingEmailRecords,
        duplicateEmailRows,
        duplicateActiveAccounts,
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
