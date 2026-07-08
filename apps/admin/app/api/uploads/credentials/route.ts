import { createUploadCredential } from "@wuliuqi/storage";
import { type NextRequest } from "next/server";
import { fail, handleError, ok } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();

    const body = (await request.json()) as {
      contentType?: unknown;
      fileName?: unknown;
      folder?: unknown;
      size?: unknown;
    };

    if (
      typeof body.contentType !== "string" ||
      typeof body.fileName !== "string" ||
      typeof body.folder !== "string" ||
      typeof body.size !== "number"
    ) {
      return fail("BAD_REQUEST", "上传参数无效", 400);
    }

    const credential = await createUploadCredential({
      contentType: body.contentType,
      fileName: body.fileName,
      folder: body.folder,
      size: body.size,
    });

    return ok(credential);
  } catch (error) {
    return handleError(error, "获取上传凭证失败");
  }
}
