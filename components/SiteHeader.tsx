import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

export function SiteHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="site-header">
      <div className="container header-row">
        <Link href="/" className="brand">
          <div className="brand-badge">D</div>
          <div>
            <div className="brand-kicker">Платформа идей</div>
            <div className="brand-title">{APP_NAME}</div>
          </div>
        </Link>

        <nav className="nav">
          <Link href="/">Галерея</Link>
          {user && <Link href="/ideas/new">Отправить идею</Link>}
          {user && <Link href="/profile">Мой кабинет</Link>}
          {user?.role === "ADMIN" && <Link href="/admin">Админка</Link>}
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <div className="user-pill">
                <span className="user-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
                <div>
                  <div className="user-name">{user.name}</div>
                  <div className="user-role">{user.role === "ADMIN" ? "Администратор" : "Пользователь"}</div>
                </div>
              </div>
              <form action="/api/logout" method="post">
                <button className="button button-secondary" type="submit">Выйти</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="button button-secondary">Войти</Link>
              <Link href="/register" className="button button-primary">Регистрация</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
