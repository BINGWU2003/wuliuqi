import {
  ADMIN_SESSION_COOKIE,
  loginWithPassword,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
} from "@wuliuqi/auth";
import { loginSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await loginWithPassword(input.email, input.password);
    const token = await signSessionToken(user);
    const response = ok({ user });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    return handleError(error, "登录失败");
  }
}
