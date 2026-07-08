import { AccountDetail } from "@/components/account-detail";

type SearchParams = Promise<{
  id?: string | string[];
}>;

export default async function SanguoshaAccountInfoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = rawId ? Number(rawId) : null;

  return (
    <AccountDetail
      gameKey="sanguosha"
      id={Number.isSafeInteger(id) ? id : null}
    />
  );
}
