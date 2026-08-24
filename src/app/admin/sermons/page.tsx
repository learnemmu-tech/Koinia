import { redirect } from "next/navigation";

export default function AdminSermonsRedirectPage() {
  redirect("/dashboard/sermons");
}
