"use client";

import { Fragment, useEffect, useState } from "react";
import {
  confirmPayment,
  listPaymentConfirmations,
  rejectPayment,
  type AdminPayment,
} from "@/lib/admin-auth";

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

function slipHref(url: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${apiUrl}${url}`;
}

function isPdfSlip(url: string) {
  return url.toLowerCase().includes(".pdf");
}

export default function AdminPaymentConfirmationsPage() {
  const [payments, setPayments] = useState<AdminPayment[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function refresh() {
    const rows = await listPaymentConfirmations();
    setPayments(rows);
  }

  useEffect(() => {
    refresh().catch((caught: unknown) => {
      setPayments([]);
      setError(caught instanceof Error ? caught.message : "Could not load confirmations.");
    });
  }, []);

  async function onConfirm(id: number) {
    setError("");
    setBusyId(id);
    try {
      await confirmPayment(id);
      if (expandedId === id) setExpandedId(null);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Confirm failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function onReject(id: number) {
    const note = window.prompt(
      "Rejection note for the student (optional):",
      "Payment slip rejected. Please upload a clear slip."
    );
    if (note === null) return;

    setError("");
    setBusyId(id);
    try {
      await rejectPayment(id, note);
      if (expandedId === id) setExpandedId(null);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reject failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="w-full px-4 py-4">
      {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {payments === null ? (
        <p className="text-sm text-[#5C6B61]">Loading confirmations...</p>
      ) : payments.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-12 text-center text-sm text-[#5C6B61]">
          No payments waiting for confirmation.
        </div>
      ) : payments.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
          <table className="admin-table w-full min-w-[1040px] text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Voucher</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Slip</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const slip = slipHref(payment.payment_slip_url);
                const busy = busyId === payment.id;
                const open = expandedId === payment.id;

                return (
                  <Fragment key={payment.id}>
                    <tr className="admin-data-row">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                        {payment.voucher_number ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{payment.student?.name ?? "—"}</p>
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
                          <span className="text-slate-400">Missing</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(payment.slip_uploaded_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy || !slip}
                            onClick={() => onConfirm(payment.id)}
                            className="rounded-lg bg-[#109e44] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#0c7d36] disabled:opacity-60"
                          >
                            {busy ? "Saving…" : "Confirm"}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onReject(payment.id)}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
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
