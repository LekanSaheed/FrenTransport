import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import { LEGAL_DOCUMENTS, LIVE_DOCUMENTS, legalDocument } from "@/libs/legal";
import { getPublicConfig } from "@/libs/serverConfig";
import { formatDate } from "@/libs/format";
import { pageMetadata } from "@/libs/seo";

/**
 * One page per document, built at deploy time (static: no server work per visit). The Refund
 * and Baggage policies show the current settings and are refreshed at most hourly.
 */
export const revalidate = 3600;
export const dynamicParams = false;
export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((d) => ({ slug: d.slug }));
}

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  return legalDocument(slug, LIVE_DOCUMENTS.has(slug) ? await getPublicConfig() : null);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const d = await load((await params).slug);
  if (!d) return {};
  return pageMetadata({ title: d.title, path: `/legal/${d.slug}`, description: d.summary });
}

export default async function LegalPage({ params }: Params) {
  const d = await load((await params).slug);
  if (!d) notFound();
  const others = LEGAL_DOCUMENTS.filter((o) => o.slug !== d.slug);

  return (
    <Container className="mb-16">
      <nav aria-label="Breadcrumb" className="pt-4 text-[13px] text-gray-500 md:pt-8">
        <Link href="/legal" className="hover:text-primary">
          Legal
        </Link>{" "}
        / <span className="text-ink">{d.title}</span>
      </nav>
      <PageHeader className="pt-3 md:pt-4" title={d.title} description={`Last updated ${formatDate(`${d.updated}T12:00:00+01:00`)}`} />

      <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
        <article className="max-w-3xl space-y-8 text-[15.5px] leading-[175%] text-gray-700">
          <div className="space-y-4">
            {d.intro.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
          {d.sections.map((s) => (
            <section key={s.heading} aria-labelledby={id(s.heading)}>
              <h2 id={id(s.heading)} className="font-display scroll-mt-28 text-[19px] font-black text-ink">
                {s.heading}
              </h2>
              <div className="mt-3 space-y-3">
                {s.body?.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
                {s.list && (
                  <ul className="list-disc space-y-2 pl-5 marker:text-accent">
                    {s.list.map((li) => (
                      <li key={li.slice(0, 40)}>{li}</li>
                    ))}
                  </ul>
                )}
                {s.after?.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            </section>
          ))}
          <p className="rounded-[14px] bg-tertiary/60 p-4 text-[14px] text-gray-600">
            Questions about this document? Reach us through our{" "}
            <Link href="/contact" className="font-bold text-primary hover:underline">
              Contact page
            </Link>
            .
          </p>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-6">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500">On this page</p>
              <ul className="mt-3 space-y-2 text-[13.5px]">
                {d.sections.map((s) => (
                  <li key={s.heading}>
                    <a href={`#${id(s.heading)}`} className="text-gray-600 hover:text-primary">
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500">Also see</p>
              <ul className="mt-3 space-y-2 text-[13.5px]">
                {others.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/legal/${o.slug}`} className="font-semibold text-primary hover:underline">
                      {o.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}

/** "3. Prices and payment" → "prices-and-payment" (for the contents links). */
function id(heading: string) {
  return heading
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
