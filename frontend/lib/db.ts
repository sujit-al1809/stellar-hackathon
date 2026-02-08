// ============================================================
// In-Memory Database — for Vercel serverless deployment
// SQLite doesn't work on Vercel, so we use in-memory storage
// ============================================================

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

// In-memory users store with demo accounts pre-seeded
const users: Map<string, UserRow> = new Map([
  [
    "demo-trader-001",
    {
      id: "demo-trader-001",
      name: "Demo Trader",
      email: "trader@stratflow.io",
      password: "$2a$10$demohashedpasswordfortrader123456789", // demo123
      role: "trader",
      wallet_address: "GDEMO...TRADER",
      created_at: new Date().toISOString(),
    },
  ],
  [
    "demo-expert-001",
    {
      id: "demo-expert-001",
      name: "Demo Expert",
      email: "expert@stratflow.io",
      password: "$2a$10$demohashedpasswordforexpert123456789", // demo123
      role: "expert",
      wallet_address: "GDEMO...EXPERT",
      created_at: new Date().toISOString(),
    },
  ],
]);

// ── Queries ─────────────────────────────────────────
export function findUserByEmail(email: string): UserRow | undefined {
  const allUsers = Array.from(users.values());
  for (const user of allUsers) {
    if (user.email === email) return user;
  }
  return undefined;
}

export function findUserById(id: string): UserRow | undefined {
  return users.get(id);
}

export function createUser(user: Omit<UserRow, "created_at">): UserRow {
  const newUser: UserRow = {
    ...user,
    created_at: new Date().toISOString(),
  };
  users.set(user.id, newUser);
  return newUser;
}

export function getAllUsers(): UserRow[] {
  return Array.from(users.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// Dummy getDb for compatibility (does nothing)
export function getDb() {
  return null;
}
