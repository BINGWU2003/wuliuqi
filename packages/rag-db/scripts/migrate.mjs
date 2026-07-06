/* global console, process */
import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.RAG_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing RAG_DATABASE_URL");
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });
const migrationsDir = path.join(process.cwd(), "migrations");
const entries = await fs.readdir(migrationsDir);

for (const entry of entries.filter((file) => file.endsWith(".sql")).sort()) {
  const migration = await fs.readFile(path.join(migrationsDir, entry), "utf8");
  console.log(`Applying ${entry}`);
  await sql.unsafe(migration);
}

await sql.end();
