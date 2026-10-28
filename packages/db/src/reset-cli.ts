import { closeDb, resolveDbPath } from "./client.ts";
import { resetDb } from "./seed.ts";

resetDb();
closeDb();
console.log(`Database reset at ${resolveDbPath()}`);
