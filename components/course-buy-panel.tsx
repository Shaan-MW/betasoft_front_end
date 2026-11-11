"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, ShoppingCart } from "lucide-react";
import { currentUser } from "@/lib/admin-auth";
import { getPurchaseStatus, type PaymentStatus } from "@/lib/purchases";

function money(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

type Props = {
  slug: string;
  price: string;
  lessonCount: number;
};

export function CourseBuyPanel({ slug, price, lessonCount }: Props) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [owned, setOwned] = useState(false);
  const [status, setStatus] = useState<PaymentStatus | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const user = await currentUser();
      if (!active) return;

      if (!user || user.roles.includes("admin")) {
        setSignedIn(false);
        setOwned(false);
        setStatus(null);
        setReady(true);
        return;
      }

      setSignedIn(true);
      const result = await getPurchaseStatus(slug);
      if (!active) return;
      setOwned(result.owned);
      setStatus(result.status);
      setReady(true);
    }

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const buyHref = `/courses/${slug}/buy`;
  const loginHref = `/login?next=${encodeURIComponent(buyHref)}`;

  const pendingLabel =
    status === "awaiting_confirmation"
      ? "Slip submitted — waiting for confirmation"
      : status === "pending_payment" || status === "rejected"
        ? "Payment voucher ready"
        : null;

  return (
    <aside className="rounded-2xl border border-[#E2E9E4] bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-[#f37021]">Get access</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#142319]">
        LKR {money(price)}
      </p>
      <p className="mt-1 text-sm text-[#5C6B61]">
        Full course · {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
      </p>

      <div className="mt-5">
        {!ready ? (
          <p className="text-sm text-[#5C6B61]">Checking access…</p>
        ) : owned ? (
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-xl bg-[#109e44]/10 px-3 py-2 text-sm font-semibold text-[#109e44]">
              <CheckCircle2 className="h-4 w-4" />
              You own this course
            </p>
            <div className="space-y-2">
              <Link
                href={`/courses/${slug}/learn`}
                className="flex w-full items-center justify-center rounded-xl bg-[#109e44] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0c7d36]"
              >
                Continue learning
              </Link>
              <Link
                href="/my-courses"
                className="flex w-full items-center justify-center rounded-xl border border-[#E2E9E4] bg-white px-4 py-2.5 text-sm font-semibold text-[#142319] transition hover:border-[#109e44]/40"
              >
                My courses
              </Link>
            </div>
          </div>
        ) : pendingLabel ? (
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              <Clock3 className="h-4 w-4" />
              {pendingLabel}
            </p>
            <Link
              href={buyHref}
              className="flex w-full items-center justify-center rounded-xl bg-[#f37021] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#e05f10]"
            >
              Open payment voucher
            </Link>
          </div>
        ) : (
          <Link
            href={signedIn ? buyHref : loginHref}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f37021] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#e05f10]"
          >
            <ShoppingCart className="h-4 w-4" />
            {signedIn ? "Buy this course" : "Sign in to buy"}
          </Link>
        )}
      </div>

      {!owned ? (
        <p className="mt-3 text-xs leading-relaxed text-[#5C6B61]">
          Pay to the Betasoft bank account using your voucher, then upload the payment slip for
          confirmation.
        </p>
      ) : null}
    </aside>
  );
}
