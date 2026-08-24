import { RequireAuth } from "@/components/auth/require-auth";

export const metadata = {
  title: "Liked Songs",
  description: "Your liked songs in one place.",
};

export default function LikedSongsPage() {
  return (
    <RequireAuth>
      <div className="flex h-44 flex-col items-center justify-center rounded-md border border-dashed lg:h-[25rem]">
        <p className="text-muted-foreground">No liked songs yet.</p>
      </div>
    </RequireAuth>
  );
}
