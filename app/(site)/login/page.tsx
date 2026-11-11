"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { currentUser, loginCustomer } from "@/lib/admin-auth";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    currentUser().then((signedIn) => {
      if (signedIn?.roles.includes("admin")) {
        router.replace("/admin");
        return;
      }
      if (signedIn) {
        router.replace(nextPath);
        return;
      }
      setReady(true);
    });
  }, [nextPath, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await loginCustomer(email, password);
      router.push(nextPath);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-16">
        <p className="text-sm text-slate-500">Checking session...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-16">
      <form
        onSubmit={onSubmit}
        className="w-full space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <Image src="/main_logo.png" alt="Betasoft logo" width={40} height={40} />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
              Sign <span className="text-[#109e44]">in</span>
            </h1>
            <p className="text-xs text-slate-500">Betasoft LMS</p>
          </div>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <label className="block text-sm font-semibold text-slate-700">
          Email
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#109e44] focus:outline-none focus:ring-2 focus:ring-[#109e44]"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#109e44] focus:outline-none focus:ring-2 focus:ring-[#109e44]"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full cursor-pointer rounded-lg bg-[#f37021] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e05f10] disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-center text-sm text-slate-500">
          New here?{" "}
          <Link
            href={`/join?next=${encodeURIComponent(nextPath)}`}
            className="font-semibold text-[#109e44] hover:text-[#0c7d36]"
          >
            Join BLMS
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-16">
          <p className="text-sm text-slate-500">Checking session...</p>
        </main>
      }
    >
      <CustomerLoginForm />
    </Suspense>
  );
}
