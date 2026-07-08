import { Badge } from "@wuliuqi/ui/components/badge";

export function AccountStatusBadge({ status }: { status: number }) {
  if (status === 1) {
    return (
      <Badge
        className="rounded-sm border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300"
        variant="outline"
      >
        上架
      </Badge>
    );
  }

  if (status === 3) {
    return (
      <Badge
        className="rounded-sm border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-300"
        variant="outline"
      >
        已出售
      </Badge>
    );
  }

  return (
    <Badge className="rounded-sm" variant="secondary">
      下架
    </Badge>
  );
}

export function EmailBindStatusBadge({ bindStatus }: { bindStatus: number }) {
  return bindStatus === 1 ? (
    <Badge
      className="rounded-sm border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/50 dark:text-sky-300"
      variant="outline"
    >
      已绑定
    </Badge>
  ) : (
    <Badge className="rounded-sm" variant="secondary">
      未绑定
    </Badge>
  );
}
