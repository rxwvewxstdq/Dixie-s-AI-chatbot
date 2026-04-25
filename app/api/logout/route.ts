import { NextResponse } from "next/server";
import { clearSessionCookie, deleteSessionByToken, getSessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const token = await getSessionToken();
  if (token) await deleteSessionByToken(token);
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/", process.env.APP_URL || "http://localhost:3000"), 303);
}
