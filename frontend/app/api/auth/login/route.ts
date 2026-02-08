// POST /api/auth/login — authenticate and set session
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

// Demo users — password is "demo123"
const DEMO_ACCOUNTS: Record<string, { name: string; email: string; role: string }> = {
  "expert@stratflow.io": { name: "Alice Chen", email: "expert@stratflow.io", role: "expert" },
  "trader@stratflow.io": { name: "Bob Martinez", email: "trader@stratflow.io", role: "trader" },
  "verifier@stratflow.io": { name: "Carol Wang", email: "verifier@stratflow.io", role: "verifier" },
  "admin@stratflow.io": { name: "Dave Kumar", email: "admin@stratflow.io", role: "admin" },
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Check if it's a demo account with demo123 password
    const demoAccount = DEMO_ACCOUNTS[email];
    if (demoAccount && password === "demo123") {
      // Set session for demo user
      const userId = `demo-${demoAccount.role}-001`;
      await setSessionCookie({ userId, email: demoAccount.email, role: demoAccount.role });

      return NextResponse.json({
        user: {
          id: userId,
          name: demoAccount.name,
          email: demoAccount.email,
          role: demoAccount.role,
          createdAt: new Date().toISOString(),
        },
        message: "Login successful",
      });
    }

    // For non-demo users, check the database
    const user = findUserByEmail(email);

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
