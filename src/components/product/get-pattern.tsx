"use client";

import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ContactForm } from "@/components/site/contact-form";

/** "Get Pattern" opens the designer's external shop link if set, otherwise a request form. */
export function GetPattern({ productId, title, url, isFree }: { productId: string; title: string; url: string | null; isFree: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-accent w-full py-3.5 text-base sm:w-auto sm:px-10" onClick={() => setOpen(true)}>
        <Download className="h-5 w-5" aria-hidden /> {isFree ? "Get Free Pattern" : "Get Pattern"}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Get “${title}”`}>
        {url ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">This pattern is delivered directly by the designer. You’ll be taken to their page to {isFree ? "download it" : "complete your purchase"}.</p>
            <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="btn-primary w-full py-3">
              Continue to designer <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
            <p className="text-center text-xs text-muted">Opens in a new tab</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">Send us a short message and we’ll email you the pattern details and download link.</p>
            <ContactForm productId={productId} defaultSubject={`Pattern request: ${title}`} compact />
          </>
        )}
      </Modal>
    </>
  );
}
