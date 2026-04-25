import Link from "next/link";
import { prisma } from "@/lib/db";
import { serializeIdea } from "@/lib/serialization";
import { IdeasGallery } from "@/components/IdeasGallery";

export default async function HomePage() {
  const [ideasRaw, topAuthors, approvedCount, votesCount, commentsCount, usersCount] = await Promise.all([
    prisma.idea.findMany({ where: { status: "APPROVED" }, include: { tags: true, submitter: { select: { id: true, name: true } } }, orderBy: [{ voteCount: "desc" }, { publishedAt: "desc" }] }),
    prisma.user.findMany({ where: { ideas: { some: { status: "APPROVED" } } }, select: { id: true, name: true, _count: { select: { ideas: true } } }, take: 4, orderBy: { ideas: { _count: "desc" } } }),
    prisma.idea.count({ where: { status: "APPROVED" } }),
    prisma.vote.count(),
    prisma.comment.count(),
    prisma.user.count()
  ]);

  const ideas = ideasRaw.map(serializeIdea);

  return (
    <>
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-card">
            <div className="section-kicker">Реальная платформа для идей</div>
            <h1 className="page-title">Принты, игрушки, фасады и новые идеи для <span style={{ color: "#ea580c" }}>Дикси</span></h1>
            <p className="hero-text">Пользователи отправляют свои концепты, администратор сначала проверяет их на правила и пристойность, а затем лучшие идеи выходят на голосование. Комментарии, жалобы и модерация уже встроены.</p>
            <div className="hero-actions"><Link href="/ideas/new" className="button button-primary">Отправить идею</Link><Link href="/register" className="button button-secondary">Создать аккаунт</Link></div>
          </div>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">Опубликовано работ</div><div className="stat-value">{approvedCount}</div></div>
            <div className="stat-card"><div className="stat-label">Всего голосов</div><div className="stat-value">{votesCount}</div></div>
            <div className="stat-card"><div className="stat-label">Комментариев</div><div className="stat-value">{commentsCount}</div></div>
            <div className="stat-card"><div className="stat-label">Пользователей</div><div className="stat-value">{usersCount}</div></div>
          </div>
        </div>
      </section>
      <section className="section"><div className="panel"><div className="section-kicker">Почему это удобно</div><h2 className="sub-title">Сначала модерация, потом голосование</h2><ul className="rule-list"><li>Все новые принты сначала попадают в очередь администратора.</li><li>Непристойный или нарушающий правила контент можно отклонить до публикации.</li><li>Пользователям можно запретить новые отправки при нарушениях.</li><li>На опубликованные работы можно оставлять комментарии и жалобы.</li></ul></div></section>
      <section className="section"><div className="panel"><div className="section-kicker">Авторы</div><h2 className="sub-title">Активные участники</h2><div className="tag-row">{topAuthors.map((author) => <div key={author.id} className="user-pill"><span className="user-avatar">{author.name.slice(0,1).toUpperCase()}</span><div><div className="user-name">{author.name}</div><div className="user-role">{author._count.ideas} работ</div></div></div>)}</div></div></section>
      <IdeasGallery ideas={ideas} />
    </>
  );
}
