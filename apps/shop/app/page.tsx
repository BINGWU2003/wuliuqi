import { HomeAccountFeed } from "@/components/home-account-feed";
import { HomeCarousel } from "@/components/home-carousel";

export default function Home() {
  return (
    <main className="flex flex-col gap-5">
      <HomeCarousel />
      <HomeAccountFeed />
    </main>
  );
}
