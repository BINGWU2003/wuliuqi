import { AccountList } from "@/components/account-list";
import {
  accountListSearchParams,
  parseAccountListFilterState,
} from "@/lib/shop-filters";
import type { ShopSearchParams } from "@/lib/shop-filters";
import { GAME_KEY } from "@wuliuqi/types";

export default async function SanguoshaAccountPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const initialFilters = parseAccountListFilterState(
    await searchParams,
    GAME_KEY.sanguosha,
  );

  return (
    <main className="flex flex-col gap-5">
      <AccountList
        key={accountListSearchParams(
          initialFilters,
          GAME_KEY.sanguosha,
        ).toString()}
        compactHeader
        eyebrow="全部在售账号"
        gameKey={GAME_KEY.sanguosha}
        heading="三国杀账号列表"
        initialFilters={initialFilters}
      />
    </main>
  );
}
