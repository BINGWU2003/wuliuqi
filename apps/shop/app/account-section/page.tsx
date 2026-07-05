import { Card, CardContent } from "@wuliuqi/ui/components/card";
import { Gamepad2 } from "lucide-react";
import Link from "next/link";

export default function AccountSectionPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <h1 className="text-2xl font-extrabold tracking-normal">游戏账号专区</h1>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <Link href="/codm-account-page">
          <Card className="transition-transform active:scale-[0.98]">
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <span className="grid size-[52px] place-items-center rounded-lg bg-orange-500 text-white shadow-sm">
                <Gamepad2 size={28} />
              </span>
              <span className="text-sm font-semibold">CODM</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}
