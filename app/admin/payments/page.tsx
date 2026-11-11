"use client";

import { Fragment, useEffect, useState } from "react";
import { listPayments, type AdminPayment } from "@/lib/admin-auth";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function money(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClass(status: AdminPayment["status"]) {
  switch (status) {
    case "completed":
      return "bg-[#109e44]/10 text-[#109e44]";
    case "awaiting_confirmation":
      return "bg-amber-50 text-amber-800";
    case "rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function statusLabel(status: AdminPayment["status"]) {
  switch (status) {
    case "pending_payment":
      return "Pending payment";
    case "awaiting_confirmation":
      return "Awaiting confirmation";
    case "completed":
      return "Completed";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

function slipHref(url: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${apiUrl}${url}`;
}

function isPdfSlip(url: string) {
  return url.toLowerCase().includes(".pdf");
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[] | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    listPayments()
      .then(setPayments)
      .catch((caught: unknown) => {
        setPayments([]);
        setError(caught instanceof Error ? caught.message : "Could not load payments.");
      });
  }, []);

  return (
    <div className="w-full px-4 py-4">
      {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {payments === null ? (
        <p className="text-sm text-[#5C6B61]">Loading payments...</p>
      ) : payments.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-12 text-center text-sm text-[#5C6B61]">
          No payments yet.
        </div>
      ) : payments.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
          <table className="admin-table w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Voucher</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Slip</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const slip = slipHref(payment.payment_slip_url);
                const open = expandedId === payment.id;

                return (
                  <Fragment key={payment.id}>
                    <tr className="admin-data-row">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                        {payment.voucher_number ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {payment.student?.name ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500">{payment.student?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {payment.course?.chapter_name ?? "—"}
                        </p>
                        <p className="text-xs text-[#f37021]">{payment.course?.grade_name}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        LKR {money(payment.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${statusClass(
                            payment.status
                          )}`}
                        >
                          {statusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {slip ? (
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => setExpandedId(open ? null : payment.id)}
                            className="font-semibold text-[#109e44] transition hover:text-[#0c7d36]"
                          >
                            {open ? "Hide" : "View"}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(payment.created_at)}
                      </td>
                    </tr>

                    {slip ? (
                      <tr
                        className={`border-b border-[#E2E9E4] bg-[#F5F8F6]/80 transition-colors duration-300 ease-out motion-reduce:transition-none ${
                          open ? "border-opacity-100" : "border-transparent"
                        }`}
                      >
                        <td colSpan={7} className="p-0">
                          <div
                            className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div
                                className={`px-4 transition-all duration-300 ease-out motion-reduce:transition-none ${
                                  open
                                    ? "translate-y-0 py-4 opacity-100"
                                    : "-translate-y-1 py-0 opacity-0"
                                }`}
                              >
                                <div className="rounded-xl border border-[#E2E9E4] bg-white p-4 shadow-[0_8px_24px_rgba(20,35,25,0.06)]">
                                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#5C6B61]">
                                    Payment slip · {payment.voucher_number}
                                  </p>
                                  {isPdfSlip(slip) ? (
                                    <iframe
                                      title={`Payment slip ${payment.voucher_number ?? payment.id}`}
                                      src={open ? slip : undefined}
                                      className="h-[28rem] w-full rounded-lg border border-[#E2E9E4]"
                                    />
                                  ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={slip}
                                      alt={`Payment slip for ${payment.voucher_number ?? "voucher"}`}
                                      className="mx-auto max-h-[28rem] w-auto max-w-full rounded-lg border border-[#E2E9E4] object-contain"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
