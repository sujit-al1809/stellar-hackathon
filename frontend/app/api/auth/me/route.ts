// GET /api/auth/me — get current session user
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUserById } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.wallet_address,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    console.error("[me]", err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
