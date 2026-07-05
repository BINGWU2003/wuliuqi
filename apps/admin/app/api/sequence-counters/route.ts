import {
  createSequenceCounter,
  listSequenceCounters,
} from "@wuliuqi/domain";
import { sequenceCounterCreateSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { handleError, ok } from "../../../lib/api-response";
import { requireAdminSession } from "../../../lib/session";

export async function GET() {
  try {
    await requireAdminSession();
    const counters = await listSequenceCounters();

    return ok(counters);
  } catch (error) {
    return handleError(error, "获取序号计数器列表失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const input = sequenceCounterCreateSchema.parse(await request.json());
    const counter = await createSequenceCounter(input);

    return ok(counter, { status: 201 });
  } catch (error) {
    return handleError(error, "创建序号计数器失败");
  }
}
