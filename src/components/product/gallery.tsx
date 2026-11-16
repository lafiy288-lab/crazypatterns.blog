"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ProductImage } from "@/lib/types";
import { pickSrc } from "@/lib/image-src";
import { cn } from "@/lib/utils";

/** Product image gallery with hover magnifier and a keyboard-accessible full-screen lightbox. */
export function Gallery({ images, title }: { images: ProductImage[]; title: string }) {
  const list = images.length ? images : [{ url: "/placeholders/fallback.webp" } as ProductImage];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const current = list[index];
  const go = useCallback((d: number) => setIndex((i) => (i + d + list.length) % list.length), [list.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, go]);

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {list.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto md:flex-col" aria-label="Product images">
          {list.map((img, i) => (
            <li key={i}>
              <button
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={cn("relative block h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition", i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}
              >
                <Image src={pickSrc(img, "thumb")} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative flex-1">
        <button
          type="button"
          className="card relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setLightbox(true)}
          aria-label="Zoom: open full-screen image"
        >
          <Image
            src={pickSrc(current, "large")}
            alt={current.alt || title}
            fill
            priority
            sizes="(min-width:1024px) 560px, 100vw"
            placeholder={current.blur ? "blur" : "empty"}
            blurDataURL={current.blur}
            className="object-cover transition-transform duration-200"
            style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
          <span className="chip absolute bottom-3 right-3 gap-1 bg-white/90 text-ink"><ZoomIn className="h-3.5 w-3.5" aria-hidden /> Zoom</span>
        </button>
        {list.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-soft" aria-label="Previous image"><ChevronLeft className="h-5 w-5 text-slate-800" /></button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-soft" aria-label="Next image"><ChevronRight className="h-5 w-5 text-slate-800" /></button>
          </>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div role="dialog" aria-modal="true" aria-label={`${title} images`} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(false)}>
            <div className="relative h-full max-h-[90vh] w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <Image src={pickSrc(current, "large")} alt={current.alt || title} fill sizes="100vw" className="object-contain" />
            </div>
            <button autoFocus onClick={() => setLightbox(false)} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white" aria-label="Close"><X className="h-5 w-5" /></button>
            {list.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white" aria-label="Previous image"><ChevronLeft className="h-6 w-6" /></button>
                <button onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white" aria-label="Next image"><ChevronRight className="h-6 w-6" /></button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
