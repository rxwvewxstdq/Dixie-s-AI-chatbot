"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { REPORT_REASONS } from "@/lib/constants";

export function IdeaInteractions({ ideaId, isLoggedIn, canVote, canComment, initialVoteCount }: { ideaId: string; isLoggedIn: boolean; canVote: boolean; canComment: boolean; initialVoteCount: number; }) {
  const router = useRouter();
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [voteLoading, setVoteLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [commentError, setCommentError] = useState("");
  const [reportError, setReportError] = useState("");
  const [voteError, setVoteError] = useState("");
  const [voteDone, setVoteDone] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  async function vote() {
    setVoteLoading(true); setVoteError("");
    const response = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ideaId }) });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setVoteError(data?.error || "Не удалось проголосовать."); setVoteLoading(false); return; }
    setVoteDone(true); setVoteCount((prev) => prev + 1); setVoteLoading(false); router.refresh();
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    setCommentLoading(true); setCommentError("");
    const response = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ideaId, content: comment }) });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setCommentError(data?.error || "Не удалось отправить комментарий."); setCommentLoading(false); return; }
    setComment(""); setCommentLoading(false); router.refresh();
  }

  async function submitReport(event: FormEvent) {
    event.preventDefault();
    setReportLoading(true); setReportError("");
    const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ideaId, reason: reportReason, details: reportDetails }) });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setReportError(data?.error || "Не удалось отправить жалобу."); setReportLoading(false); return; }
    setReportDone(true); setReportDetails(""); setReportLoading(false); router.refresh();
  }

  return (
    <div className="interactions-grid">
      <section className="panel" style={{ padding: 24 }}>
        <div className="section-kicker">Голосование</div><h2 className="sub-title">Поддержать идею</h2><div className="stat-big">{voteCount}</div><div className="muted">голосов</div>
        {!isLoggedIn && <div className="info-box">Чтобы голосовать, нужно войти в аккаунт.</div>}
        {voteError && <div className="error-box">{voteError}</div>}
        <button className="button button-primary button-full" onClick={vote} disabled={!isLoggedIn || !canVote || voteLoading || voteDone} type="button">{voteLoading ? "Голосуем..." : voteDone || !canVote ? "Голос уже учтён" : "Голосовать"}</button>
      </section>
      <section className="panel" style={{ padding: 24 }}>
        <div className="section-kicker">Комментарии</div><h2 className="sub-title">Добавить комментарий</h2>
        {!isLoggedIn && <div className="info-box">Комментарии доступны только авторизованным пользователям.</div>}
        {commentError && <div className="error-box">{commentError}</div>}
        <form className="form-stack" onSubmit={submitComment}>
          <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Что можно улучшить или что понравилось?" disabled={!isLoggedIn || !canComment || commentLoading} />
          <button className="button button-secondary" disabled={!isLoggedIn || !canComment || commentLoading} type="submit">{commentLoading ? "Отправка..." : "Оставить комментарий"}</button>
        </form>
      </section>
      <section className="panel" style={{ padding: 24 }}>
        <div className="section-kicker">Жалоба</div><h2 className="sub-title">Пожаловаться на принт</h2>
        {reportDone && <div className="success-box">Жалоба отправлена администратору.</div>}
        {reportError && <div className="error-box">{reportError}</div>}
        <form className="form-stack" onSubmit={submitReport}>
          <label className="field"><span>Причина</span><select className="input" value={reportReason} onChange={(e) => setReportReason(e.target.value)} disabled={!isLoggedIn}>{REPORT_REASONS.map((reason) => <option key={reason}>{reason}</option>)}</select></label>
          <label className="field"><span>Комментарий</span><textarea className="textarea" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Коротко объясни проблему" disabled={!isLoggedIn || reportLoading} /></label>
          <button className="button button-danger" disabled={!isLoggedIn || reportLoading} type="submit">{reportLoading ? "Отправка..." : "Отправить жалобу"}</button>
        </form>
      </section>
    </div>
  );
}
