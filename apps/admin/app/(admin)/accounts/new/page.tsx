import { AccountForm } from "@/components/account-form";

type SearchParams = Promise<{ game_key?: string | string[] }>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawGameKey = Array.isArray(params.game_key)
    ? params.game_key[0]
    : params.game_key;
  const gameKey = rawGameKey === "sanguosha" ? "sanguosha" : "codm";

  return <AccountForm initialGameKey={gameKey} />;
}
