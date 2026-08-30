import { Pill } from "@/components/ui";
import type { CampaignStatus, MilestoneStatus, VerificationStatus } from "@/lib/types";

export function MemberStatusBadge({ status }: { status: VerificationStatus }) {
  if (status === "verified") return <Pill tone="brand">✓ Verified Navodayan</Pill>;
  if (status === "pending") return <Pill tone="accent">⏳ Verification pending</Pill>;
  return <Pill tone="danger">✕ Not verified</Pill>;
}

const CAMPAIGN_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  under_review: "Under committee review",
  live: "Collecting",
  funded: "Goal reached",
  rejected: "Rejected",
  closed: "Closed & settled",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const tone =
    status === "live" || status === "funded"
      ? "brand"
      : status === "rejected"
        ? "danger"
        : status === "closed"
          ? "neutral"
          : "accent";
  return <Pill tone={tone}>{CAMPAIGN_LABELS[status]}</Pill>;
}

const MILESTONE_LABELS: Record<MilestoneStatus, string> = {
  locked: "Locked",
  requested: "Release requested",
  released: "Released — bill pending",
  settled: "Settled with proof",
};

export function MilestoneBadge({ status }: { status: MilestoneStatus }) {
  const tone = status === "settled" ? "brand" : status === "locked" ? "neutral" : "accent";
  return <Pill tone={tone}>{MILESTONE_LABELS[status]}</Pill>;
}
