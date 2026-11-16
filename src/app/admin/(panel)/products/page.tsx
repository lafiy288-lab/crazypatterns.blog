import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { ProductsTable } from "@/components/admin/products-table";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <Suspense>
      <ProductsTable categories={categories} />
    </Suspense>
  );
}
