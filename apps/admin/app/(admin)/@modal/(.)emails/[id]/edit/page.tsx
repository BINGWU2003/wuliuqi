import { EmailEditModal } from "@/components/email-edit-modal";

type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const emailId = Number(id);

  return (
    <EmailEditModal emailId={Number.isSafeInteger(emailId) ? emailId : null} />
  );
}
