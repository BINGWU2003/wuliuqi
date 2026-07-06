import { searchPublishedKnowledge } from "@wuliuqi/rag-db";
import { publicSearchQuerySchema } from "@wuliuqi/validators";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const query = publicSearchQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  const results = await searchPublishedKnowledge({
    knowledgeBaseSlug: query.kbSlug,
    query: query.q,
    limit: 10,
  });

  return NextResponse.json({ success: true, data: results });
}
