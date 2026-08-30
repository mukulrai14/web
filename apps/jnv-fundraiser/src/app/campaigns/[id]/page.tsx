import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignStatusBadge, MilestoneBadge } from "@/components/badges";
import { DonateForm } from "@/components/donate-form";
import {
  Button,
  Card,
  Empty,
  LinkButton,
  Notice,
  Pill,
  Progress,
  SectionTitle,
  inputClass,
} from "@/components/ui";
import { releaseMilestone, requestMilestone, reviewCampaign, settleMilestone } from "@/lib/actions";
import { donationsFor, donorCount, getCampaign, getMember, raisedFor } from "@/lib/db";
import { CATEGORY_LABELS, REQUIRED_APPROVALS, schoolName } from "@/lib/jnv";
import { day, daysLeft, money, pct, timeAgo } from "@/lib/format";
import { canReview, currentMember } from "@/lib/session";

const BENEFICIARY_LABELS = {
  self: "the organiser",
  member: "another Navodayan",
  family: "a Navodayan's family",
  school: "a vidyalaya",
} as const;

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filed?: string }>;
}) {
  const { id } = await params;
  const { filed } = await searchParams;
  const campaign = getCampaign(id);
  if (!campaign) notFound();

  const me = await currentMember();
  const organiser = getMember(campaign.organiserId);
  const raised = raisedFor(campaign.id);
  const remaining = Math.max(0, campaign.goalAmount - raised);
  const donations = donationsFor(campaign.id);
  const approvals = campaign.approvals.filter((approval) => approval.decision === "approve");
  const isOrganiser = me?.id === campaign.organiserId;
  const reviewer = canReview(me);
  const alreadyReviewed = campaign.approvals.some((approval) => approval.byMemberId === me?.id);
  const released = campaign.milestones
    .filter((milestone) => milestone.status === "released" || milestone.status === "settled")
    .reduce((sum, milestone) => sum + milestone.amount, 0);

  return (
    <div className="space-y-8">
      <Link href="/campaigns" className="text-sm text-ink-muted hover:text-ink">
        ← All requests
      </Link>

      {filed ? (
        <Notice tone="brand" title="Request filed">
          It is now with the review committee. Two members must verify your documents before
          collections open — you will be notified on each decision.
        </Notice>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-8">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <CampaignStatusBadge status={campaign.status} />
              <Pill>{CATEGORY_LABELS[campaign.category]}</Pill>
              <Pill>{schoolName(campaign.schoolCode)}</Pill>
            </div>
            <h1 className="text-2xl leading-snug font-semibold tracking-tight">{campaign.title}</h1>
            <p className="text-sm text-ink-muted">
              Filed by <strong className="text-ink">{organiser?.fullName ?? "Unknown"}</strong>
              {organiser
                ? ` · ${schoolName(organiser.schoolCode)}, batch ${organiser.batchYear}`
                : ""}{" "}
              · {timeAgo(campaign.createdAt)} · for {BENEFICIARY_LABELS[campaign.beneficiaryKind]} (
              {campaign.beneficiaryName})
            </p>
          </header>

          <Card className="space-y-3">
            <p className="text-sm font-medium">{campaign.summary}</p>
            {campaign.story.split("\n\n").map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-sm leading-relaxed text-ink-muted">
                {paragraph}
              </p>
            ))}
          </Card>

          <section>
            <SectionTitle
              title="Verification trail"
              hint="What the committee checked before this request could collect anything."
            />
            <Card className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Documents on file</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {campaign.documents.map((document) => (
                    <li key={document.id} className="flex flex-wrap items-center gap-2">
                      <span>{document.label}</span>
                      {document.reviewedBy ? (
                        <Pill tone="brand">verified by {document.reviewedBy}</Pill>
                      ) : (
                        <Pill tone="accent">awaiting check</Pill>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold">
                  Committee sign-off ({approvals.length}/{REQUIRED_APPROVALS})
                </h3>
                {campaign.approvals.length ? (
                  <ul className="mt-2 space-y-2 text-sm">
                    {campaign.approvals.map((approval) => (
                      <li key={approval.byMemberId} className="text-ink-muted">
                        <span className="font-medium text-ink">{approval.byName}</span>{" "}
                        {approval.decision === "approve" ? "approved" : "rejected"} ·{" "}
                        {day(approval.at)} — {approval.note}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-muted">No decision recorded yet.</p>
                )}
              </div>

              <Notice tone="neutral">
                Collections sit in <strong>{campaign.escrowAccount}</strong>. The organiser never
                receives the money directly.
              </Notice>
            </Card>
          </section>

          <section>
            <SectionTitle
              title="Release plan"
              hint="Each tranche unlocks only after the previous one is settled with a bill."
            />
            <div className="space-y-3">
              {campaign.milestones.map((milestone, index) => {
                const previousSettled = campaign.milestones
                  .slice(0, index)
                  .every((earlier) => earlier.status === "settled");
                const fundedEnough = raised - released >= milestone.amount;

                return (
                  <Card key={milestone.id} className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">
                          {index + 1}. {milestone.title}
                        </div>
                        <div className="text-sm text-ink-muted">
                          {money(milestone.amount)}
                          {milestone.releasedAt ? ` · released ${day(milestone.releasedAt)}` : ""}
                        </div>
                      </div>
                      <MilestoneBadge status={milestone.status} />
                    </div>

                    {milestone.utilisationProof ? (
                      <p className="text-sm text-ink-muted">
                        Proof on file: {milestone.utilisationProof.label}
                      </p>
                    ) : null}

                    {isOrganiser &&
                    milestone.status === "locked" &&
                    campaign.status !== "under_review" ? (
                      <form action={requestMilestone} className="flex flex-wrap items-center gap-3">
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <input type="hidden" name="milestoneId" value={milestone.id} />
                        <Button
                          type="submit"
                          tone="neutral"
                          disabled={!previousSettled || !fundedEnough}
                        >
                          Request release
                        </Button>
                        {!previousSettled ? (
                          <span className="text-xs text-ink-muted">
                            Settle the earlier tranche first.
                          </span>
                        ) : !fundedEnough ? (
                          <span className="text-xs text-ink-muted">
                            Not enough collected yet for this tranche.
                          </span>
                        ) : null}
                      </form>
                    ) : null}

                    {reviewer && milestone.status === "requested" ? (
                      <form action={releaseMilestone} className="flex items-center gap-3">
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <input type="hidden" name="milestoneId" value={milestone.id} />
                        <Button type="submit">Release from escrow</Button>
                        <span className="text-xs text-ink-muted">
                          Paid directly to the vendor named on the document.
                        </span>
                      </form>
                    ) : null}

                    {isOrganiser && milestone.status === "released" ? (
                      <form action={settleMilestone} className="flex flex-wrap gap-2">
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <input type="hidden" name="milestoneId" value={milestone.id} />
                        <input
                          name="proofLabel"
                          className={`${inputClass} sm:max-w-sm`}
                          placeholder="Bill / receipt reference"
                          required
                          minLength={6}
                        />
                        <Button type="submit" tone="neutral">
                          File utilisation proof
                        </Button>
                      </form>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <SectionTitle title={`Contributions (${donations.length})`} />
            {donations.length ? (
              <Card className="divide-y divide-line p-0">
                {donations.map((donation) => (
                  <div key={donation.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
                    <div>
                      <div className="text-sm font-medium">
                        {donation.anonymous ? "Anonymous Navodayan" : donation.donorName}
                      </div>
                      {donation.message ? (
                        <div className="text-sm text-ink-muted">{donation.message}</div>
                      ) : null}
                      <div className="text-xs text-ink-muted">
                        Receipt {donation.receiptNo} · {donation.method.toUpperCase()} ·{" "}
                        {timeAgo(donation.createdAt)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{money(donation.amount)}</div>
                  </div>
                ))}
              </Card>
            ) : (
              <Empty>No contributions yet.</Empty>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="space-y-4">
            <div className="space-y-2">
              <Progress value={pct(raised, campaign.goalAmount)} />
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{money(raised)}</span>
                <span className="text-ink-muted">of {money(campaign.goalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-ink-muted">
                <span>{donorCount(campaign.id)} donors</span>
                <span>{daysLeft(campaign.deadline)} days left</span>
              </div>
              <div className="text-xs text-ink-muted">
                {money(released)} already released against bills.
              </div>
            </div>

            {campaign.status === "live" && me?.status === "verified" ? (
              <DonateForm campaignId={campaign.id} remaining={remaining} />
            ) : campaign.status === "live" ? (
              <Notice tone="accent" title="Members only">
                Contributions are open to verified Navodayans.{" "}
                <Link href="/verify" className="underline">
                  Get verified
                </Link>{" "}
                to give here.
              </Notice>
            ) : campaign.status === "under_review" ? (
              <Notice tone="accent" title="Not collecting yet">
                {REQUIRED_APPROVALS - approvals.length} more committee approval(s) needed before
                this request can accept money.
              </Notice>
            ) : campaign.status === "rejected" ? (
              <Notice tone="danger" title="Rejected by the committee">
                {campaign.reviewNote || "The documents did not check out."}
              </Notice>
            ) : (
              <Notice tone="brand" title="Collections closed">
                The goal was met. Remaining tranches are released against bills.
              </Notice>
            )}
          </Card>

          {reviewer && campaign.status === "under_review" && !alreadyReviewed && !isOrganiser ? (
            <Card className="space-y-3">
              <h3 className="text-sm font-semibold">Your review</h3>
              <form action={reviewCampaign} className="space-y-3">
                <input type="hidden" name="campaignId" value={campaign.id} />
                <textarea
                  name="note"
                  rows={3}
                  className={inputClass}
                  placeholder="What did you verify, and with whom?"
                />
                <div className="flex gap-2">
                  <Button type="submit" name="decision" value="approve">
                    Approve
                  </Button>
                  <Button type="submit" name="decision" value="reject" tone="danger">
                    Reject
                  </Button>
                </div>
              </form>
            </Card>
          ) : null}

          <Card className="space-y-2 text-sm text-ink-muted">
            <h3 className="text-sm font-semibold text-ink">Something looks wrong?</h3>
            <p>
              Any verified member can raise a dispute. The committee freezes releases within 24
              hours and the case is re-verified.
            </p>
            <LinkButton href="/admin" tone="neutral" className="w-full">
              Report to the committee
            </LinkButton>
          </Card>
        </aside>
      </div>
    </div>
  );
}
