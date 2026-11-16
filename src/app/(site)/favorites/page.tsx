import type { Metadata } from "next";
import { FavoritesList } from "@/components/site/favorites-list";

export const metadata: Metadata = { title: "Your favorites", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Your favorites</h1>
      <p className="mb-8 mt-2 text-muted">Saved on this device only — no account needed.</p>
      <FavoritesList />
    </div>
  );
}
