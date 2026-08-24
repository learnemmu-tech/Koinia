import { redirect } from "next/navigation";

export default function AdminPrayersRedirectPage() {
  redirect("/dashboard/prayers");
}
