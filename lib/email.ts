import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

type SendEmailInput = { to: string; subject: string; html: string; type: string; userId?: string | null };

function layout(title: string, body: string, ctaLabel?: string, ctaUrl?: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#fff7ed;padding:24px;"><div style="max-width:640px;margin:0 auto;background:white;border-radius:20px;padding:32px;border:1px solid #fed7aa;"><div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#ea580c;margin-bottom:12px;">Dixy Ideas</div><h1 style="margin:0 0 16px;font-size:28px;color:#111827;">${title}</h1><div style="font-size:16px;line-height:1.7;color:#374151;">${body}</div>${ctaLabel && ctaUrl ? `<div style="margin-top:24px;"><a href="${ctaUrl}" style="display:inline-block;background:#f97316;color:white;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700;">${ctaLabel}</a></div>` : ""}<div style="margin-top:24px;font-size:13px;color:#6b7280;">Автоматическое письмо сервиса выбора принтов и идей для магазина Дикси.</div></div></div>`;
}

async function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function writePreview(subject: string, html: string) {
  const dir = path.join(process.cwd(), "storage", "emails");
  await mkdir(dir, { recursive: true });
  const safe = subject.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").slice(0, 40) || "email";
  const fileName = `${Date.now()}-${safe}.html`;
  await writeFile(path.join(dir, fileName), html, "utf8");
  return fileName;
}

export async function sendEmail(input: SendEmailInput) {
  const log = await prisma.emailNotification.create({
    data: { type: input.type, toEmail: input.to, subject: input.subject, html: input.html, status: "QUEUED", userId: input.userId || undefined }
  });

  const transporter = await createTransporter();
  if (!transporter) {
    const preview = await writePreview(input.subject, input.html);
    await prisma.emailNotification.update({ where: { id: log.id }, data: { status: "PREVIEW", providerMessageId: preview, sentAt: new Date() } });
    return;
  }

  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM || "Dixy Ideas <no-reply@dixy.local>",
    to: input.to,
    subject: input.subject,
    html: input.html
  });

  await prisma.emailNotification.update({ where: { id: log.id }, data: { status: "SENT", providerMessageId: result.messageId, sentAt: new Date() } });
}

export async function sendWelcomeEmail(name: string, email: string, userId?: string) {
  await sendEmail({
    to: email,
    subject: "Добро пожаловать в Dixy Ideas",
    type: "WELCOME",
    userId,
    html: layout(`Добро пожаловать, ${name}!`, `<p>Ты успешно зарегистрировался на платформе Dixy Ideas.</p><p>Теперь можно отправлять свои принты, комментировать работы и голосовать за лучшие идеи.</p>`, "Открыть сайт", absoluteUrl("/"))
  });
}

export async function sendIdeaSubmittedEmail(name: string, email: string, title: string, userId?: string) {
  await sendEmail({
    to: email,
    subject: "Ваша работа отправлена на модерацию",
    type: "IDEA_SUBMITTED",
    userId,
    html: layout("Идея отправлена на модерацию", `<p>${name}, твоя работа <strong>${title}</strong> успешно отправлена.</p><p>Сейчас она ожидает проверки администратора.</p>`, "Мои работы", absoluteUrl("/profile"))
  });
}

export async function sendIdeaApprovedEmail(name: string, email: string, title: string, ideaId: string, userId?: string) {
  await sendEmail({
    to: email,
    subject: "Ваша работа опубликована",
    type: "IDEA_APPROVED",
    userId,
    html: layout("Работа опубликована", `<p>${name}, работа <strong>${title}</strong> прошла модерацию и теперь участвует в голосовании.</p>`, "Открыть работу", absoluteUrl(`/ideas/${ideaId}`))
  });
}

export async function sendIdeaRejectedEmail(name: string, email: string, title: string, reason: string, userId?: string) {
  await sendEmail({
    to: email,
    subject: "Ваша работа отклонена",
    type: "IDEA_REJECTED",
    userId,
    html: layout("Работа отклонена", `<p>${name}, работа <strong>${title}</strong> не была опубликована.</p><p><strong>Причина:</strong> ${reason}</p>`, "Создать новую идею", absoluteUrl("/ideas/new"))
  });
}

export async function sendAdminPendingIdeaEmail(title: string, submitterName: string) {
  const to = process.env.ADMIN_EMAIL || "admin@dixy.local";
  await sendEmail({
    to,
    subject: "Новая заявка на модерацию",
    type: "ADMIN_PENDING_IDEA",
    html: layout("Новая заявка на модерацию", `<p>Пользователь <strong>${submitterName}</strong> отправил работу <strong>${title}</strong>.</p>`, "Открыть админку", absoluteUrl("/admin"))
  });
}

export async function sendAdminReportEmail(title: string, reason: string) {
  const to = process.env.ADMIN_EMAIL || "admin@dixy.local";
  await sendEmail({
    to,
    subject: "Новая жалоба на принт",
    type: "ADMIN_REPORT",
    html: layout("Новая жалоба на работу", `<p>На работу <strong>${title}</strong> поступила жалоба.</p><p><strong>Причина:</strong> ${reason}</p>`, "Проверить жалобы", absoluteUrl("/admin"))
  });
}
