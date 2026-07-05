import type {
  ApiResponse,
  Carousel,
  ShopAccount,
  ShopAccountListResult,
} from "@wuliuqi/types";

async function readApi<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

export async function fetchAccounts(
  params: URLSearchParams,
): Promise<ShopAccountListResult> {
  return readApi<ShopAccountListResult>(await fetch(`/api/accounts?${params}`));
}

export async function fetchAccount(id: number): Promise<ShopAccount> {
  return readApi<ShopAccount>(await fetch(`/api/accounts/${id}`));
}

export async function fetchCarousel(name: string): Promise<Carousel> {
  return readApi<Carousel>(await fetch(`/api/carousels/${name}`));
}
