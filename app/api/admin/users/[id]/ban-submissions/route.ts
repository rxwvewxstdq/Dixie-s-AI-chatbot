import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const reason = String(body?.reason || "").trim() || "Нарушение правил платформы";
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });
  if (user.role === "ADMIN") return NextResponse.json({ error: "Нельзя заблокировать отправку заявок администратору." }, { status: 400 });
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { canSubmit: false, banReason: reason, bannedAt: new Date() } }),
    prisma.moderationLog.create({ data: { action: "BAN_SUBMISSIONS", note: reason, moderatorId: admin.id, targetUserId: id } })
  ]);
  return NextResponse.json({ ok: true });
}
