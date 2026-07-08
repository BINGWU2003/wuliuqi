import { CodmAccountForm } from "@/components/account-form";

type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const accountId = Number(id);

  return (
    <CodmAccountForm
      accountId={Number.isSafeInteger(accountId) ? accountId : undefined}
    />
  );
}
