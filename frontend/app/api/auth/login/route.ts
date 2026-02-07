// POST /api/auth/login — authenticate and set session
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, createUser } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

// Demo users — seeded on first login attempt
const DEMO_SEEDS: Record<string, { name: string; email: string; password: string; role: string }> = {
  "expert@stratflow.io": { name: "Alice Chen", email: "expert@stratflow.io", password: "demo123", role: "expert" },
  "trader@stratflow.io": { name: "Bob Martinez", email: "trader@stratflow.io", password: "demo123", role: "trader" },
  "verifier@stratflow.io": { name: "Carol Wang", email: "verifier@stratflow.io", password: "demo123", role: "verifier" },
  "admin@stratflow.io": { name: "Dave Kumar", email: "admin@stratflow.io", password: "demo123", role: "admin" },
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    let user = findUserByEmail(email);

    // Auto-seed demo user on first login attempt
    if (!user && DEMO_SEEDS[email]) {
      const demo = DEMO_SEEDS[email];
      if (password === demo.password) {
        const hashedPassword = await bcrypt.hash(demo.password, 12);
        user = createUser({
          id: `demo-${demo.role}`,
          name: demo.name,
          email: demo.email,
          password: hashedPassword,
          role: demo.role,
          wallet_address: null,
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Set session cookie
    await setSessionCookie({ userId: user.id, email: user.email, role: user.role });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    console.error("[login]", err);
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}
