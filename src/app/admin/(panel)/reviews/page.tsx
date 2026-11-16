import { ReviewsManager } from "@/components/admin/reviews-manager";

export const metadata = { title: "Reviews" };

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  return <ReviewsManager initialStatus={status === "approved" || status === "" ? status : "pending"} />;
}
