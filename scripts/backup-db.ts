import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";

const OUT_DIR = process.env.BACKUP_DIR ?? join(process.cwd(), "backups");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

const json = (value: unknown) =>
  JSON.stringify(
    value,
    (_key, val) => (typeof val === "bigint" ? val.toString() : val instanceof Date ? val.toISOString() : val),
    2,
  );

const tables = await prisma.$queryRaw<{ table_name: string }[]>`
  SELECT table_name::text AS table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    AND table_name <> '_prisma_migrations'
  ORDER BY table_name
`;

const columns = await prisma.$queryRaw<
  { table_name: string; column_name: string; data_type: string; is_nullable: string }[]
>`
  SELECT table_name::text AS table_name, column_name::text AS column_name, data_type::text AS data_type, is_nullable::text AS is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position
`;

const enums = await prisma.$queryRaw<{ t: string; e: string }[]>`
  SELECT t.typname::text AS t, e.enumlabel::text AS e
  FROM pg_type t
  JOIN pg_enum e ON e.enumtypid = t.oid
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
  ORDER BY t.typname, e.enumsortorder
`;

mkdirSync(OUT_DIR, { recursive: true });
const file = join(OUT_DIR, `neon-main-${stamp}.json`);

const dump: Record<string, unknown> = {
  generated_at: new Date().toISOString(),
  note: "Backup de datos previo a la reforma de la BD. Regenerable con `npm run db:seed`.",
  columns,
  enums,
  rows: {} as Record<string, unknown>,
};

let total = 0;
for (const { table_name } of tables) {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`SELECT * FROM ${Prisma.raw(`"${table_name}"`)}`);
  (dump.rows as Record<string, unknown>)[table_name] = rows;
  total += rows.length;
  console.log(`  ${table_name.padEnd(24)} ${rows.length} filas`);
}

writeFileSync(file, json(dump), "utf8");
console.log(`\n${tables.length} tablas, ${total} filas`);
console.log(`Backup escrito en ${file}`);