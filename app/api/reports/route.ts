import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendAdminReportEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужно войти в аккаунт." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const ideaId = body?.ideaId;
  const reason = String(body?.reason || "").trim();
  const details = String(body?.details || "").trim();
  if (!ideaId || !reason) return NextResponse.json({ error: "Укажи причину жалобы." }, { status: 400 });
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea || idea.status !== "APPROVED") return NextResponse.json({ error: "Жалобу можно оставить только на опубликованную работу." }, { status: 404 });
  if (await prisma.report.findUnique({ where: { userId_ideaId: { userId: user.id, ideaId } } })) return NextResponse.json({ error: "Ты уже отправлял жалобу на эту работу." }, { status: 409 });
  await prisma.$transaction([
    prisma.report.create({ data: { ideaId, userId: user.id, reason, details: details || null } }),
    prisma.idea.update({ where: { id: ideaId }, data: { reportCount: { increment: 1 } } })
  ]);
  await sendAdminReportEmail(idea.title, reason);
  return NextResponse.json({ ok: true });
}
