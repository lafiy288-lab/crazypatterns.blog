import { prisma } from "@/lib/db";
import { handle, limitOrThrow, ok, parseBody } from "@/lib/api";
import { subscribeSchema } from "@/lib/validation";

export const POST = handle(async (req: Request) => {
  limitOrThrow(req, "subscribe", 5, 60_000);
  const { email } = await parseBody(req, subscribeSchema);
  await prisma.subscriber.upsert({ where: { email }, create: { email }, update: {} });
  return ok({ message: "You're subscribed! Watch your inbox for new patterns." }, { status: 201 });
});
