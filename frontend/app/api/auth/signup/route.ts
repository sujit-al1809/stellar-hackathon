// POST /api/auth/signup — create a new user account
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, createUser } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    // Validate
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const validRoles = ["expert", "trader", "verifier", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if email already exists
    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const user = createUser({
      id: userId,
      name,
      email,
      password: hashedPassword,
      role,
      wallet_address: null,
    });

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
    console.error("[signup]", err);
    return NextResponse.json({ error: err.message || "Signup failed" }, { status: 500 });
  }
}
