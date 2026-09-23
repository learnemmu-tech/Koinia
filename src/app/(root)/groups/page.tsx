import { redirect } from "next/navigation";

/** Groups list lives on Community → Groups tab; keep route for bookmarks/notifications. */
export default function GroupsPage() {
  redirect("/community?tab=groups");
}
