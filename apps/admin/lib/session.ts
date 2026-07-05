import { ADMIN_SESSION_COOKIE, requireAdmin } from "@wuliuqi/auth";
import { cookies } from "next/headers";

export async function getSessionToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function requireAdminSession() {
  return requireAdmin(await getSessionToken());
}
