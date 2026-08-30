import { CampaignStatusBadge, MemberStatusBadge } from "@/components/badges";
import { Button, Card, Empty, Notice, Pill, SectionTitle, Stat, inputClass } from "@/components/ui";
import { decideMembership, releaseMilestone, reviewCampaign } from "@/lib/actions";
import { listAudit, listCampaigns, listMembers, raisedFor } from "@/lib/db";
import { REQUIRED_APPROVALS, REQUIRED_VOUCHES, RELATION_LABELS, schoolName } from "@/lib/jnv";
import { money, timeAgo } from "@/lib/format";
import { canReview, currentMember } from "@/lib/session";
import Link from "next/link";

export default async function AdminPage() {
  const me = await currentMember();
  const reviewer = canReview(me);

  const members = listMembers();
  const campaigns = listCampaigns();
  const pendingMembers = members.filter((member) => member.status === "pending");
  const pendingCampaigns = campaigns.filter((campaign) => campaign.status === "under_review");
  const pendingReleases = campaigns.flatMap((campaign) =>
    campaign.milestones
      .filter((milestone) => milestone.status === "requested")
      .map((milestone) => ({ campaign, milestone })),
  );
  const audit = listAudit();

  return (
    <div className="space-y-10">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Committee desk</h1>
        <p className="text-sm text-ink-muted">
          The committee is elected from verified members, one per region, on a two-year term. It
          checks documents, approves requests, and authorises releases from escrow. No single member
          can push anything through alone.
        </p>
      </div>

      {!reviewer ? (
        <Notice tone="accent" title="Read-only view">
          You are not on the review committee, so the actions below are disabled. Switch to the
          committee persona in the header to try the review flow.
        </Notice>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Members" value={String(members.length)} />
        <Stat label="Pending applications" value={String(pendingMembers.length)} />
        <Stat label="Requests to review" value={String(pendingCampaigns.length)} />
        <Stat label="Releases to authorise" value={String(pendingReleases.length)} />
      </div>

      <section>
        <SectionTitle
          title="Membership applications"
          hint={`Approval needs ${REQUIRED_VOUCHES} vouches from the same vidyalaya — the committee cannot override that.`}
        />
        {pendingMembers.length ? (
          <div className="space-y-3">
            {pendingMembers.map((applicant) => {
              const shortOfVouches = applicant.vouches.length < REQUIRED_VOUCHES;
              return (
                <Card key={applicant.id} className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{applicant.fullName}</div>
                      <div className="text-sm text-ink-muted">
                        {RELATION_LABELS[applicant.relation]} · {schoolName(applicant.schoolCode)} ·
                        admitted {applicant.admissionYear} · batch {applicant.batchYear} · roll{" "}
                        {applicant.rollNumber}
                      </div>
                      <div className="mt-1 text-sm text-ink-muted">
                        {applicant.city} · {applicant.email} · {applicant.phone}
                      </div>
                    </div>
                    <MemberStatusBadge status={applicant.status} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-line bg-surface-2 p-3 text-sm">
                      <div className="text-xs text-ink-muted">Documents</div>
                      {applicant.documents.map((document) => (
                        <div key={document.id}>{document.label}</div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-line bg-surface-2 p-3 text-sm">
                      <div className="text-xs text-ink-muted">
                        Vouches ({applicant.vouches.length}/{REQUIRED_VOUCHES})
                      </div>
                      {applicant.vouches.length ? (
                        applicant.vouches.map((vouch) => (
                          <div key={vouch.byMemberId}>
                            {vouch.byName} ({vouch.byBatch}) — {vouch.note}
                          </div>
                        ))
                      ) : (
                        <div>None yet</div>
                      )}
                    </div>
                  </div>

                  <form action={decideMembership} className="flex flex-wrap gap-2">
                    <input type="hidden" name="memberId" value={applicant.id} />
                    <input
                      name="note"
                      className={`${inputClass} sm:max-w-sm`}
                      placeholder="Decision note (kept on record)"
                    />
                    <Button
                      type="submit"
                      name="decision"
                      value="approve"
                      disabled={!reviewer || shortOfVouches}
                    >
                      Verify member
                    </Button>
                    <Button
                      type="submit"
                      name="decision"
                      value="reject"
                      tone="danger"
                      disabled={!reviewer}
                    >
                      Reject
                    </Button>
                    {shortOfVouches ? (
                      <span className="self-center text-xs text-ink-muted">
                        Blocked: needs {REQUIRED_VOUCHES - applicant.vouches.length} more vouch(es).
                      </span>
                    ) : null}
                  </form>
                </Card>
              );
            })}
          </div>
        ) : (
          <Empty>No applications waiting.</Empty>
        )}
      </section>

      <section>
        <SectionTitle
          title="Fund requests awaiting sign-off"
          hint={`${REQUIRED_APPROVALS} independent approvals open collections. Organisers cannot approve their own request.`}
        />
        {pendingCampaigns.length ? (
          <div className="space-y-3">
            {pendingCampaigns.map((campaign) => {
              const approvals = campaign.approvals.filter((a) => a.decision === "approve").length;
              const mine = campaign.approvals.some((a) => a.byMemberId === me?.id);
              const isOrganiser = campaign.organiserId === me?.id;

              return (
                <Card key={campaign.id} className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="font-medium hover:underline"
                      >
                        {campaign.title}
                      </Link>
                      <div className="text-sm text-ink-muted">
                        {money(campaign.goalAmount)} · {schoolName(campaign.schoolCode)} ·{" "}
                        {campaign.documents.length} document(s) · filed{" "}
                        {timeAgo(campaign.createdAt)}
                      </div>
                    </div>
                    <Pill tone="accent">
                      {approvals}/{REQUIRED_APPROVALS} approvals
                    </Pill>
                  </div>

                  <p className="text-sm text-ink-muted">{campaign.summary}</p>

                  <form action={reviewCampaign} className="flex flex-wrap gap-2">
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <input
                      name="note"
                      className={`${inputClass} sm:max-w-sm`}
                      placeholder="What did you verify?"
                    />
                    <Button
                      type="submit"
                      name="decision"
                      value="approve"
                      disabled={!reviewer || mine || isOrganiser}
                    >
                      Approve
                    </Button>
                    <Button
                      type="submit"
                      name="decision"
                      value="reject"
                      tone="danger"
                      disabled={!reviewer || mine || isOrganiser}
                    >
                      Reject
                    </Button>
                    {mine ? (
                      <span className="self-center text-xs text-ink-muted">
                        You have already recorded a decision.
                      </span>
                    ) : isOrganiser ? (
                      <span className="self-center text-xs text-ink-muted">
                        You filed this request — someone else must review it.
                      </span>
                    ) : null}
                  </form>
                </Card>
              );
            })}
          </div>
        ) : (
          <Empty>Nothing waiting for review.</Empty>
        )}
      </section>

      <section>
        <SectionTitle
          title="Escrow releases to authorise"
          hint="Paid to the hospital, institute or vendor named on the document — never to the organiser."
        />
        {pendingReleases.length ? (
          <div className="space-y-3">
            {pendingReleases.map(({ campaign, milestone }) => (
              <Card
                key={milestone.id}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <Link href={`/campaigns/${campaign.id}`} className="font-medium hover:underline">
                    {campaign.title}
                  </Link>
                  <div className="text-sm text-ink-muted">
                    {milestone.title} · {money(milestone.amount)} · collected{" "}
                    {money(raisedFor(campaign.id))}
                  </div>
                </div>
                <form action={releaseMilestone}>
                  <input type="hidden" name="campaignId" value={campaign.id} />
                  <input type="hidden" name="milestoneId" value={milestone.id} />
                  <Button type="submit" disabled={!reviewer}>
                    Release {money(milestone.amount)}
                  </Button>
                </form>
              </Card>
            ))}
          </div>
        ) : (
          <Empty>No release requests pending.</Empty>
        )}
      </section>

      <section>
        <SectionTitle title="Audit log" hint="Append-only. Visible to every member." />
        <Card className="divide-y divide-line p-0">
          {audit.slice(0, 12).map((entry) => (
            <div key={entry.id} className="px-5 py-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">{entry.actor}</span>
                <span className="text-xs text-ink-muted">{timeAgo(entry.at)}</span>
              </div>
              <div className="text-ink-muted">{entry.detail}</div>
              <div className="mt-0.5 text-xs text-ink-muted">{entry.action}</div>
            </div>
          ))}
        </Card>
      </section>

      <section>
        <SectionTitle title="Member directory" />
        <Card className="divide-y divide-line p-0">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
            >
              <div>
                <div className="text-sm font-medium">
                  {member.fullName}
                  {member.isCommittee ? (
                    <span className="ml-2 text-xs text-brand">· committee</span>
                  ) : null}
                </div>
                <div className="text-xs text-ink-muted">
                  {schoolName(member.schoolCode)} · batch {member.batchYear} ·{" "}
                  {RELATION_LABELS[member.relation]}
                </div>
              </div>
              <MemberStatusBadge status={member.status} />
            </div>
          ))}
        </Card>
      </section>

      <section>
        <SectionTitle title="All requests" />
        <Card className="divide-y divide-line p-0">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
            >
              <Link href={`/campaigns/${campaign.id}`} className="text-sm hover:underline">
                {campaign.title}
              </Link>
              <div className="flex items-center gap-3 text-xs text-ink-muted">
                <span>
                  {money(raisedFor(campaign.id))} / {money(campaign.goalAmount)}
                </span>
                <CampaignStatusBadge status={campaign.status} />
              </div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
