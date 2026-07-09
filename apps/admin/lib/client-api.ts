import { DEFAULT_GAME_KEY } from "@wuliuqi/types";
import type {
  AdminAccount,
  AdminAccountListResult,
  AdminAccountStatistics,
  AdminEmail,
  AdminEmailListResult,
  AdminEmailPostfix,
  AdminUser,
  ApiResponse,
  AccountAttributes,
  AccountSort,
  AccountStatus,
  AccountWritableStatus,
  Carousel,
  CarouselItem,
  GameAttributeDefinition,
  GameAttributeOption,
  GameAttributeType,
  GameKey,
  EmailBindStatus,
  SequenceCounter,
  UploadCredential,
  UploadResult,
} from "@wuliuqi/types";
import { compressImageFile } from "@wuliuqi/utils/browser/image-compress";
import COS from "cos-js-sdk-v5";

type AccountPayload = {
  gameKey?: GameKey;
  serialNumber?: string;
  images: string[];
  attributes?: AccountAttributes;
  price: number;
  costPrice: number;
  title: string;
  description: string;
  xianyuUrl?: string;
  email?: string;
  status: AccountWritableStatus;
};

type EmailPayload = {
  gameKey?: GameKey;
  prefix: string;
  postfix: string;
  bindStatus?: EmailBindStatus;
};

type EmailPostfixPayload = {
  postfix?: string;
  enabled?: boolean;
  sortOrder?: number;
};

type AttributeDefinitionPayload = {
  gameKey?: string;
  attrKey?: string;
  label?: string;
  type?: GameAttributeType;
  unit?: string;
  options?: GameAttributeOption[];
  enabled?: boolean;
  sortOrder?: number;
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
  game_key?: GameKey;
  page?: number;
  limit?: number;
  keyword?: string;
  status?: AccountStatus;
  sort?: AccountSort;
}) {
  const params = paramsFrom(values);
  return requestJson<AdminAccountListResult>(`/api/accounts?${params}`);
}

export async function fetchAccountStatistics(gameKey: GameKey = DEFAULT_GAME_KEY) {
  const params = paramsFrom({ game_key: gameKey });
  return requestJson<AdminAccountStatistics>(
    `/api/statistics/accounts?${params}`,
  );
}

export async function fetchAccount(id: number, gameKey: GameKey = DEFAULT_GAME_KEY) {
  const params = paramsFrom({ game_key: gameKey });
  return requestJson<AdminAccount>(`/api/accounts/${id}?${params}`);
}

export async function createAccount(payload: AccountPayload) {
  return requestJson<AdminAccount>("/api/accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAccount(id: number, payload: AccountPayload) {
  const params = paramsFrom({ game_key: payload.gameKey });

  return requestJson<AdminAccount>(`/api/accounts/${id}?${params}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateAccountStatus(
  id: number,
  status: AccountWritableStatus,
  gameKey: GameKey = DEFAULT_GAME_KEY,
) {
  const params = paramsFrom({ game_key: gameKey });

  return requestJson<AdminAccount>(`/api/accounts/${id}/status?${params}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function sellAccount(
  id: number,
  soldPrice: number,
  gameKey: GameKey = DEFAULT_GAME_KEY,
) {
  const params = paramsFrom({ game_key: gameKey });

  return requestJson<AdminAccount>(`/api/accounts/${id}/sell?${params}`, {
    method: "POST",
    body: JSON.stringify({ soldPrice }),
  });
}

export async function deleteAccount(
  id: number,
  gameKey: GameKey = DEFAULT_GAME_KEY,
) {
  const params = paramsFrom({ game_key: gameKey });

  return requestJson<{ deleted: boolean }>(`/api/accounts/${id}?${params}`, {
    method: "DELETE",
  });
}

export async function fetchAttributeDefinitions(gameKey = DEFAULT_GAME_KEY) {
  const params = paramsFrom({ game_key: gameKey });
  return requestJson<GameAttributeDefinition[]>(
    `/api/attribute-definitions?${params}`,
  );
}

export async function createAttributeDefinition(
  payload: AttributeDefinitionPayload,
) {
  return requestJson<GameAttributeDefinition>("/api/attribute-definitions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAttributeDefinition(
  id: number,
  payload: AttributeDefinitionPayload,
) {
  return requestJson<GameAttributeDefinition>(
    `/api/attribute-definitions/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteAttributeDefinition(id: number) {
  return requestJson<GameAttributeDefinition>(
    `/api/attribute-definitions/${id}`,
    {
      method: "DELETE",
    },
  );
}

export async function clearAttributeDefinitionValues(id: number) {
  return requestJson<{ clearedCount: number }>(
    `/api/attribute-definitions/${id}/clear-values`,
    {
      method: "POST",
    },
  );
}

export async function fetchEmails(values: {
  game_key?: GameKey;
  page?: number;
  limit?: number;
  keyword?: string;
  bind_status?: EmailBindStatus;
}) {
  const params = paramsFrom(values);
  return requestJson<AdminEmailListResult>(`/api/emails?${params}`);
}

export async function fetchEmail(id: number, gameKey: GameKey = DEFAULT_GAME_KEY) {
  const params = paramsFrom({ game_key: gameKey });
  return requestJson<AdminEmail>(`/api/emails/${id}?${params}`);
}

export async function createEmail(payload: EmailPayload) {
  return requestJson<AdminEmail>("/api/emails", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEmail(id: number, payload: EmailPayload) {
  const params = paramsFrom({ game_key: payload.gameKey });

  return requestJson<AdminEmail>(`/api/emails/${id}?${params}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteEmail(id: number, gameKey: GameKey = DEFAULT_GAME_KEY) {
  const params = paramsFrom({ game_key: gameKey });

  return requestJson<{ deleted: boolean }>(`/api/emails/${id}?${params}`, {
    method: "DELETE",
  });
}

export async function fetchEmailPostfixes() {
  return requestJson<AdminEmailPostfix[]>("/api/email-postfixes");
}

export async function createEmailPostfix(payload: EmailPostfixPayload) {
  return requestJson<AdminEmailPostfix>("/api/email-postfixes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEmailPostfix(
  id: number,
  payload: EmailPostfixPayload,
) {
  return requestJson<AdminEmailPostfix>(`/api/email-postfixes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteEmailPostfix(id: number) {
  return requestJson<{ deleted: boolean }>(`/api/email-postfixes/${id}`, {
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
  return requestJson<SequenceCounter>(
    `/api/sequence-counters/${counterName}/reset`,
    {
      method: "POST",
      body: JSON.stringify({ value }),
    },
  );
}

export async function uploadImage(file: File, folder: string) {
  const uploadFile = await compressImageFile(file);
  const credential = await createUploadCredential(uploadFile, folder);
  const cos = new COS({
    SecretId: credential.credentials.tmpSecretId,
    SecretKey: credential.credentials.tmpSecretKey,
    SecurityToken: credential.credentials.sessionToken,
    StartTime: credential.startTime,
    ExpiredTime: credential.expiredTime,
  });

  await cos.putObject({
    Body: uploadFile,
    Bucket: credential.bucket,
    ContentType: uploadFile.type,
    Key: credential.key,
    Region: credential.region,
  });

  return {
    key: credential.key,
    url: credential.url,
    size: uploadFile.size,
    contentType: uploadFile.type,
  } satisfies UploadResult;
}

export async function uploadImages(
  files: File[],
  folder: string,
  parallelLimit = 3,
) {
  const results: UploadResult[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < files.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const file = files[currentIndex];

      if (!file) {
        continue;
      }

      results[currentIndex] = await uploadImage(file, folder);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(parallelLimit, files.length) }, () =>
      worker(),
    ),
  );

  return results;
}

function createUploadCredential(file: File, folder: string) {
  return requestJson<UploadCredential>("/api/uploads/credentials", {
    method: "POST",
    body: JSON.stringify({
      contentType: file.type,
      fileName: file.name,
      folder,
      size: file.size,
    }),
  });
}
