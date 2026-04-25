import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Жалоба не найдена." }, { status: 404 });
  await prisma.report.update({ where: { id }, data: { status: "DISMISSED", resolverId: admin.id, resolvedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
