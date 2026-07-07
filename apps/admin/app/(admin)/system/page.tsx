import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@wuliuqi/ui/components/card";
import { ChevronRight, GalleryHorizontalEnd, Hash } from "lucide-react";
import Link from "next/link";

const systemMenuItems = [
  {
    href: "/carousels/home_ads",
    title: "首页轮播",
    description: "维护商城首页广告轮播图片、排序和跳转链接。",
    icon: GalleryHorizontalEnd,
  },
  {
    href: "/sequence-counters",
    title: "序号计数器",
    description: "查看、推进或重置账号等业务序号的当前值。",
    icon: Hash,
  },
];

export default function SystemPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-normal">系统</h1>
        <p className="text-sm text-muted-foreground">
          管理全局配置和基础运营工具。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {systemMenuItems.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              className="overflow-hidden transition-colors hover:border-primary/40"
              key={item.href}
            >
              <Link
                className="flex h-full items-center gap-4 p-4 outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                href={item.href}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-md bg-accent text-foreground">
                  <Icon size={22} />
                </span>
                <CardHeader className="min-w-0 flex-1 p-0">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription className="mt-1 leading-6">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="shrink-0 p-0">
                  <ChevronRight className="text-muted-foreground" size={18} />
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
