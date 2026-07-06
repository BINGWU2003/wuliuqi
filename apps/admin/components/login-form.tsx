"use client";

import { Button } from "@wuliuqi/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@wuliuqi/ui/components/card";
import { Input } from "@wuliuqi/ui/components/input";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { toast } from "@wuliuqi/ui/components/sonner";
import { ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/client-api";
import { errorMessage } from "@/lib/feedback";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      router.replace(searchParams.get("redirect") || "/accounts");
      router.refresh();
    } catch (submitError) {
      toast.error(errorMessage(submitError, "登录失败"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm rounded-md shadow-none">
      <CardHeader className="border-b border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ShieldCheck size={16} />
          管理员登录
        </div>
        <CardTitle className="text-xl">五六七管理端</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">邮箱</span>
            <Input
              autoComplete="email"
              disabled={loading}
              inputMode="email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">密码</span>
            <Input
              autoComplete="current-password"
              disabled={loading}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? <Spinner /> : null}
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
