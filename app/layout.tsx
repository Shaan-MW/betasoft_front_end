import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Betasoft LMS",
  description: "Betasoft ICT Academy learning platform",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}
