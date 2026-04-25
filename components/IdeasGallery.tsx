"use client";

import { useMemo, useState } from "react";
import { TAG_OPTIONS } from "@/lib/constants";
import { IdeaCard } from "@/components/IdeaCard";

export function IdeasGallery({ ideas }: { ideas: Array<{ id: string; title: string; description: string; imagePath: string; voteCount: number; commentsCount: number; tags: string[]; publishedAt: string | null; submitter: { name: string } }> }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("Все");

  const filtered = useMemo(() => {
    return ideas.filter((idea) => {
      const text = `${idea.title} ${idea.description} ${idea.submitter.name} ${idea.tags.join(" ")}`.toLowerCase();
      return text.includes(query.toLowerCase()) && (tag === "Все" || idea.tags.includes(tag));
    });
  }, [ideas, query, tag]);

  return (
    <section className="section">
      <div className="filters-grid">
        <input className="input" placeholder="Поиск по названию, описанию, тегам" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="input" value={tag} onChange={(e) => setTag(e.target.value)}>
          <option>Все</option>
          {TAG_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div className="ideas-grid">
        {filtered.map((idea) => <IdeaCard key={idea.id} idea={idea} />)}
      </div>
      {filtered.length === 0 && <div className="empty-box">По этим условиям работы не найдены.</div>}
    </section>
  );
}
