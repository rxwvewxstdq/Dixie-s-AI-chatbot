import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendIdeaApprovedEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  const { id } = await params;
  const idea = await prisma.idea.findUnique({ where: { id }, include: { submitter: true } });
  if (!idea) return NextResponse.json({ error: "Работа не найдена." }, { status: 404 });
  await prisma.$transaction([
    prisma.idea.update({ where: { id }, data: { status: "APPROVED", rejectionReason: null, moderatedAt: new Date(), publishedAt: new Date(), moderatorId: admin.id } }),
    prisma.moderationLog.create({ data: { action: "APPROVE_IDEA", moderatorId: admin.id, ideaId: id, targetUserId: idea.submitterId } })
  ]);
  await sendIdeaApprovedEmail(idea.submitter.name, idea.submitter.email, idea.title, idea.id, idea.submitter.id);
  return NextResponse.json({ ok: true });
}
