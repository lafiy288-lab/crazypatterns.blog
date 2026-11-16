import { requireAdmin } from "@/lib/auth";
import { handle, ok, parseBody } from "@/lib/api";
import { revalidatePublic } from "@/lib/revalidate";
import { getSettings, saveSetting } from "@/lib/settings";
import { settingsSchema } from "@/lib/validation";

export const GET = handle(async () => {
  await requireAdmin();
  return ok(await getSettings());
});

export const PUT = handle(async (req: Request) => {
  await requireAdmin();
  const data = await parseBody(req, settingsSchema);
  await saveSetting("site", data);
  revalidatePublic();
  return ok(data);
});
