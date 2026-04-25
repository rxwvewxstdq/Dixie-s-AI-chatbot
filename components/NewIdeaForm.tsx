"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TAG_OPTIONS } from "@/lib/constants";

export function NewIdeaForm() {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedInfo = useMemo(() => selectedTags.length ? selectedTags.join(", ") : "Теги ещё не выбраны", [selectedTags]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    selectedTags.forEach((tag) => formData.append("tags", tag));
    const response = await fetch("/api/ideas", { method: "POST", body: formData });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error || "Не удалось отправить идею.");
      setLoading(false);
      return;
    }
    router.push("/profile");
    router.refresh();
  }

  return (
    <div className="split-layout">
      <form className="panel form-stack" style={{ padding: 24 }} onSubmit={handleSubmit}>
        <div>
          <div className="section-kicker">Новая заявка</div>
          <h1 className="page-title">Отправить принт или концепт</h1>
          <p className="muted">Работа сначала уйдёт на модерацию. Администратор проверит соответствие правилам и только потом опубликует её в голосовании.</p>
        </div>
        <label className="field"><span>Название</span><input className="input" name="title" required /></label>
        <label className="field"><span>Описание</span><textarea className="textarea" name="description" required /></label>
        <div className="field"><span>Теги применения</span><div className="tags-wrap">{TAG_OPTIONS.map((tag) => <button type="button" key={tag} onClick={() => toggleTag(tag)} className={selectedTags.includes(tag) ? "tag-button tag-button-active" : "tag-button"}>{tag}</button>)}</div></div>
        <label className="field"><span>Изображение</span><input className="input" name="image" type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml" required onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} /></label>
        {error && <div className="error-box">{error}</div>}
        <button className="button button-primary button-full" disabled={loading} type="submit">{loading ? "Отправка..." : "Отправить на модерацию"}</button>
      </form>
      <aside className="panel preview-panel" style={{ padding: 24 }}>
        <div className="section-kicker">Предпросмотр</div>
        <h2 className="sub-title">Как это выглядит</h2>
        <div className="preview-image-box">{preview ? <img src={preview} alt="preview" className="preview-image" /> : <div className="muted">Изображение появится здесь</div>}</div>
        <div className="info-list">
          <div><strong>Выбранные теги:</strong><div className="muted">{selectedInfo}</div></div>
          <div><strong>Что будет дальше:</strong><div className="muted">Сначала — проверка администратором, затем публикация либо отклонение с причиной.</div></div>
        </div>
      </aside>
    </div>
  );
}
