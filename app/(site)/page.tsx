import { ChapterBand } from "@/components/chapter-band";
import { ChapterCards } from "@/components/chapter-cards";
import { HeroSection } from "@/components/hero-section";

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />
      <ChapterBand />
      <ChapterCards />
    </main>
  );
}
