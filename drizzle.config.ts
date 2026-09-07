import { defineConfig } from "./tooling/sites/node_modules/drizzle-kit/index";
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
