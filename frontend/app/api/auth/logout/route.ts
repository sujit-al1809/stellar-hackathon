// POST /api/auth/logout — clear session cookie
import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[logout]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
