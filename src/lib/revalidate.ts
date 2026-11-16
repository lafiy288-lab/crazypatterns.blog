import { revalidatePath } from "next/cache";

/** Called after any admin mutation so ISR pages pick up the change immediately. */
export function revalidatePublic() {
  revalidatePath("/", "layout");
}
