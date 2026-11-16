import { ArticleForm } from "@/components/admin/article-form";

export const metadata = { title: "New article" };

export default function Page() {
  return <ArticleForm initial={{ title: "", slug: "", excerpt: "", cover: null, content: "", status: "draft" }} />;
}
