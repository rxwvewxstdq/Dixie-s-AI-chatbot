import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { IdeaInteractions } from "@/components/IdeaInteractions";
import { formatDate } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/constants";

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const idea = await prisma.idea.findUnique({ where: { id }, include: { tags: true, submitter: { select: { id: true, name: true, email: true } }, comments: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } }, votes: { select: { userId: true } } } });
  if (!idea) notFound();
  const canView = idea.status === "APPROVED" || (!!user && (user.id === idea.submitter.id || user.role === "ADMIN"));
  if (!canView) redirect("/");
  const alreadyVoted = !!user && idea.votes.some((vote) => vote.userId === user.id);
  const canVote = !!user && user.id !== idea.submitter.id && !alreadyVoted && idea.status === "APPROVED";
  return <div className="detail-layout"><section className="detail-box"><img src={idea.imagePath} alt={idea.title} className="detail-image" /><div className="panel"><div className="detail-top"><div><div className="section-kicker">Карточка идеи</div><h1 className="sub-title">{idea.title}</h1></div><span className={`status-badge status-${idea.status.toLowerCase()}`}>{STATUS_LABELS[idea.status]}</span></div><div className="tag-row" style={{marginBottom:12}}>{idea.tags.map((tag) => <span key={tag.id} className="mini-tag">{tag.label}</span>)}</div><div className="hero-text" style={{color:"#1f2937"}}>{idea.description}</div><div className="info-list" style={{marginTop:18}}><div className="info-box"><strong>Автор:</strong> {idea.submitter.name}</div><div className="info-box"><strong>Дата отправки:</strong> {formatDate(idea.submittedAt)}</div>{idea.publishedAt && <div className="info-box"><strong>Дата публикации:</strong> {formatDate(idea.publishedAt)}</div>}<div className="info-box"><strong>Голосов:</strong> {idea.voteCount} · <strong>Комментариев:</strong> {idea.commentsCount}</div>{(idea.status === "REJECTED" || idea.status === "REMOVED") && idea.rejectionReason && <div className="error-box"><strong>Причина решения модератора:</strong> {idea.rejectionReason}</div>}</div></div><section className="panel"><div className="section-kicker">Комментарии</div><h2 className="sub-title">Обсуждение</h2><div className="comments-list">{idea.comments.map((comment) => <article key={comment.id} className="comment-item"><div className="comment-head"><span>{comment.user.name}</span><span>{formatDate(comment.createdAt)}</span></div><div>{comment.content}</div></article>)}{idea.comments.length === 0 && <div className="empty-box">Комментариев пока нет.</div>}</div></section></section><aside className="detail-box">{idea.status === "APPROVED" ? <IdeaInteractions ideaId={idea.id} isLoggedIn={!!user} canVote={canVote} canComment={idea.status === "APPROVED"} initialVoteCount={idea.voteCount} /> : <div className="panel"><div className="section-kicker">Модерация</div><h2 className="sub-title">Эта работа пока недоступна для голосования</h2><div className="info-box">Голосование и жалобы доступны только для опубликованных идей. Текущий статус: {STATUS_LABELS[idea.status]}.</div></div>}</aside></div>;
}
