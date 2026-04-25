import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminDashboard } from "@/components/AdminDashboard";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  const [pendingIdeas, reports, users, pending, openReports, approved] = await Promise.all([
    prisma.idea.findMany({ where: { status: "PENDING" }, include: { tags: true, submitter: { select: { id: true, name: true, email: true, canSubmit: true, banReason: true } } }, orderBy: { submittedAt: "asc" } }),
    prisma.report.findMany({ where: { status: "OPEN" }, include: { user: { select: { name: true, email: true } }, idea: { select: { id: true, title: true, imagePath: true, status: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, canSubmit: true, banReason: true, _count: { select: { ideas: true } }, ideas: { where: { status: "APPROVED" }, select: { id: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.idea.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.idea.count({ where: { status: "APPROVED" } })
  ]);
  const usersCount = users.length;
  return <AdminDashboard stats={{ pending, openReports, users: usersCount, approved }} pendingIdeas={pendingIdeas.map((idea) => ({ id: idea.id, title: idea.title, description: idea.description, imagePath: idea.imagePath, status: idea.status, submittedAt: idea.submittedAt.toISOString(), tags: idea.tags.map((tag) => tag.label), submitter: idea.submitter }))} reports={reports.map((report) => ({ id: report.id, reason: report.reason, details: report.details, createdAt: report.createdAt.toISOString(), status: report.status, user: report.user, idea: report.idea }))} users={users.map((item) => ({ id: item.id, name: item.name, email: item.email, role: item.role, canSubmit: item.canSubmit, banReason: item.banReason, ideasCount: item._count.ideas, approvedCount: item.ideas.length }))} />;
}
