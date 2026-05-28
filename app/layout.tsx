import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import ChatButton from "@/components/ChatButton";

export const metadata = {
  title: "Dixy Ideas",
  description: "Платформа пользовательских принтов, голосования и модерации"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="ru">
      <body>
        <SiteHeader user={user} />
        <main className="page-shell">{children}</main>
        <ChatButton />
      </body>
    </html>
  );
}

