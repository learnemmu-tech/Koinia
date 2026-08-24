import { redirect } from "next/navigation";

export default function AdminArticlesPage() {
  redirect("/dashboard/content?tab=articles");
}
