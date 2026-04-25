"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export function AdminDashboard({ stats, pendingIdeas, reports, users }: { stats: { pending: number; openReports: number; users: number; approved: number }; pendingIdeas: Array<{ id: string; title: string; description: string; imagePath: string; status: string; submittedAt: string; tags: string[]; submitter: { id: string; name: string; email: string; canSubmit: boolean; banReason: string | null } }>; reports: Array<{ id: string; reason: string; details: string | null; createdAt: string; status: string; user: { name: string; email: string }; idea: { id: string; title: string; imagePath: string; status: string } }>; users: Array<{ id: string; name: string; email: string; role: string; canSubmit: boolean; banReason: string | null; ideasCount: number; approvedCount: number }>; }) {
  const router = useRouter();
  const [tab, setTab] = useState<"ideas" | "reports" | "users">("ideas");
  const [actionError, setActionError] = useState("");

  async function send(path: string, body?: Record<string, string>) {
    setActionError("");
    const response = await fetch(path, { method: "POST", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setActionError(data?.error || "Не удалось выполнить действие."); return; }
    router.refresh();
  }

  return (
    <div className="section">
      <div className="admin-hero">
        <div>
          <div className="section-kicker">Модерация и контроль</div>
          <h1 className="page-title">Административная панель</h1>
          <p className="muted">Здесь администратор одобряет идеи, отклоняет непристойный контент, разбирает жалобы и управляет правом пользователей на отправку заявок.</p>
        </div>
        <div className="stats-grid compact">
          <div className="stat-card"><div className="stat-label">На модерации</div><div className="stat-value">{stats.pending}</div></div>
          <div className="stat-card"><div className="stat-label">Открытые жалобы</div><div className="stat-value">{stats.openReports}</div></div>
          <div className="stat-card"><div className="stat-label">Пользователи</div><div className="stat-value">{stats.users}</div></div>
          <div className="stat-card"><div className="stat-label">Опубликовано</div><div className="stat-value">{stats.approved}</div></div>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === "ideas" ? "tab active" : "tab"} onClick={() => setTab("ideas")}>Очередь заявок</button>
        <button className={tab === "reports" ? "tab active" : "tab"} onClick={() => setTab("reports")}>Жалобы</button>
        <button className={tab === "users" ? "tab active" : "tab"} onClick={() => setTab("users")}>Пользователи</button>
      </div>

      {actionError && <div className="error-box">{actionError}</div>}

      {tab === "ideas" && <div className="stack">{pendingIdeas.length === 0 ? <div className="empty-box">Новых заявок на модерацию нет.</div> : pendingIdeas.map((idea) => <div key={idea.id} className="admin-card"><img src={idea.imagePath} alt={idea.title} className="admin-card-image" /><div className="admin-card-body"><div className="admin-card-top"><div><div className="admin-card-title">{idea.title}</div><div className="muted">Автор: {idea.submitter.name} · {idea.submitter.email}</div></div><span className={`status-badge status-${idea.status.toLowerCase()}`}>{STATUS_LABELS[idea.status]}</span></div><p className="admin-card-description">{idea.description}</p><div className="tag-row">{idea.tags.map((tag) => <span key={tag} className="mini-tag">{tag}</span>)}</div><div className="muted">Отправлено: {formatDate(idea.submittedAt)}</div><div className="action-row"><button className="button button-primary" onClick={() => send(`/api/admin/ideas/${idea.id}/approve`)}>Одобрить</button><button className="button button-danger" onClick={() => { const reason = window.prompt("Укажи причину отклонения", "Нарушает правила платформы"); if (!reason) return; send(`/api/admin/ideas/${idea.id}/reject`, { reason }); }}>Отклонить</button>{idea.submitter.canSubmit ? <button className="button button-secondary" onClick={() => { const reason = window.prompt("Причина запрета на отправку заявок", "Нарушение правил"); if (!reason) return; send(`/api/admin/users/${idea.submitter.id}/ban-submissions`, { reason }); }}>Запретить отправку</button> : <button className="button button-secondary" onClick={() => send(`/api/admin/users/${idea.submitter.id}/unban-submissions`)}>Снять запрет</button>}</div></div></div>)}</div>}

      {tab === "reports" && <div className="stack">{reports.length === 0 ? <div className="empty-box">Жалоб пока нет.</div> : reports.map((report) => <div key={report.id} className="admin-card"><img src={report.idea.imagePath} alt={report.idea.title} className="admin-card-image" /><div className="admin-card-body"><div className="admin-card-top"><div><div className="admin-card-title">{report.idea.title}</div><div className="muted">Жалоба от {report.user.name} · {report.user.email}</div></div><span className="status-badge status-pending">{report.status}</span></div><div className="report-box"><div><strong>Причина:</strong> {report.reason}</div>{report.details && <div><strong>Комментарий:</strong> {report.details}</div>}<div><strong>Дата:</strong> {formatDate(report.createdAt)}</div></div><div className="action-row"><button className="button button-secondary" onClick={() => send(`/api/admin/reports/${report.id}/dismiss`)}>Отклонить жалобу</button><button className="button button-danger" onClick={() => send(`/api/admin/reports/${report.id}/take-down`)}>Снять работу с публикации</button></div></div></div>)}</div>}

      {tab === "users" && <div className="table-wrap"><table className="table"><thead><tr><th>Пользователь</th><th>Роль</th><th>Заявок</th><th>Опубликовано</th><th>Статус отправки</th><th></th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><div className="table-main">{user.name}</div><div className="table-sub">{user.email}</div></td><td>{user.role}</td><td>{user.ideasCount}</td><td>{user.approvedCount}</td><td>{user.canSubmit ? "Можно отправлять" : `Запрещено${user.banReason ? `: ${user.banReason}` : ""}`}</td><td>{user.role === "ADMIN" ? <span className="muted">—</span> : user.canSubmit ? <button className="button button-secondary" onClick={() => { const reason = window.prompt("Причина запрета", "Нарушение правил"); if (!reason) return; send(`/api/admin/users/${user.id}/ban-submissions`, { reason }); }}>Запретить</button> : <button className="button button-secondary" onClick={() => send(`/api/admin/users/${user.id}/unban-submissions`)}>Снять запрет</button>}</td></tr>)}</tbody></table></div>}
    </div>
  );
}
