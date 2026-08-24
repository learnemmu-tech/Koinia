import { FirebaseWorshipTopItems } from "@/components/search/firebase-worship-top-items-server";
import { MobileSearch } from "./_components/mobile-search";

export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 overflow-x-hidden">
      <MobileSearch topSearch={<FirebaseWorshipTopItems />} />
    </div>
  );
}
