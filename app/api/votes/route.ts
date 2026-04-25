import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужно войти в аккаунт." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const ideaId = body?.ideaId;
  if (!ideaId) return NextResponse.json({ error: "Не передан идентификатор идеи." }, { status: 400 });
  const idea = await prisma.idea.findUnique({ where: { id: ideaId }, include: { votes: true } });
  if (!idea || idea.status !== "APPROVED") return NextResponse.json({ error: "Голосование доступно только для опубликованных работ." }, { status: 404 });
  if (idea.submitterId === user.id) return NextResponse.json({ error: "Нельзя голосовать за свою работу." }, { status: 400 });
  if (idea.votes.some((vote) => vote.userId === user.id)) return NextResponse.json({ error: "Ты уже голосовал за эту работу." }, { status: 409 });
  await prisma.$transaction([
    prisma.vote.create({ data: { ideaId, userId: user.id } }),
    prisma.idea.update({ where: { id: ideaId }, data: { voteCount: { increment: 1 } } })
  ]);
  return NextResponse.json({ ok: true });
}
