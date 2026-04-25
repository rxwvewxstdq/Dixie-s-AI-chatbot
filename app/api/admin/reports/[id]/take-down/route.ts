import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id }, include: { idea: true } });
  if (!report) return NextResponse.json({ error: "Жалоба не найдена." }, { status: 404 });
  await prisma.$transaction([
    prisma.report.update({ where: { id }, data: { status: "TAKEN_DOWN", resolverId: admin.id, resolvedAt: new Date() } }),
    prisma.idea.update({ where: { id: report.ideaId }, data: { status: "REMOVED", rejectionReason: "Работа снята с публикации по итогам жалобы и проверки администратора.", moderatedAt: new Date(), moderatorId: admin.id } }),
    prisma.moderationLog.create({ data: { action: "TAKE_DOWN_IDEA", note: "Работа снята после жалобы", moderatorId: admin.id, ideaId: report.ideaId, targetUserId: report.idea.submitterId } })
  ]);
  return NextResponse.json({ ok: true });
}
