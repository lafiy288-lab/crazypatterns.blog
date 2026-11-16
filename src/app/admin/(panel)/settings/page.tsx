import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Settings" };

export default async function Page() {
  return <SettingsForm initial={await getSettings()} />;
}
