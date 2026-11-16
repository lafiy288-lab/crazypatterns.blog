import { Suspense } from "react";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { listProducts, queryFromParams, SORTS, type ProductQuery } from "@/lib/products";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/ui/pagination";
import { Filters } from "./filters";
import { SortSelect } from "./sort-select";

type SP = Record<string, string | string[] | undefined>;

type Props = {
  basePath: string;
  searchParams: SP;
  fixed?: Partial<ProductQuery>;
  subcategories?: string[];
  hideFilters?: ("free" | "category")[];
};

const sortOptions = Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }));

/** Shared filter + sort + grid + pagination layout for category, search and free pattern pages. */
export async function Listing({ basePath, searchParams, fixed = {}, subcategories, hideFilters }: Props) {
  const query = { ...queryFromParams(searchParams), ...fixed, perPage: 24 };
  const result = await listProducts(query);
  const flatParams = Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
      <div>
        <Suspense>
          <Filters subcategories={subcategories} hide={hideFilters} />
        </Suspense>
      </div>
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            <strong className="text-ink">{result.total.toLocaleString("en-US")}</strong> {result.total === 1 ? "pattern" : "patterns"}
          </p>
          <Suspense>
            <SortSelect options={sortOptions} />
          </Suspense>
        </div>
        <h2 className="sr-only">Results</h2>
        {result.items.length ? (
          <ProductGrid products={result.items} columns={3} priorityCount={3} />
        ) : (
          <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <SearchX className="h-10 w-10 text-muted" aria-hidden />
            <h2 className="font-heading text-lg font-semibold">No patterns match these filters</h2>
            <p className="max-w-sm text-sm text-muted">Try removing a filter or searching for something broader.</p>
            <Link href={basePath} className="btn-outline mt-2">Reset filters</Link>
          </div>
        )}
        <Pagination page={result.page} pages={result.pages} basePath={basePath} params={flatParams} />
      </div>
    </div>
  );
}
