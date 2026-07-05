import { EmailForm } from "@/components/email-form";

type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const emailId = Number(id);

  return <EmailForm emailId={Number.isSafeInteger(emailId) ? emailId : undefined} />;
}
