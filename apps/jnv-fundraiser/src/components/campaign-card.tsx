import Link from "next/link";
import { CampaignStatusBadge } from "@/components/badges";
import { Progress } from "@/components/ui";
import { donorCount, raisedFor } from "@/lib/db";
import { CATEGORY_LABELS, schoolName } from "@/lib/jnv";
import { daysLeft, money, pct } from "@/lib/format";
import type { Campaign } from "@/lib/types";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const raised = raisedFor(campaign.id);
  const progress = pct(raised, campaign.goalAmount);
  const days = daysLeft(campaign.deadline);

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-brand/50"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        <CampaignStatusBadge status={campaign.status} />
        <span>{CATEGORY_LABELS[campaign.category]}</span>
      </div>

      <h3 className="text-base leading-snug font-semibold tracking-tight">{campaign.title}</h3>
      <p className="line-clamp-3 text-sm text-ink-muted">{campaign.summary}</p>

      <div className="mt-auto space-y-2 pt-2">
        <Progress value={progress} />
        <div className="flex flex-wrap justify-between gap-2 text-xs text-ink-muted">
          <span>
            <strong className="text-ink">{money(raised)}</strong> of {money(campaign.goalAmount)}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="flex flex-wrap justify-between gap-2 text-xs text-ink-muted">
          <span>{schoolName(campaign.schoolCode)}</span>
          <span>
            {donorCount(campaign.id)} donors · {days} days left
          </span>
        </div>
      </div>
    </Link>
  );
}
