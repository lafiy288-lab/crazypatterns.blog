import Link from "next/link";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { SearchBar } from "@/components/site/search-bar";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="container-page flex max-w-xl flex-col items-center py-20 text-center">
        <p className="font-heading text-7xl font-bold text-accent-ink">404</p>
        <h1 className="mt-4 text-3xl font-bold">We dropped a stitch</h1>
        <p className="mt-3 text-muted">The page you’re looking for doesn’t exist or has moved. Try searching for a pattern instead.</p>
        <SearchBar className="mt-8" />
        <Link href="/" className="btn-primary mt-6">Back to homepage</Link>
      </main>
      <Footer />
    </>
  );
}
