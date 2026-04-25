import { NextResponse } from "next/server";
import { createSession, hashPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const email = body?.email?.trim()?.toLowerCase();
  const password = body?.password?.trim();
  if (!name || !email || !password) return NextResponse.json({ error: "Заполни имя, email и пароль." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Пароль должен быть не короче 8 символов." }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: "Пользователь с таким email уже существует." }, { status: 409 });
  const user = await prisma.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
  const session = await createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);
  await sendWelcomeEmail(user.name, user.email, user.id);
  return NextResponse.json({ ok: true });
}
