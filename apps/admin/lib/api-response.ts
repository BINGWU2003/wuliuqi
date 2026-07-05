import type { ApiResponse } from "@wuliuqi/types";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(
  code: string,
  message: string,
  status: number,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status },
  );
}

export function parseId(rawId: string): number | null {
  const id = Number(rawId);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function handleError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return fail("BAD_REQUEST", error.issues[0]?.message ?? "请求参数无效", 400);
  }

  if (error instanceof Error) {
    const known = error as Error & { code?: string; status?: number };

    if (known.code && known.status) {
      return fail(known.code, known.message, known.status);
    }
  }

  console.error(fallbackMessage, error);
  return fail("INTERNAL_ERROR", fallbackMessage, 500);
}
