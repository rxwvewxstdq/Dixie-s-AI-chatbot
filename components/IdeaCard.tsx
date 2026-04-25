import Link from "next/link";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export function IdeaCard({
  idea,
  showStatus = false
}: {
  idea: {
    id: string;
    title: string;
    description: string;
    imagePath: string;
    voteCount: number;
    commentsCount: number;
    tags: string[];
    publishedAt: string | null;
    submitter: { name: string };
    status?: string;
  };
  showStatus?: boolean;
}) {
  return (
    <article className="idea-card">
      <Link href={`/ideas/${idea.id}`} className="idea-image-wrap">
        <img src={idea.imagePath} alt={idea.title} className="idea-image" />
      </Link>
      <div className="idea-card-body">
        <div className="idea-card-top">
          <div className="tag-row">
            {idea.tags.map((tag) => (
              <span key={tag} className="mini-tag">{tag}</span>
            ))}
          </div>
          {showStatus && idea.status && <span className={`status-badge status-${idea.status.toLowerCase()}`}>{STATUS_LABELS[idea.status]}</span>}
        </div>
        <Link href={`/ideas/${idea.id}`} className="idea-title">{idea.title}</Link>
        <p className="idea-description">{idea.description}</p>
        <div className="idea-meta">
          <span>Автор: {idea.submitter.name}</span>
          <span>{idea.publishedAt ? formatDate(idea.publishedAt) : "ещё не опубликовано"}</span>
        </div>
        <div className="idea-stats">
          <span>👍 {idea.voteCount}</span>
          <span>💬 {idea.commentsCount}</span>
        </div>
      </div>
    </article>
  );
}
