import { createChatStreamResponse } from "@wuliuqi/rag";
import { publicChatSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const input = publicChatSchema.parse(await request.json());

    return await createChatStreamResponse({
      kbSlug: input.kbSlug,
      messages: input.messages,
      abortSignal: request.signal,
    });
  } catch (error) {
    const status = getErrorStatus(error);
    const message =
      error instanceof Error && error.message === "fetch failed"
        ? "AI 模型服务连接失败，请稍后再试或检查服务器网络。"
        : error instanceof Error
          ? error.message
          : "AI 问答暂时不可用";

    return new Response(
      message,
      {
        status,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }
}

function getErrorStatus(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  return error instanceof Error && error.message === "fetch failed" ? 502 : 400;
}
