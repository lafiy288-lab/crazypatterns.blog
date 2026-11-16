import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";

export const metadata: Metadata = { title: "Community Forum" };

export default function ForumPage() {
  return (
    <div className="container-page max-w-2xl py-16 text-center">
      <MessagesSquare className="mx-auto h-12 w-12 text-primary" aria-hidden />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Community Forum</h1>
      <p className="mt-3 text-muted">Our maker forum is opening soon: a friendly place to ask questions, share finished projects and swap tips. Subscribe to our newsletter on the homepage to be the first to know.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/articles" className="btn-primary">Read articles</Link>
        <Link href="/contact" className="btn-outline">Ask a question</Link>
      </div>
    </div>
  );
}
