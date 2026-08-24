import { redirect } from "next/navigation";

export default function AdminSermonsPage() {
  redirect("/dashboard/content?tab=sermons");
}
