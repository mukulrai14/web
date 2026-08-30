import Link from "next/link";
import { CampaignCard } from "@/components/campaign-card";
import { Empty, SectionTitle } from "@/components/ui";
import { listCampaigns } from "@/lib/db";
import { CATEGORY_LABELS } from "@/lib/jnv";
import type { CampaignCategory } from "@/lib/types";

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label: label.split(" / ")[0],
  })),
];

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = "all" } = await searchParams;
  const campaigns = listCampaigns().filter(
    (campaign) => category === "all" || campaign.category === (category as CampaignCategory),
  );

  const live = campaigns.filter((campaign) => campaign.status === "live");
  const review = campaigns.filter((campaign) => campaign.status === "under_review");
  const rest = campaigns.filter(
    (campaign) => campaign.status !== "live" && campaign.status !== "under_review",
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fund requests</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Every request here was filed by a verified Navodayan and carries at least one supporting
          document. Requests under review are visible to members so the community can flag problems
          before money is collected.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "all" ? "/campaigns" : `/campaigns?category=${filter.value}`}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              category === filter.value
                ? "border-brand bg-brand-soft text-brand"
                : "border-line bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <section>
        <SectionTitle title="Collecting now" />
        {live.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {live.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <Empty>No open request in this category right now.</Empty>
        )}
      </section>

      {review.length ? (
        <section>
          <SectionTitle
            title="Awaiting committee review"
            hint="Not collecting yet — two independent approvals are needed first."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {review.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>
      ) : null}

      {rest.length ? (
        <section>
          <SectionTitle title="Closed and settled" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
