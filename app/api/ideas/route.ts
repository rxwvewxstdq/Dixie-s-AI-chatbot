import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveUploadedImage } from "@/lib/storage";
import { sendAdminPendingIdeaEmail, sendIdeaSubmittedEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужно войти в аккаунт." }, { status: 401 });
  if (!user.canSubmit) return NextResponse.json({ error: user.banReason || "Отправка заявок запрещена." }, { status: 403 });

  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const image = formData.get("image");
  const tags = formData.getAll("tags").map((v) => String(v).trim()).filter(Boolean);

  if (!title || !description) return NextResponse.json({ error: "Название и описание обязательны." }, { status: 400 });
  if (!image || !(image instanceof File)) return NextResponse.json({ error: "Нужно загрузить изображение." }, { status: 400 });
  if (tags.length === 0) return NextResponse.json({ error: "Выбери хотя бы один тег." }, { status: 400 });

  let imagePath = "";
  try {
    imagePath = await saveUploadedImage(image);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось сохранить изображение." }, { status: 400 });
  }

  const idea = await prisma.idea.create({
    data: {
      title,
      description,
      imagePath,
      status: "PENDING",
      submitterId: user.id,
      tags: { create: tags.map((label) => ({ label })) }
    }
  });

  await sendIdeaSubmittedEmail(user.name, user.email, idea.title, user.id);
  await sendAdminPendingIdeaEmail(idea.title, user.name);
  return NextResponse.json({ ok: true, id: idea.id });
}
