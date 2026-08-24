import { redirect } from "next/navigation";

export default function AdminDonationsPage() {
  redirect("/dashboard/church-settings?tab=donations");
}
