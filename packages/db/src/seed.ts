import { getDb } from "./client.ts";
import { createSchema, dropSchema } from "./schema.ts";
import { seed } from "./seed-data.ts";

export function resetDb(): void {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    dropSchema(db);
    createSchema(db);
    seed(db);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
