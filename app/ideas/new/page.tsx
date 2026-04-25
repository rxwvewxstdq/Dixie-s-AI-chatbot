import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NewIdeaForm } from "@/components/NewIdeaForm";

export default async function NewIdeaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.canSubmit) {
    return <div className="auth-wrap"><div className="panel"><div className="section-kicker">Отправка идей</div><h1 className="sub-title">Отправка временно запрещена</h1><div className="error-box">Администратор запретил отправлять новые заявки.{user.banReason ? ` Причина: ${user.banReason}` : ""}</div></div></div>;
  }
  return <NewIdeaForm />;
}
