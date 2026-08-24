import { redirect } from "next/navigation";

export default function AdminArticlesRedirectPage() {
  redirect("/dashboard/articles");
}
