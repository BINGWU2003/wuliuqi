import { AccountList } from "../components/account-list";
import { HomeCarousel } from "../components/home-carousel";

export default function Home() {
  return (
    <main className="flex flex-col gap-3">
      <HomeCarousel />
      <AccountList />
    </main>
  );
}
