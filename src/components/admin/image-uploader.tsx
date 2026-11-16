"use client";

import Image from "next/image";
import { GripVertical, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { ProductImage } from "@/lib/types";
import { pickSrc } from "@/lib/image-src";
import { cn } from "@/lib/utils";
import { adminApi, useAdminUi } from "./toast";

type Props = { value: ProductImage[]; onChange: (images: ProductImage[]) => void; max?: number; single?: boolean; label?: string };

/** Drag & drop multi-image upload with drag-to-reorder. The first image is the cover. */
export function ImageUploader({ value, onChange, max = 12, single, label = "Images" }: Props) {
  const { toast } = useAdminUi();
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, single ? 1 : max - value.length);
    if (!list.length) return;
    setBusy(true);
    try {
      const form = new FormData();
      list.forEach((f) => form.append("files", f));
      const { images } = await adminApi<{ images: ProductImage[] }>("/api/admin/upload", { method: "POST", body: form });
      onChange(single ? images.slice(0, 1) : [...value, ...images]);
      toast(`${images.length} image${images.length > 1 ? "s" : ""} uploaded`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      <p className="label">{label}</p>
      {value.length > 0 && (
        <ul className={cn("mb-3 grid gap-3", single ? "grid-cols-1 max-w-[160px]" : "grid-cols-3 sm:grid-cols-4 md:grid-cols-6")}>
          {value.map((img, i) => (
            <li
              key={img.url + i}
              draggable={!single}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              className={cn("group relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-cream", dragIndex === i && "opacity-40")}
            >
              <Image src={pickSrc(img, "thumb")} alt={img.alt || ""} fill sizes="160px" className="object-cover" />
              {!single && i === 0 && <span className="chip absolute left-1.5 top-1.5 gap-1 bg-primary text-white"><Star className="h-3 w-3" /> Cover</span>}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                {!single ? <GripVertical className="h-4 w-4 cursor-grab text-white" aria-hidden /> : <span />}
                <div className="flex gap-1">
                  {!single && i > 0 && (
                    <button type="button" onClick={() => move(i, 0)} className="rounded-md bg-white/90 px-1.5 text-[10px] font-semibold text-slate-800" aria-label="Make cover image">Cover</button>
                  )}
                  <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="grid h-6 w-6 place-items-center rounded-md bg-white/90 text-red-600" aria-label={`Remove image ${i + 1}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {(single ? value.length === 0 : value.length < max) && (
        <div
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("Files")) {
              e.preventDefault();
              setOver(true);
            }
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
          }}
          className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition", over ? "border-primary bg-primary/5" : "border-line")}
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <ImagePlus className="h-6 w-6 text-muted" aria-hidden />}
          <p className="text-sm text-muted">{busy ? "Uploading & optimizing…" : `Drag & drop image${single ? "" : "s"} here, or`}</p>
          <button type="button" className="btn-outline py-1.5 text-xs" onClick={() => input.current?.click()} disabled={busy}>Choose file{single ? "" : "s"}</button>
          <p className="text-[11px] text-muted">JPG, PNG, WebP, GIF or AVIF · max 8 MB each · converted to WebP in 3 sizes</p>
          <input ref={input} type="file" accept="image/*" multiple={!single} className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
        </div>
      )}
    </div>
  );
}
