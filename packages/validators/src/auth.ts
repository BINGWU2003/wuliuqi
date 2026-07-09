import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("邮箱格式不正确"),
  password: z.string().min(1, "密码为必填项"),
});

export type LoginInput = z.infer<typeof loginSchema>;
