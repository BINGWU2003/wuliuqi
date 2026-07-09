import { CodmAccountForm } from "@/components/account-form";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ mode?: string | string[] }>;

export default async function Page({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const rawMode = Array.isArray(resolvedSearchParams.mode)
    ? resolvedSearchParams.mode[0]
    : resolvedSearchParams.mode;
  const mode = rawMode === "view" ? "view" : "edit";
  const accountId = Number(id);

  return (
    <CodmAccountForm
      accountId={Number.isSafeInteger(accountId) ? accountId : undefined}
      mode={mode}
    />
  );
}
