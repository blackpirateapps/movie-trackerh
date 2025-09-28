// A simple script to execute the schema.sql file on your Turso database.
// Usage: `node ./db/migrate.js` from the `/backend` directory.

import { createClient } from "@turso/db";
import * as fs from "fs/promises";
import * as path from "path";
import "dotenv/config";

async function main() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error(
      "Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env variables are required."
    );
    process.exit(1);
  }

  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log("Connected to Turso database.");

  try {
    const schemaPath = path.resolve(__dirname, "schema.sql");
    const schema = await fs.readFile(schemaPath, "utf-8");
    const statements = schema.split(';').filter(s => s.trim() !== '');

    console.log("Executing schema migrations...");
    for (const statement of statements) {
      console.log(`Executing:\n${statement.trim()}\n`);
      await db.execute(statement);
    }

    console.log("✅ Database migration successful!");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    process.exit(1);
  } finally {
    db.close();
    console.log("Database connection closed.");
  }
}

main();
