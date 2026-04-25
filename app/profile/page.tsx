import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeIdea } from "@/lib/serialization";
import { IdeaCard } from "@/components/IdeaCard";
import { STATUS_LABELS } from "@/lib/constants";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ideasRaw = await prisma.idea.findMany({ where: { submitterId: user.id }, include: { tags: true, submitter: { select: { id: true, name: true } } }, orderBy: [{ submittedAt: "desc" }] });
  const ideas = ideasRaw.map(serializeIdea);
  return <div className="profile-grid"><section className="panel"><div className="detail-top"><div><div className="section-kicker">Личный кабинет</div><h1 className="sub-title" style={{marginBottom:8}}>{user.name}</h1><div className="muted">{user.email}</div></div><Link href="/ideas/new" className="button button-primary">Новая идея</Link></div>{user.canSubmit ? <div className="success-box">Отправка новых заявок разрешена.</div> : <div className="error-box">Отправка новых заявок запрещена.{user.banReason ? ` Причина: ${user.banReason}` : ""}</div>}</section><section className="section" style={{width:"100%",padding:0}}><div className="detail-top" style={{marginBottom:18}}><div><div className="section-kicker">Мои работы</div><h2 className="sub-title">Все отправленные идеи</h2></div></div><div className="ideas-grid">{ideas.map((idea) => <div key={idea.id}><IdeaCard idea={idea} showStatus />{(idea.status === "REJECTED" || idea.status === "REMOVED") && <div className="info-box" style={{marginTop:12}}>Статус: <strong>{STATUS_LABELS[idea.status]}</strong>{ideasRaw.find((item) => item.id === idea.id)?.rejectionReason ? ` · Причина: ${ideasRaw.find((item) => item.id === idea.id)?.rejectionReason}` : ""}</div>}</div>)}</div>{ideas.length === 0 && <div className="empty-box">У тебя пока нет отправленных работ.</div>}</section></div>;
}
