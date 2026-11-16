import type { Metadata } from "next";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ImportWizard } from "@/components/admin/import/import-wizard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bulk import" };

export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Bulk import"
        description="Import hundreds or thousands of products from CSV, XLSX or JSON. Rows are processed in batches of 100 in the background."
        actions={
          <>
            <a href="/templates/patternnest-import-template.csv" download className="btn-outline">
              <Download className="h-4 w-4" aria-hidden /> CSV template
            </a>
            <a href="/templates/sample-import.csv" download className="btn-outline">
              <Download className="h-4 w-4" aria-hidden /> Sample (20 rows)
            </a>
          </>
        }
      />
      <ImportWizard />
    </>
  );
}
