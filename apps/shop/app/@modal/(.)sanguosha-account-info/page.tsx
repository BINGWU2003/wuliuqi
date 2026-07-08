import { AccountDetailModal } from "@/components/account-detail-modal";

type SearchParams = Promise<{
  id?: string | string[];
}>;

export default async function SanguoshaAccountInfoModalPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = rawId ? Number(rawId) : null;

  return (
    <AccountDetailModal
      gameKey="sanguosha"
      id={Number.isSafeInteger(id) ? id : null}
    />
  );
}
