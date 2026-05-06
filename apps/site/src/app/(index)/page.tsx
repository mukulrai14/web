import { createPageMetadata } from "@/lib/page-metadata";
import { SITE_HOME_DESCRIPTION, SITE_HOME_TITLE } from "@/lib/site-metadata";
import { Button } from "@prisma/eclipse";
import { CardSection } from "@/components/homepage/card-section/card-section";
import review from "../../data/homepage.json";
import Testimonials from "../../components/homepage/testimonials";
// Antigravity is a purely decorative particle animation — skip SSR to keep
// the 300 inline <g> elements out of the initial HTML payload (~36 KB).
// The actual next/dynamic({ ssr: false }) call lives in the client wrapper
// because ssr:false is only valid inside Client Components in the App Router.
import Antigravity from "../../components/homepage/antigravity-client";

const twoCol = [
  {
    content: (
      <>
        <span className="font-mono text-xs text-foreground-ppg uppercase tracking-wider block mb-4">
          Prisma ORM
        </span>
        <h2 className="text-foreground-neutral text-left stretch-display text-4xl font-black! font-sans-display mt-0 mb-4">
          Type-safe queries, generated from your schema.
        </h2>
        <p className="text-foreground-neutral-weak! text-base">
          Prisma ORM gives TypeScript developers a schema-first workflow with a
          generated client, autocomplete, and compile-time guarantees. The result is a
          database layer that feels predictable, readable, and aligned with how modern
          TypeScript teams build.
        </p>
      </>
    ),
    imageUrl: null,
    imageAlt: null,
    mobileImageUrl: null,
    mobileImageAlt: null,
    logos: null,
    color: "ppg" as const,
    useDefaultLogos: true,
    visualPosition: "right" as const,
    visualType: "logoGrid" as const,
  },
  {
    content: (
      <>
        <span className="font-mono text-xs text-foreground-ppg uppercase tracking-wider block mb-4">
          Prisma Postgres
        </span>
        <h2 className="text-foreground-neutral text-left stretch-display text-4xl font-black! font-sans-display mt-0 mb-4">
          Managed Postgres for modern deployments.
        </h2>
        <p className="text-foreground-neutral-weak! text-base">
          Prisma Postgres gives you standard PostgreSQL with built-in pooling and
          support for modern deployment environments. Use it on its own, or pair it
          with Prisma ORM and Prisma Compute for a more integrated experience.
        </p>
      </>
    ),
    imageUrl: "/illustrations/homepage/real_ppg",
    imageAlt: "Real Postgres",
    mobileImageUrl: "/illustrations/homepage/real_ppg_mobile",
    mobileImageAlt: "Real PPG mobile",
    logos: null,
    useDefaultLogos: false,
    visualPosition: "left" as const,
    visualType: "image" as const,
  },
  {
    content: (
      <>
        <span className="font-mono text-xs text-foreground-ppg uppercase tracking-wider block mb-4">
          Prisma Compute
        </span>
        <h2 className="text-foreground-neutral text-left stretch-display text-4xl font-black! font-sans-display mt-0 mb-4">
          Run TypeScript the way it actually works.
        </h2>
        <p className="text-foreground-neutral-weak! text-base">
          Prisma Compute is built for APIs, background jobs, AI agents, and other
          long-lived workloads. No cold starts, no timeouts, and no extra
          infrastructure to stitch together.
        </p>
      </>
    ),
    imageUrl: null,
    imageAlt: null,
    mobileImageUrl: null,
    mobileImageAlt: null,
    logos: null,
    other: (
      <div className="box box-visible p-6 md:p-8 flex h-full min-h-[320px] flex-col justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-stroke-ppg/40 bg-background-ppg/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-foreground-ppg">
            <i className="fa-regular fa-microchip" aria-hidden="true" />
            Long-lived compute
          </div>
          <ul className="m-0 space-y-3 pl-4 text-sm text-foreground-neutral-weak">
            <li>No cold starts</li>
            <li>No execution timeouts</li>
            <li>Great for APIs, jobs, and AI agents</li>
            <li>Co-locates with Prisma Postgres by default</li>
          </ul>
        </div>
        <div>
          <Button asChild variant="ppg" size="lg">
            <a href="/compute">
              Explore Compute
              <i className="fa-regular fa-arrow-right ml-2" />
            </a>
          </Button>
        </div>
      </div>
    ),
    useDefaultLogos: false,
    visualPosition: "right" as const,
    visualType: "other" as const,
  },
];
export const metadata = createPageMetadata({
  title: SITE_HOME_TITLE,
  description: SITE_HOME_DESCRIPTION,
  path: "/",
  ogImage: "/og/og-index.png",
});

export default function SiteHome() {
  return (
    <main className="flex-1 w-full z-1 bg-background-default">
      <section className="hero h-full relative -mt-24 flex items-end justify-center px-4 pt-40">
        <div className="w-screen h-full absolute inset-0">
          <Antigravity
            count={300}
            magnetRadius={16}
            ringRadius={15}
            waveSpeed={2.6}
            waveAmplitude={2.6}
            particleSize={0.9}
            lerpSpeed={0.02}
            color="#14b8a6"
            autoAnimate
            particleVariance={1}
            rotationSpeed={0}
            depthFactor={2.6}
            pulseSpeed={4.9}
            particleShape="capsule"
            fieldStrength={15.3}
          />
        </div>
        <div className="absolute inset-0 pointer-events-none z-1 bg-[linear-gradient(180deg,var(--color-foreground-ppg)_0%,var(--color-background-default)_100%)] opacity-20" />
        <div className="content relative z-2 flex flex-col gap-8">
          <div className="flex flex-col gap-4 items-center text-center">
            <h1 className="mb-0 text-center mt-0 type-title-6xl text-foreground-neutral max-w-4xl mx-auto">
              Prisma for
              <br />
              TypeScript developers
            </h1>
          </div>
          <p className="text-center text-foreground-neutral max-w-3xl mx-auto text-xl">
            Type-safe data, modern infrastructure, and a better developer experience
            from schema to production.
          </p>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <Button asChild variant="ppg" size="3xl" className="font-sans-display! font-[650]">
              <a href="/docs/orm">
                <span>Explore Prisma ORM</span>
                <i className="fa-regular fa-arrow-right ml-2" />
              </a>
            </Button>
            <Button asChild variant="default-strong" size="3xl">
              <a href="/compute">
                <span>Explore Compute</span>
                <i className="fa-regular fa-arrow-right ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="my-12">
        <div className="max-w-[1240px] mx-auto w-full z-10 px-4 pt-4 pb-0">
          <div className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,var(--color-background-ppg-str)_0%,var(--color-background-default)_42%,var(--color-background-subtle)_100%)]">
            <div className="grid lg:grid-cols-12">
              <div className="p-6 md:p-8 lg:col-span-5 lg:border-r lg:border-stroke-subtle">
                <div className="max-w-xl space-y-4">
                  <h2 className="m-0 text-4xl md:text-[36px] font-black text-foreground-neutral font-sans-display stretch-display">
                    One platform for the full TypeScript path.
                  </h2>
                  <p className="m-0 max-w-2xl text-base md:text-lg text-foreground-neutral-weak">
                    Model your data, run on managed Postgres, and ship compute close to it,
                    all with the same code-first workflow.
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 lg:col-span-7">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wider text-foreground-ppg">
                      Model
                    </div>
                    <div className="text-base font-medium text-foreground-neutral">
                      Schema to client
                    </div>
                    <p className="m-0 text-sm text-foreground-neutral-weak">
                      Define once, generate the primitives your app uses every day.
                    </p>
                  </div>
                  <div className="space-y-2 md:border-l md:border-stroke-subtle md:pl-4">
                    <div className="text-xs uppercase tracking-wider text-foreground-ppg">
                      Store
                    </div>
                    <div className="text-base font-medium text-foreground-neutral">
                      Postgres that fits modern deploys
                    </div>
                    <p className="m-0 text-sm text-foreground-neutral-weak">
                      Standard PostgreSQL, pooling included, ready for production.
                    </p>
                  </div>
                  <div className="space-y-2 md:border-l md:border-stroke-subtle md:pl-4">
                    <div className="text-xs uppercase tracking-wider text-foreground-ppg">
                      Run
                    </div>
                    <div className="text-base font-medium text-foreground-neutral">
                      Compute for real workloads
                    </div>
                    <p className="m-0 text-sm text-foreground-neutral-weak">
                      APIs, jobs, and agents without the usual runtime constraints.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card Sections */}
      <section className="w-screen my-12">
        <CardSection cardSection={twoCol} />
      </section>

      {/* Pricing CTA Section */}
      <section className="my-12 bg-[linear-gradient(180deg,var(--color-background-default)-177.75%,var(--color-background-ppg-str)100%)] p-12 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]">
        <div className="web-cta mx-auto flex w-fit flex-col items-center gap-3 md:flex-row md:gap-12 lg:p-4">
          <h3 className="text-2xl text-center font-sans-display font-bold text-foreground-neutral md:text-left">
            Run TypeScript
            <br />
            the way it actually works.
          </h3>
          <div className="content flex flex-col items-center gap-3 md:items-start lg:flex-row lg:items-center lg:gap-12">
            <p className="max-w-94 w-full text-center text-md text-foreground-neutral-weak md:text-left">
              Prisma Compute is built for APIs, background jobs, AI agents, and other
              long-lived workloads. No cold starts, no timeouts, and no extra
              infrastructure to stitch together.
            </p>
            <Button asChild variant="ppg" size="2xl">
              <a href="/compute">
                Explore Compute
                <i className="fa-regular fa-arrow-right" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {review?.testimonials?.length > 0 && (
        <section className="my-12">
          <div className="px-4 py-10">
            <div className="max-w-[1240px] mx-auto">
              <h5
                className="[&>b]:text-background-ppg-reverse-strong font-sans-display stretch-display text-center text-base mb-12"
                dangerouslySetInnerHTML={{ __html: review.title }}
              />
              <Testimonials
                noShadow
                list={review.testimonials}
                mask="linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)"
              />
            </div>
          </div>
        </section>
      )}

      {/* Footer CTA Section */}
      <section className="bg-radial from-background-ppg/50 from-0% to-background-default to-70% px-4 py-12">
        <div className="mx-auto rounded-2xl bg-[url('/illustrations/homepage/footer_grid.svg')] bg-cover bg-center px-4 py-12">
          <div className="p-4 md:p-8">
            <div className="mx-auto flex max-w-[580px] flex-col items-center gap-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-3xl text-foreground-neutral font-sans-display stretch-display">
                  Start with Prisma. Expand when you need more.
                </h2>
                <p className="text-foreground-neutral-weak">
                  Begin with Prisma ORM, add Prisma Postgres when you need managed
                  infrastructure, and deploy on Prisma Compute when you're ready to run
                  in production.
                </p>
              </div>
              <div className="flex flex-col gap-6 md:flex-row">
                <Button asChild variant="ppg" size="2xl">
                  <a href="/docs/orm">
                    Explore Prisma ORM
                    <i className="fa-regular fa-arrow-right ml-2" />
                  </a>
                </Button>
                <Button asChild variant="default-strong" size="2xl">
                  <a href="/postgres">
                    Explore Prisma Postgres
                    <i className="fa-regular fa-arrow-right" />
                  </a>
                </Button>
              </div>
              <h6 className="mb-0! -mt-4 text-xs text-foreground-neutral-weaker">
                Free to get started, no credit card needed.
              </h6>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
