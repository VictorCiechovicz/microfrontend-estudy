import { getDb } from "../client.ts";
import type { User } from "../schema.ts";

export function listUsers(): User[] {
  return getDb()
    .prepare("SELECT id, name FROM users ORDER BY id")
    .all() as User[];
}

export function getUser(id: number): User | null {
  const row = getDb()
    .prepare("SELECT id, name FROM users WHERE id = ?")
    .get(id);
  return (row as User | undefined) ?? null;
}

export function updateProfile(userId: number, name: string): void {
  getDb().prepare("UPDATE users SET name = ? WHERE id = ?").run(name, userId);
}
