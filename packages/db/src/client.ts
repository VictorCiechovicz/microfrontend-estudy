import { existsSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createSchema } from "./schema.ts";

const DEFAULT_DB_PATH = ".data/lab.sqlite";

const rootCache = new Map<string, string>();

function findRoot(from: string): string {
  const cached = rootCache.get(from);
  if (cached) return cached;
  const root = searchRoot(from);
  rootCache.set(from, root);
  return root;
}

function searchRoot(from: string): string {
  let dir = resolve(from);
  while (true) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(from);
    dir = parent;
  }
}

export function resolveDbPath(): string {
  const configured = process.env.LAB_DB_PATH || DEFAULT_DB_PATH;
  return isAbsolute(configured)
    ? configured
    : join(findRoot(process.cwd()), configured);
}

let current: { path: string; db: DatabaseSync } | null = null;

export function getDb(): DatabaseSync {
  const path = resolveDbPath();
  if (current && current.path === path) return current.db;
  closeDb();
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec("PRAGMA journal_mode = WAL");
  createSchema(db);
  current = { path, db };
  return db;
}

export function closeDb(): void {
  if (current) {
    current.db.close();
    current = null;
  }
}
