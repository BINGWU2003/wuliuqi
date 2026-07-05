import { Badge } from "@wuliuqi/ui/components/badge";

export function AccountStatusBadge({ status }: { status: number }) {
  return status === 1 ? (
    <Badge className="rounded-sm border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300" variant="outline">
      上架
    </Badge>
  ) : (
    <Badge className="rounded-sm" variant="secondary">
      下架
    </Badge>
  );
}

export function EmailBindStatusBadge({ bindStatus }: { bindStatus: number }) {
  return bindStatus === 1 ? (
    <Badge className="rounded-sm border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/50 dark:text-sky-300" variant="outline">
      已绑定
    </Badge>
  ) : (
    <Badge className="rounded-sm" variant="secondary">
      未绑定
    </Badge>
  );
}
