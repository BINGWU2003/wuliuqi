import { AccountEditModal } from "../../../../../../components/account-edit-modal";

type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const accountId = Number(id);

  return (
    <AccountEditModal
      accountId={Number.isSafeInteger(accountId) ? accountId : null}
    />
  );
}
