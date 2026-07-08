import { AccountList } from "@/components/account-list";

export default function CodmAccountPage() {
  return (
    <main className="flex flex-col gap-5">
      <AccountList
        compactHeader
        eyebrow="Browse all listings"
        gameKey="codm"
        heading="CODM 账号列表"
      />
    </main>
  );
}
