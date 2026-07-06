import {
  createKnowledgeCategory,
  listKnowledgeCategories,
} from "@wuliuqi/rag-db";
import { knowledgeCategoryCreateSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id } = await segmentData.params;
    const categories = await listKnowledgeCategories(id);

    return ok(categories);
  } catch (error) {
    return handleError(error, "获取知识分类失败");
  }
}

export async function POST(
  request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id } = await segmentData.params;
    const input = knowledgeCategoryCreateSchema.parse(await request.json());
    const category = await createKnowledgeCategory({
      ...input,
      knowledgeBaseId: id,
    });

    return ok(category, { status: 201 });
  } catch (error) {
    return handleError(error, "创建知识分类失败");
  }
}
