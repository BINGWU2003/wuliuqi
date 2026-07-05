import { AccountList } from "@/components/account-list";
import { HomeCarousel } from "@/components/home-carousel";

export default function Home() {
  return (
    <main className="flex flex-col gap-5">
      <HomeCarousel />
      <AccountList
        eyebrow="Verified CODM accounts"
        heading="CODM 账号市场"
      />
    </main>
  );
}
