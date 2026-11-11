import { Suspense } from "react";
import { VideosManager } from "./videos-manager";

export default function AdminSubChapterVideosPage() {
  return (
    <Suspense fallback={<p className="px-4 py-4 text-sm text-[#5C6B61]">Loading videos...</p>}>
      <VideosManager />
    </Suspense>
  );
}
