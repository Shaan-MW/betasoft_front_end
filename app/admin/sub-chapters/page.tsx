import { Suspense } from "react";
import { SubChaptersManager } from "./sub-chapters-manager";

export default function AdminSubChaptersPage() {
  return (
    <Suspense fallback={<p className="px-4 py-4 text-sm text-[#5C6B61]">Loading sub chapters...</p>}>
      <SubChaptersManager />
    </Suspense>
  );
}
