import { prisma } from "@/lib/db";
import { handle, limitOrThrow, ok, parseBody } from "@/lib/api";
import { sanitizePlain } from "@/lib/sanitize";
import { contactSchema } from "@/lib/validation";

export const POST = handle(async (req: Request) => {
  limitOrThrow(req, "contact", 5, 10 * 60_000);
  const data = await parseBody(req, contactSchema);
  const productId = data.productId && (await prisma.product.findUnique({ where: { id: data.productId }, select: { id: true } })) ? data.productId : null;
  await prisma.message.create({
    data: { name: sanitizePlain(data.name), email: data.email, subject: sanitizePlain(data.subject), body: sanitizePlain(data.body), productId },
  });
  return ok({ message: "Message sent" }, { status: 201 });
});
