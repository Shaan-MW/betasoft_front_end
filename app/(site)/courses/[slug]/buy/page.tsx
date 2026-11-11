"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Printer,
  Upload,
} from "lucide-react";
import { currentUser } from "@/lib/admin-auth";
import {
  createPaymentVoucher,
  getPurchaseStatus,
  uploadPaymentSlip,
  type PaymentVoucher,
} from "@/lib/purchases";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function money(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function statusLabel(status: string) {
  switch (status) {
    case "pending_payment":
      return "Awaiting bank payment";
    case "awaiting_confirmation":
      return "Slip uploaded — awaiting confirmation";
    case "completed":
      return "Payment confirmed";
    case "rejected":
      return "Slip rejected — upload again";
    default:
      return status;
  }
}

export default function CourseBuyPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [voucher, setVoucher] = useState<PaymentVoucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const user = await currentUser();
      if (!active) return;

      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(`/courses/${slug}/buy`)}`);
        return;
      }

      if (user.roles.includes("admin")) {
        setError("Admin accounts cannot purchase student courses. Sign in as a student.");
        setLoading(false);
        return;
      }

      try {
        const existing = await getPurchaseStatus(slug);
        if (!active) return;

        if (existing.purchase) {
          setVoucher(existing.purchase);
          setLoading(false);
          return;
        }

        const created = await createPaymentVoucher(slug);
        if (!active) return;
        setVoucher(created);
        setLoading(false);
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "Could not prepare voucher.");
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [router, slug]);

  function printVoucher() {
    window.print();
  }

  async function onUploadSlip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!voucher || !slipFile || uploading) return;

    setError("");
    setUploading(true);

    try {
      const updated = await uploadPaymentSlip(voucher.course.slug, slipFile);
      setVoucher(updated);
      setSlipFile(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 bg-[#F5F8F6] py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-sm text-[#5C6B61]">Creating payment voucher…</p>
        </div>
      </main>
    );
  }

  if (!voucher) {
    return (
      <main className="flex-1 bg-[#F5F8F6] py-12">
        <div className="mx-auto max-w-3xl space-y-4 px-4 sm:px-6">
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || "Voucher unavailable."}
          </p>
          <Link href="/courses" className="text-sm font-semibold text-[#109e44] hover:text-[#0c7d36]">
            Back to courses
          </Link>
        </div>
      </main>
    );
  }

  const canUpload =
    voucher.status === "pending_payment" ||
    voucher.status === "rejected" ||
    voucher.status === "awaiting_confirmation";

  return (
    <main className="flex-1 bg-[#F5F8F6] py-10 sm:py-14 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 print:max-w-none print:px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href={`/courses/${voucher.course.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#109e44] hover:text-[#0c7d36]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to course
          </Link>
          <button
            type="button"
            onClick={printVoucher}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E9E4] bg-white px-4 py-2 text-sm font-semibold text-[#142319] shadow-sm transition hover:border-[#109e44]/40"
          >
            <Printer className="h-4 w-4" />
            Print voucher
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">
            {error}
          </p>
        ) : null}

        <div
          ref={printRef}
          className="mt-6 overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white shadow-sm print:mt-0 print:rounded-none print:border-0 print:shadow-none"
        >
          <div className="border-b border-[#E2E9E4] bg-[#EAF3ED]/60 px-5 py-4 sm:px-6 print:bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#109e44]">
                  Payment voucher
                </p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#142319]">
                  Betasoft LMS
                </h1>
                <p className="mt-1 text-sm text-[#5C6B61]">Bank transfer enrollment voucher</p>
              </div>
              <Image
                src="/main_logo.png"
                alt="Betasoft"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
              />
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5C6B61]">
                  Voucher number
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-[#142319]">
                  {voucher.voucher_number}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  voucher.status === "completed"
                    ? "bg-[#109e44]/10 text-[#109e44]"
                    : voucher.status === "rejected"
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-800"
                }`}
              >
                {voucher.status === "completed" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Clock3 className="h-3.5 w-3.5" />
                )}
                {statusLabel(voucher.status)}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E2E9E4] bg-[#F5F8F6] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#5C6B61]">Student</p>
                <p className="mt-2 font-semibold text-[#142319]">{voucher.student.name}</p>
                <p className="text-sm text-[#5C6B61]">{voucher.student.email}</p>
              </div>
              <div className="rounded-xl border border-[#E2E9E4] bg-[#F5F8F6] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#5C6B61]">Course</p>
                <p className="mt-2 font-semibold text-[#142319]">{voucher.course.chapter_name}</p>
                <p className="text-sm text-[#f37021]">
                  {voucher.course.grade_name ?? "Course"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#109e44]/25 bg-[#109e44]/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#109e44]">
                Pay to this Betasoft bank account
              </p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[#5C6B61]">Bank</dt>
                  <dd className="font-semibold text-[#142319]">{voucher.bank_name}</dd>
                </div>
                <div>
                  <dt className="text-[#5C6B61]">Branch</dt>
                  <dd className="font-semibold text-[#142319]">{voucher.bank_branch}</dd>
                </div>
                <div>
                  <dt className="text-[#5C6B61]">Account name</dt>
                  <dd className="font-semibold text-[#142319]">{voucher.bank_account_name}</dd>
                </div>
                <div>
                  <dt className="text-[#5C6B61]">Account number</dt>
                  <dd className="font-mono font-semibold text-[#142319]">
                    {voucher.bank_account_number}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-[#109e44]/20 pt-3">
                <span className="text-sm font-semibold text-[#5C6B61]">Amount to pay</span>
                <span className="text-2xl font-extrabold text-[#142319]">
                  LKR {money(voucher.amount)}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#5C6B61]">
                Use voucher number <strong>{voucher.voucher_number}</strong> as the transfer
                reference. After paying, upload your bank slip below.
              </p>
            </div>
          </div>
        </div>

        {voucher.status === "completed" ? (
          <div className="mt-6 space-y-3 print:hidden">
            <p className="inline-flex items-center gap-2 rounded-xl bg-[#109e44]/10 px-3 py-2 text-sm font-semibold text-[#109e44]">
              <CheckCircle2 className="h-4 w-4" />
              Payment confirmed — this course is yours
            </p>
            <Link
              href="/my-courses"
              className="flex w-full items-center justify-center rounded-xl bg-[#109e44] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0c7d36]"
            >
              Open My courses
            </Link>
          </div>
        ) : canUpload ? (
          <form
            onSubmit={onUploadSlip}
            className="mt-6 space-y-4 rounded-2xl border border-[#E2E9E4] bg-white p-5 shadow-sm print:hidden sm:p-6"
          >
            <div>
              <h2 className="text-lg font-extrabold text-[#142319]">Upload payment slip</h2>
              <p className="mt-1 text-sm text-[#5C6B61]">
                After transferring to the Betasoft account, upload a clear photo or PDF of the
                slip so admin can confirm.
              </p>
            </div>

            {voucher.status === "rejected" && voucher.admin_note ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {voucher.admin_note}
              </p>
            ) : null}

            {voucher.status === "awaiting_confirmation" ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                Slip received. You can replace it below if needed while waiting for confirmation.
              </p>
            ) : null}

            {voucher.payment_slip_url ? (
              <p className="text-sm text-[#5C6B61]">
                Current slip:{" "}
                <a
                  href={voucher.payment_slip_url.startsWith("http")
                    ? voucher.payment_slip_url
                    : `${apiUrl}${voucher.payment_slip_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#109e44] hover:text-[#0c7d36]"
                >
                  View uploaded slip
                </a>
              </p>
            ) : null}

            <label className="block text-sm font-semibold text-[#142319]">
              Payment slip (JPG, PNG, WEBP, or PDF)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required={!voucher.payment_slip_url || voucher.status === "rejected"}
                onChange={(event) => setSlipFile(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-sm text-[#5C6B61] file:mr-3 file:rounded-lg file:border-0 file:bg-[#109e44]/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#109e44]"
              />
            </label>

            <button
              type="submit"
              disabled={uploading || !slipFile}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f37021] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#e05f10] disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading…" : "Submit payment slip"}
            </button>
          </form>
        ) : null}
      </div>

      <style jsx global>{`
        @media print {
          header,
          .print\\:hidden,
          [data-nextjs-toast],
          nextjs-portal {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </main>
  );
}
