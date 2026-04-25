"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch(`/api/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error || "Не удалось выполнить действие.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form className="auth-card form-stack" onSubmit={onSubmit}>
      <div>
        <div className="section-kicker">{mode === "login" ? "Вход" : "Регистрация"}</div>
        <h1 className="page-title">{mode === "login" ? "Войти в аккаунт" : "Создать аккаунт"}</h1>
        <p className="muted">{mode === "login" ? "Используй email и пароль, чтобы голосовать, комментировать и отправлять идеи." : "После регистрации можно загружать работы и участвовать в голосовании."}</p>
      </div>
      {mode === "register" && <label className="field"><span>Имя</span><input className="input" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>}
      <label className="field"><span>Email</span><input className="input" type="email" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></label>
      <label className="field"><span>Пароль</span><input className="input" type="password" required value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} /></label>
      {error && <div className="error-box">{error}</div>}
      <button className="button button-primary button-full" disabled={loading} type="submit">{loading ? "Подождите..." : mode === "login" ? "Войти" : "Зарегистрироваться"}</button>
    </form>
  );
}
