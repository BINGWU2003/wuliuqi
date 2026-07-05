import { Button } from "@wuliuqi/ui/components/button";
import { Card, CardContent } from "@wuliuqi/ui/components/card";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-md">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <h1 className="text-xl font-bold">页面不存在</h1>
          <Button asChild className="rounded-full">
            <Link href="/">回到首页</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
