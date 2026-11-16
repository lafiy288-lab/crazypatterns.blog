import Link from "next/link";
import { BookOpen, Lightbulb, MessagesSquare } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const BOXES = [
  { icon: BookOpen, title: "Articles", text: "Guides, technique deep-dives and tips from experienced designers.", href: "/articles", cta: "Read articles" },
  { icon: MessagesSquare, title: "Forum", text: "Ask questions, share finished projects and help fellow makers.", href: "/forum", cta: "Visit the forum" },
  { icon: Lightbulb, title: "Inspiration", text: "Hand-picked featured patterns and seasonal ideas to spark your next project.", href: "/inspiration", cta: "Get inspired" },
];

export function InfoBoxes() {
  return (
    <section aria-label="Learn and connect" className="container-page py-10">
      <ul className="grid gap-5 md:grid-cols-3">
        {BOXES.map(({ icon: Icon, ...b }, i) => (
          <li key={b.title}>
            <Reveal>
              <Link href={b.href} className="group card flex h-full gap-4 p-6 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span>
                  <span className="block font-heading text-lg font-semibold">{b.title}</span>
                  <span className="mt-1 block text-sm text-muted">{b.text}</span>
                  <span className="mt-3 block text-sm font-semibold text-primary">{b.cta} →</span>
                </span>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
