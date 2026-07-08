import { AccountList } from "@/components/account-list";

export default function SanguoshaAccountPage() {
  return (
    <main className="flex flex-col gap-5">
      <AccountList
        compactHeader
        eyebrow="Browse all listings"
        gameKey="sanguosha"
        heading="三国杀账号列表"
      />
    </main>
  );
}
