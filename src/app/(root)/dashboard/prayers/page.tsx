import { redirect } from "next/navigation";

export default function AdminPrayersPage() {
  redirect("/dashboard/content?tab=prayers");
}
