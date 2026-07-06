import type {
  ApiResponse,
  Carousel,
  ShopAccount,
  ShopAccountListResult,
} from "@wuliuqi/types";

async function readApi<T>(response: Response): Promise<T> {
  let payload: ApiResponse<T>;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(
      response.ok ? "接口响应格式异常" : `请求失败 (${response.status})`,
    );
  }

  if (!payload.success) {
    throw new Error(payload.error.message || "请求失败");
  }

  return payload.data;
}

export async function fetchAccounts(
  params: URLSearchParams,
  init?: RequestInit,
): Promise<ShopAccountListResult> {
  return readApi<ShopAccountListResult>(
    await fetch(`/api/accounts?${params}`, init),
  );
}

export async function fetchAccount(
  id: number,
  init?: RequestInit,
): Promise<ShopAccount> {
  return readApi<ShopAccount>(await fetch(`/api/accounts/${id}`, init));
}

export async function fetchCarousel(
  name: string,
  init?: RequestInit,
): Promise<Carousel> {
  return readApi<Carousel>(await fetch(`/api/carousels/${name}`, init));
}
