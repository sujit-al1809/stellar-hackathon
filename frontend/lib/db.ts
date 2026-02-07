// ============================================================
// SQLite Database — users table for authentication
// ============================================================

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "stratflow.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");

    // Create users table if it doesn't exist
    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        email       TEXT UNIQUE NOT NULL,
        password    TEXT NOT NULL,
        role        TEXT NOT NULL CHECK(role IN ('expert','trader','verifier','admin','strategist','executor')),
        wallet_address TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Migrate old roles to new ones (strategist -> expert, executor -> trader)
    _db.exec(`
      UPDATE users SET role = 'expert' WHERE role = 'strategist';
      UPDATE users SET role = 'trader' WHERE role = 'executor';
    `);

    // Index for fast email lookups
    _db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
  }
  return _db;
}

// ── Row type ────────────────────────────────────────
export interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  wallet_address: string | null;
  created_at: string;
}

// ── Queries ─────────────────────────────────────────
export function findUserByEmail(email: string): UserRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
}

export function findUserById(id: string): UserRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function createUser(user: Omit<UserRow, "created_at">): UserRow {
  const db = getDb();
  db.prepare(
    "INSERT INTO users (id, name, email, password, role, wallet_address) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(user.id, user.name, user.email, user.password, user.role, user.wallet_address ?? null);
  return findUserById(user.id)!;
}

export function getAllUsers(): UserRow[] {
  const db = getDb();
  return db.prepare("SELECT * FROM users ORDER BY created_at DESC").all() as UserRow[];
}
