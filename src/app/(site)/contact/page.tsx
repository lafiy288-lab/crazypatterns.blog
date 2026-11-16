import type { Metadata } from "next";
import { Clock, Mail, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";

export const metadata: Metadata = { title: "Contact", description: "Questions about a pattern or our site? Send us a message.", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return (
    <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">Get in touch</h1>
        <p className="mt-3 text-muted">Questions about a pattern, a designer, or partnering with us? We’d love to hear from you.</p>
        <ul className="mt-8 space-y-4 text-sm">
          <li className="flex gap-3"><Mail className="h-5 w-5 text-primary" aria-hidden /> Replies come from our support team by email.</li>
          <li className="flex gap-3"><Clock className="h-5 w-5 text-primary" aria-hidden /> We usually answer within one business day.</li>
          <li className="flex gap-3"><MessageCircle className="h-5 w-5 text-primary" aria-hidden /> For pattern-specific questions, include the pattern name.</li>
        </ul>
      </div>
      <div className="card p-6 sm:p-8">
        <ContactForm />
      </div>
    </div>
  );
}
