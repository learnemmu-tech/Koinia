import { redirect } from "next/navigation";

export default function AdminEventsPage() {
  redirect("/dashboard/content?tab=events");
}
