import Link from "next/link";
import { Card, Empty, Notice, SectionTitle, Stat } from "@/components/ui";
import { getCampaign, listAudit, listCampaigns, listDonations } from "@/lib/db";
import { day, money, shortMoney, timeAgo } from "@/lib/format";

export default function LedgerPage() {
  const donations = listDonations();
  const campaigns = listCampaigns();
  const audit = listAudit();

  const collected = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const released = campaigns.reduce(
    (sum, campaign) =>
      sum +
      campaign.milestones
        .filter((milestone) => milestone.status === "released" || milestone.status === "settled")
        .reduce((inner, milestone) => inner + milestone.amount, 0),
    0,
  );
  const settled = campaigns.reduce(
    (sum, campaign) =>
      sum +
      campaign.milestones
        .filter((milestone) => milestone.status === "settled")
        .reduce((inner, milestone) => inner + milestone.amount, 0),
    0,
  );

  return (
    <div className="space-y-10">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Public ledger</h1>
        <p className="text-sm text-ink-muted">
          Har rupaya jo aaya, jo nikla, aur jiska bill jama hua — sab yahan. Donor apna naam chhupa
          sakta hai, lekin transaction kabhi nahi chhupta.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat
          label="Collected"
          value={shortMoney(collected)}
          hint={`${donations.length} contributions`}
        />
        <Stat label="Released from escrow" value={shortMoney(released)} hint="to vendors" />
        <Stat
          label="Settled with bills"
          value={shortMoney(settled)}
          hint="utilisation proof on file"
        />
        <Stat
          label="Held in escrow"
          value={shortMoney(Math.max(0, collected - released))}
          hint="nodal account balance"
        />
      </div>

      <Notice tone="neutral" title="How to read this">
        Collected is what donors paid in. Released is what left the nodal account against an
        approved tranche. Settled is the part already backed by a hospital bill, fee receipt or
        vendor invoice. The gap between released and settled is what the committee is currently
        chasing.
      </Notice>

      <section>
        <SectionTitle title={`Contributions (${donations.length})`} />
        {donations.length ? (
          <Card className="divide-y divide-line p-0">
            {donations.map((donation) => {
              const campaign = getCampaign(donation.campaignId);
              return (
                <div key={donation.id} className="flex flex-wrap justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {donation.anonymous ? "Anonymous Navodayan" : donation.donorName}
                    </div>
                    <div className="truncate text-sm text-ink-muted">
                      {campaign ? (
                        <Link href={`/campaigns/${campaign.id}`} className="hover:underline">
                          {campaign.title}
                        </Link>
                      ) : (
                        donation.campaignId
                      )}
                    </div>
                    <div className="text-xs text-ink-muted">
                      Receipt {donation.receiptNo} · txn {donation.txnRef} ·{" "}
                      {donation.method.toUpperCase()}
                      {donation.pan ? ` · PAN ${donation.pan}` : ""} · {day(donation.createdAt)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{money(donation.amount)}</div>
                </div>
              );
            })}
          </Card>
        ) : (
          <Empty>No contributions recorded yet.</Empty>
        )}
      </section>

      <section>
        <SectionTitle title="Money out of escrow" />
        <Card className="divide-y divide-line p-0">
          {campaigns.flatMap((campaign) =>
            campaign.milestones
              .filter((milestone) => milestone.status !== "locked")
              .map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div>
                    <Link href={`/campaigns/${campaign.id}`} className="text-sm hover:underline">
                      {campaign.title}
                    </Link>
                    <div className="text-xs text-ink-muted">
                      {milestone.title} ·{" "}
                      {milestone.utilisationProof
                        ? `settled — ${milestone.utilisationProof.label}`
                        : milestone.status === "released"
                          ? "released, bill awaited"
                          : "release requested"}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{money(milestone.amount)}</div>
                </div>
              )),
          )}
        </Card>
      </section>

      <section>
        <SectionTitle title="Audit trail" hint="Append-only record of every decision." />
        <Card className="divide-y divide-line p-0">
          {audit.map((entry) => (
            <div key={entry.id} className="px-5 py-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">{entry.actor}</span>
                <span className="text-xs text-ink-muted">{timeAgo(entry.at)}</span>
              </div>
              <div className="text-ink-muted">{entry.detail}</div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
