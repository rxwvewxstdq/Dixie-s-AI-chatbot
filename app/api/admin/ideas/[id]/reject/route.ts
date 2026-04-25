import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendIdeaRejectedEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const reason = String(body?.reason || "").trim() || "Нарушает правила платформы";
  const { id } = await params;
  const idea = await prisma.idea.findUnique({ where: { id }, include: { submitter: true } });
  if (!idea) return NextResponse.json({ error: "Работа не найдена." }, { status: 404 });
  await prisma.$transaction([
    prisma.idea.update({ where: { id }, data: { status: "REJECTED", rejectionReason: reason, moderatedAt: new Date(), moderatorId: admin.id } }),
    prisma.moderationLog.create({ data: { action: "REJECT_IDEA", note: reason, moderatorId: admin.id, ideaId: id, targetUserId: idea.submitterId } })
  ]);
  await sendIdeaRejectedEmail(idea.submitter.name, idea.submitter.email, idea.title, reason, idea.submitter.id);
  return NextResponse.json({ ok: true });
}
