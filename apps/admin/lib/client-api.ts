import type {
  AdminAccount,
  AdminAccountListResult,
  AdminEmail,
  AdminEmailListResult,
  AdminUser,
  ApiResponse,
  Carousel,
  CarouselItem,
  SequenceCounter,
  UploadResult,
} from "@wuliuqi/types";

type AccountPayload = {
  serialNumber?: string;
  images: string[];
  price: number;
  title: string;
  description: string;
  xianyuUrl?: string;
  email?: string;
  status: 1 | 2;
};

type EmailPayload = {
  prefix: string;
  postfix: string;
  bindStatus?: 1 | 2;
};

async function readApi<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

async function requestJson<T>(
  url: string,
  init: RequestInit & { body?: BodyInit | null } = {},
): Promise<T> {
  return readApi<T>(
    await fetch(url, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    }),
  );
}

function paramsFrom(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  return params;
}

export async function login(email: string, password: string) {
  return requestJson<{ user: AdminUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return requestJson<{ loggedOut: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function fetchAccounts(values: {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: number;
  sort?: string;
}) {
  const params = paramsFrom(values);
  return requestJson<AdminAccountListResult>(`/api/accounts?${params}`);
}

export async function fetchAccount(id: number) {
  return requestJson<AdminAccount>(`/api/accounts/${id}`);
}

export async function createAccount(payload: AccountPayload) {
  return requestJson<AdminAccount>("/api/accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAccount(id: number, payload: AccountPayload) {
  return requestJson<AdminAccount>(`/api/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateAccountStatus(id: number, status: 1 | 2) {
  return requestJson<AdminAccount>(`/api/accounts/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteAccount(id: number) {
  return requestJson<{ deleted: boolean }>(`/api/accounts/${id}`, {
    method: "DELETE",
  });
}

export async function fetchEmails(values: {
  page?: number;
  limit?: number;
  keyword?: string;
  bind_status?: number;
}) {
  const params = paramsFrom(values);
  return requestJson<AdminEmailListResult>(`/api/emails?${params}`);
}

export async function fetchEmail(id: number) {
  return requestJson<AdminEmail>(`/api/emails/${id}`);
}

export async function createEmail(payload: EmailPayload) {
  return requestJson<AdminEmail>("/api/emails", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEmail(id: number, payload: EmailPayload) {
  return requestJson<AdminEmail>(`/api/emails/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteEmail(id: number) {
  return requestJson<{ deleted: boolean }>(`/api/emails/${id}`, {
    method: "DELETE",
  });
}

export async function fetchCarousel(name: string) {
  return requestJson<Carousel>(`/api/carousels/${name}`);
}

export async function updateCarousel(name: string, items: CarouselItem[]) {
  return requestJson<Carousel>(`/api/carousels/${name}`, {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}

export async function fetchSequenceCounters() {
  return requestJson<SequenceCounter[]>("/api/sequence-counters");
}

export async function createSequenceCounter(
  counterName: string,
  currentValue: number,
) {
  return requestJson<SequenceCounter>("/api/sequence-counters", {
    method: "POST",
    body: JSON.stringify({ counterName, currentValue }),
  });
}

export async function nextSequenceCounterValue(counterName: string) {
  return requestJson<{ counterName: string; nextValue: number }>(
    `/api/sequence-counters/${counterName}/next`,
    { method: "POST" },
  );
}

export async function resetSequenceCounterValue(
  counterName: string,
  value: number,
) {
  return requestJson<SequenceCounter>(`/api/sequence-counters/${counterName}/reset`, {
    method: "POST",
    body: JSON.stringify({ value }),
  });
}

export async function uploadImage(file: File, folder: string) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("folder", folder);

  return readApi<UploadResult>(
    await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    }),
  );
}
