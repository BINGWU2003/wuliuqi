import { DEFAULT_GAME_KEY, GAME_KEY } from "@wuliuqi/types";
import { EmailEditModal } from "@/components/email-edit-modal";

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
  const gameKey =
    rawGameKey === GAME_KEY.sanguosha ? GAME_KEY.sanguosha : DEFAULT_GAME_KEY;
  const emailId = Number(id);

  return (
    <EmailEditModal
      emailId={Number.isSafeInteger(emailId) ? emailId : null}
      initialGameKey={gameKey}
    />
  );
}
