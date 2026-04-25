import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { canSubmit: true, banReason: null, bannedAt: null } }),
    prisma.moderationLog.create({ data: { action: "UNBAN_SUBMISSIONS", moderatorId: admin.id, targetUserId: id } })
  ]);
  return NextResponse.json({ ok: true });
}
