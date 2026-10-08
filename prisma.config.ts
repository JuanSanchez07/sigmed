import "dotenv/config";
import { defineConfig } from "prisma/config";

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
const shadowConnectionString = process.env.SHADOW_DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(connectionString
    ? {
        datasource: {
          url: connectionString,
          ...(shadowConnectionString
            ? { shadowDatabaseUrl: shadowConnectionString }
            : {}),
        },
      }
    : {}),
});