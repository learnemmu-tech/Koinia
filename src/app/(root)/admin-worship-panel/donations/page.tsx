import { redirect } from "next/navigation";

export default function AdminDonationsPage() {
  redirect("/dashboard/content?tab=donations");
}
