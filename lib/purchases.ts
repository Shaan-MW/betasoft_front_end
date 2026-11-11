const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function xsrfToken(): string {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function ensureCsrfCookie(): Promise<void> {
  await fetch(`${apiUrl}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
}

export type PaymentStatus =
  | "pending_payment"
  | "awaiting_confirmation"
  | "completed"
  | "rejected";

export type PaymentVoucher = {
  id: number;
  status: PaymentStatus;
  voucher_number: string | null;
  amount: string;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  payment_slip_url: string | null;
  slip_uploaded_at: string | null;
  purchased_at: string | null;
  confirmed_at: string | null;
  admin_note: string | null;
  created_at: string | null;
  student: {
    name: string;
    email: string;
  };
  course: {
    id: number;
    chapter_name: string;
    slug: string;
    grade_name: string | null;
    thumbnail_url: string | null;
    price: string;
  };
};

export type PurchasedCourse = {
  id: number;
  status: string;
  voucher_number: string | null;
  purchased_at: string | null;
  amount: string;
  course: {
    id: number;
    chapter_name: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    grade_name: string | null;
    price: string;
    sub_chapters_count: number;
    is_published: boolean;
  } | null;
};

export type PurchaseStatusResult = {
  owned: boolean;
  slug: string;
  status: PaymentStatus | null;
  purchase: PaymentVoucher | null;
};

export async function listMyCourses(): Promise<PurchasedCourse[]> {
  const response = await fetch(`${apiUrl}/api/my-courses`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as PurchasedCourse[];
}

export async function getPurchaseStatus(slug: string): Promise<PurchaseStatusResult> {
  const response = await fetch(
    `${apiUrl}/api/courses/${encodeURIComponent(slug)}/purchase-status`,
    {
      credentials: "include",
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    return { owned: false, slug, status: null, purchase: null };
  }

  return (await response.json()) as PurchaseStatusResult;
}

export async function createPaymentVoucher(slug: string): Promise<PaymentVoucher> {
  await ensureCsrfCookie();

  const response = await fetch(
    `${apiUrl}/api/courses/${encodeURIComponent(slug)}/purchase`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": xsrfToken(),
      },
    }
  );

  const body = (await response.json()) as {
    message?: string;
    purchase?: PaymentVoucher;
  };

  if ((response.ok || response.status === 409) && body.purchase) {
    return body.purchase;
  }

  throw new Error(body.message ?? "Could not create payment voucher.");
}

export async function uploadPaymentSlip(slug: string, file: File): Promise<PaymentVoucher> {
  await ensureCsrfCookie();

  const body = new FormData();
  body.append("payment_slip", file);

  const response = await fetch(
    `${apiUrl}/api/courses/${encodeURIComponent(slug)}/payment-slip`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-XSRF-TOKEN": xsrfToken(),
      },
      body,
    }
  );

  const payload = (await response.json()) as {
    message?: string;
    purchase?: PaymentVoucher;
  };

  if (!response.ok || !payload.purchase) {
    throw new Error(payload.message ?? "Could not upload payment slip.");
  }

  return payload.purchase;
}

/** @deprecated use createPaymentVoucher */
export async function purchaseCourse(slug: string): Promise<PaymentVoucher> {
  return createPaymentVoucher(slug);
}
