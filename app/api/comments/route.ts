import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужно войти в аккаунт." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const ideaId = body?.ideaId;
  const content = String(body?.content || "").trim();
  if (!ideaId || !content) return NextResponse.json({ error: "Нужно указать идею и текст комментария." }, { status: 400 });
  if (content.length < 3) return NextResponse.json({ error: "Комментарий слишком короткий." }, { status: 400 });
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea || idea.status !== "APPROVED") return NextResponse.json({ error: "Комментировать можно только опубликованные работы." }, { status: 404 });
  await prisma.$transaction([
    prisma.comment.create({ data: { ideaId, userId: user.id, content } }),
    prisma.idea.update({ where: { id: ideaId }, data: { commentsCount: { increment: 1 } } })
  ]);
  return NextResponse.json({ ok: true });
}
