import {
  createKnowledgeBase,
  listKnowledgeBases,
} from "@wuliuqi/rag-db";
import { knowledgeBaseCreateSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

export async function GET() {
  try {
    await requireAdminSession();
    const bases = await listKnowledgeBases();

    return ok(bases);
  } catch (error) {
    return handleError(error, "获取知识库失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const input = knowledgeBaseCreateSchema.parse(await request.json());
    const base = await createKnowledgeBase(input);

    return ok(base, { status: 201 });
  } catch (error) {
    return handleError(error, "创建知识库失败");
  }
}
