import { ADMIN_SESSION_COOKIE } from "@wuliuqi/auth";
import { handleError, ok } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

export async function POST() {
  try {
    await requireAdminSession();
    const response = ok({ loggedOut: true });

    response.cookies.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    return handleError(error, "退出登录失败");
  }
}
