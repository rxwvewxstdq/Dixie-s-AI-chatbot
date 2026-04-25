import { NextResponse } from "next/server";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = body?.email?.trim()?.toLowerCase();
  const password = body?.password?.trim();
  if (!email || !password) return NextResponse.json({ error: "Укажи email и пароль." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return NextResponse.json({ error: "Неверный email или пароль." }, { status: 401 });
  const session = await createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);
  return NextResponse.json({ ok: true });
}
