import { Card, CardContent } from "@wuliuqi/ui/components/card";
import Image from "next/image";
import Link from "next/link";

export default function AccountSectionPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <h1 className="text-2xl font-extrabold tracking-normal">游戏账号专区</h1>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <Link href="/codm-account-page">
          <Card className="transition-transform active:scale-[0.98]">
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <span className="relative size-[52px] overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-black/5">
                <Image
                  alt="Call of Duty: Mobile 国际服官方图标"
                  className="object-cover"
                  fill
                  sizes="52px"
                  src="/game-icons/codm-global.png"
                />
              </span>
              <span className="text-sm font-semibold">CODM</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/sanguosha-account-page">
          <Card className="transition-transform active:scale-[0.98]">
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <span className="relative size-[52px] overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-black/5">
                <Image
                  alt="三国杀官方图标"
                  className="object-cover object-left"
                  fill
                  sizes="52px"
                  src="/game-icons/sanguosha.png"
                />
              </span>
              <span className="text-sm font-semibold">三国杀</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}
