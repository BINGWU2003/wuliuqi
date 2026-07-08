import { AccountEditModal } from "@/components/account-edit-modal";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ game_key?: string | string[] }>;

export default async function Page({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const rawGameKey = Array.isArray(resolvedSearchParams.game_key)
    ? resolvedSearchParams.game_key[0]
    : resolvedSearchParams.game_key;
  const gameKey = rawGameKey === "sanguosha" ? "sanguosha" : "codm";
  const accountId = Number(id);

  return (
    <AccountEditModal
      accountId={Number.isSafeInteger(accountId) ? accountId : null}
      initialGameKey={gameKey}
    />
  );
}
