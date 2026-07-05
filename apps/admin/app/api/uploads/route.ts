import { uploadToCos } from "@wuliuqi/storage";
import { type NextRequest } from "next/server";
import { fail, handleError, ok } from "../../../lib/api-response";
import { requireAdminSession } from "../../../lib/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? "uploads/");

    if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
      return fail("BAD_REQUEST", "请选择要上传的图片", 400);
    }

    const uploadFile = file as File;
    const buffer = Buffer.from(await uploadFile.arrayBuffer());
    const result = await uploadToCos({
      buffer,
      contentType: uploadFile.type,
      fileName: uploadFile.name,
      folder,
    });

    return ok(result, { status: 201 });
  } catch (error) {
    return handleError(error, "图片上传失败");
  }
}
