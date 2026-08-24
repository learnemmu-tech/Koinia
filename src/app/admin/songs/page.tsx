import { redirect } from "next/navigation";

export default function AdminSongsRedirectPage() {
  redirect("/dashboard/songs");
}
