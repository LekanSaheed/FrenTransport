import Link from "next/link";
import { HiOutlineDocumentText } from "react-icons/hi2";
import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import { LEGAL_DOCUMENTS } from "@/libs/legal";
import { pageMetadata } from "@/libs/seo";

export const metadata = pageMetadata({
  title: "Legal",
  path: "/legal",
  description: "Obere Transport's Terms and Conditions, Customer Privacy Policy and Driver Privacy Policy.",
});

export default function LegalIndex() {
  return (
    <Container className="mb-16">
      <PageHeader eyebrow="Legal" title="Policies and terms" description="How we work, what you can expect from us, and how we look after personal data." />
      <ul className="grid gap-4 md:grid-cols-3">
        {LEGAL_DOCUMENTS.map((d) => (
          <li key={d.slug}>
            <Link
              href={`/legal/${d.slug}`}
              className="flex h-full flex-col rounded-[18px] border border-border-stroke bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
            >
              <HiOutlineDocumentText size={26} className="text-accent" />
              <span className="font-display mt-3 text-[18px] font-black text-ink">{d.title}</span>
              <span className="mt-2 flex-1 text-[14px] leading-[160%] text-gray-500">{d.summary}</span>
              <span className="mt-4 text-[13.5px] font-extrabold text-primary">Read →</span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
