import { GAME_KEY } from "@wuliuqi/types";
import { AccountEditModal } from "@/components/account-edit-modal";

export default function Page() {
  return <AccountEditModal initialGameKey={GAME_KEY.codm} />;
}
