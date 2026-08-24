import { redirect } from "next/navigation";

export default function AdminSongsPage() {
  redirect("/dashboard/content?tab=songs");
}
