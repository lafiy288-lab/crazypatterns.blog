"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { Stars } from "@/components/ui/stars";
import { cn } from "@/lib/utils";

export type CarouselReview = { id: string; name: string; rating: number; text: string; productTitle: string; productSlug: string };

/** Shows 3 reviews per slide (1 on mobile) with dot navigation and auto-advance. */
export function ReviewsCarousel({ reviews }: { reviews: CarouselReview[] }) {
  const perSlide = 3;
  const slides = Array.from({ length: Math.ceil(reviews.length / perSlide) }, (_, i) => reviews.slice(i * perSlide, i * perSlide + perSlide));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  if (!slides.length) return null;
  const go = (i: number) => setIndex((i + slides.length) % slides.length);

  return (
    <section aria-labelledby="reviews-title" aria-roledescription="carousel" className="container-page py-10" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 id="reviews-title" className="text-2xl font-semibold sm:text-3xl">Loved by our community</h2>
          <p className="mt-1 text-sm text-muted sm:text-base">Real reviews from makers who stitched, knitted and sewed along.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline h-10 w-10 p-0" onClick={() => go(index - 1)} aria-label="Previous reviews"><ChevronLeft className="h-4 w-4" /></button>
          <button className="btn-outline h-10 w-10 p-0" onClick={() => go(index + 1)} aria-label="Next reviews"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="relative min-h-[230px]" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.ul key={index} className="grid gap-5 md:grid-cols-3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            {slides[index].map((r) => (
              <li key={r.id} className="card flex flex-col gap-3 p-6">
                <Quote className="h-7 w-7 text-accent/60" aria-hidden />
                <Stars rating={r.rating} size={16} />
                <p className="flex-1 text-[15px] leading-relaxed">“{r.text}”</p>
                <div className="text-sm">
                  <p className="font-semibold">{r.name}</p>
                  <Link href={`/product/${r.productSlug}`} className="text-xs text-muted hover:text-primary">on {r.productTitle}</Link>
                </div>
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>
      <div className="mt-6 flex justify-center gap-2" role="tablist" aria-label="Choose review slide">
        {slides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1} of ${slides.length}`}
            onClick={() => go(i)}
            className="grid h-6 min-w-6 place-items-center"
          >
            <span className={cn("block h-2.5 rounded-full transition-all", i === index ? "w-8 bg-primary" : "w-2.5 bg-line hover:bg-muted")} />
          </button>
        ))}
      </div>
    </section>
  );
}
