/* global console, process */

import { parseCodmSkinAttributes } from "@wuliuqi/utils/codm-attributes";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const shouldWrite = process.argv.includes("--write");
const shouldOverwrite = process.argv.includes("--overwrite");

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

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

function normalizeAttributes(value, depth = 0) {
  if (!value) {
    return {};
  }

  if (typeof value === "string" && depth < 3) {
    try {
      return normalizeAttributes(JSON.parse(value), depth + 1);
    } catch {
      return {};
    }
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      ([, attributeValue]) =>
        typeof attributeValue === "number" || typeof attributeValue === "string",
    ),
  );
}

function hasSkinAttributes(parsedAttributes) {
  return (
    parsedAttributes.mythic_skins !== undefined ||
    parsedAttributes.legendary_skins !== undefined
  );
}

function mergeSkinAttributes(currentAttributes, parsedAttributes) {
  const attributes = { ...currentAttributes };
  let changed = false;

  for (const key of ["mythic_skins", "legendary_skins"]) {
    const parsedValue = parsedAttributes[key];

    if (parsedValue === undefined) {
      continue;
    }

    if (!shouldOverwrite && attributes[key] !== undefined) {
      continue;
    }

    if (attributes[key] !== parsedValue) {
      attributes[key] = parsedValue;
      changed = true;
    }
  }

  return { attributes, changed };
}

function serializeChange(account, parsedAttributes, nextAttributes) {
  return {
    id: account.id.toString(),
    serialNumber: account.serial_number,
    title: account.title,
    parsed: parsedAttributes,
    nextAttributes,
  };
}

async function main() {
  const accounts = await sql`
    SELECT
      id,
      serial_number,
      title,
      describe,
      attributes,
      jsonb_typeof(attributes) AS attributes_type
    FROM codm_accounts
    ORDER BY id ASC
  `;

  const changes = [];
  let matchedMythic = 0;
  let matchedLegendary = 0;

  for (const account of accounts) {
    const parsedAttributes = parseCodmSkinAttributes(account.title, account.describe);

    if (parsedAttributes.mythic_skins !== undefined) {
      matchedMythic += 1;
    }

    if (parsedAttributes.legendary_skins !== undefined) {
      matchedLegendary += 1;
    }

    const currentAttributes = normalizeAttributes(account.attributes);
    const { attributes, changed } = mergeSkinAttributes(
      currentAttributes,
      parsedAttributes,
    );
    const needsShapeRepair =
      account.attributes_type !== "object" && hasSkinAttributes(parsedAttributes);

    if (changed || needsShapeRepair) {
      changes.push(serializeChange(account, parsedAttributes, attributes));
    }
  }

  if (shouldWrite && changes.length > 0) {
    await sql.begin(async (tx) => {
      await tx.unsafe(
        'ALTER TABLE "codm_accounts" DISABLE TRIGGER "codm_accounts_set_updated_at"',
      );

      try {
        for (const change of changes) {
          await tx`
            UPDATE codm_accounts
            SET attributes = ${sql.json(change.nextAttributes)}
            WHERE id = ${change.id}::bigint
          `;
        }
      } finally {
        await tx.unsafe(
          'ALTER TABLE "codm_accounts" ENABLE TRIGGER "codm_accounts_set_updated_at"',
        );
      }
    });
  }

  console.log(
    JSON.stringify(
      {
        mode: shouldWrite ? "write" : "dry-run",
        overwrite: shouldOverwrite,
        total: accounts.length,
        matchedAny: accounts.filter((account) =>
          hasSkinAttributes(
            parseCodmSkinAttributes(account.title, account.describe),
          ),
        ).length,
        matchedMythic,
        matchedLegendary,
        pendingUpdates: shouldWrite ? 0 : changes.length,
        updatedRows: shouldWrite ? changes.length : 0,
        samples: changes.slice(0, 12),
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
    await sql.end();
  });
