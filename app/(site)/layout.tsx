import { Suspense } from "react";
import { Navbar } from "@/components/navbar";

function NavbarFallback() {
  return <div className="h-16 border-b-[5px] border-[#f37021] bg-white shadow-sm" aria-hidden="true" />;
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<NavbarFallback />}>
        <Navbar />
      </Suspense>
      {children}
    </>
  );
}
