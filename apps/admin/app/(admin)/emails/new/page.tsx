import { DEFAULT_GAME_KEY, GAME_KEY } from "@wuliuqi/types";
import { EmailForm } from "@/components/email-form";

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
  const gameKey =
    rawGameKey === GAME_KEY.sanguosha ? GAME_KEY.sanguosha : DEFAULT_GAME_KEY;

  return <EmailForm initialGameKey={gameKey} />;
}
