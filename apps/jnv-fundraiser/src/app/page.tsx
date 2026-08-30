import Link from "next/link";
import { CampaignCard } from "@/components/campaign-card";
import { Card, LinkButton, Pill, SectionTitle, Stat } from "@/components/ui";
import { listCampaigns, listDonations, listMembers } from "@/lib/db";
import { REQUIRED_APPROVALS, REQUIRED_VOUCHES } from "@/lib/jnv";
import { shortMoney } from "@/lib/format";
import { currentMember } from "@/lib/session";

const STEPS = [
  {
    title: "1 · Prove you are a Navodayan",
    body: `Pick your vidyalaya, batch and roll number, attach a TC, marksheet or ID, and get ${REQUIRED_VOUCHES} vouches from already-verified members of the same JNV. The committee makes the final call.`,
    href: "/verify",
    cta: "Apply for membership",
  },
  {
    title: "2 · File a need, with proof",
    body: "A verified member raises the request — for themselves, another Navodayan, a family or a vidyalaya — and attaches the hospital estimate, fee letter or damage report behind it.",
    href: "/raise",
    cta: "Raise a request",
  },
  {
    title: "3 · The committee verifies",
    body: `${REQUIRED_APPROVALS} committee members must independently sign off after checking the documents with the hospital or institute. Nobody can approve their own request.`,
    href: "/admin",
    cta: "See the review desk",
  },
  {
    title: "4 · Money moves in tranches",
    body: "Contributions sit in the trust's nodal account and are released stage by stage, straight to the vendor. Each tranche unlocks only after the previous one is settled with a bill.",
    href: "/ledger",
    cta: "Open the public ledger",
  },
];

export default async function HomePage() {
  const member = await currentMember();
  const campaigns = listCampaigns();
  const open = campaigns.filter(
    (campaign) => campaign.status === "live" || campaign.status === "under_review",
  );
  const donations = listDonations();
  const members = listMembers();

  const totalRaised = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const verified = members.filter((row) => row.status === "verified").length;

  return (
    <div className="space-y-14">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div className="space-y-5">
          <Pill tone="brand">Closed circle · JNV students, alumni, staff & families</Pill>
          <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Navodaya ka paisa, Navodaya ke liye — <span className="text-brand">verified</span> se
            verified tak.
          </h1>
          <p className="max-w-xl text-base text-ink-muted">
            Jab kisi Navodayan ko ilaaj, fees ya aapda ke liye madad chahiye, chanda WhatsApp groups
            me bikhar jaata hai aur koi hisaab nahi rehta. Yeh app us madad ko ek jagah laata hai —
            har member verified, har request committee se pass, aur har rupaya ledger par.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/campaigns">Browse open requests</LinkButton>
            <LinkButton href={member ? "/raise" : "/verify"} tone="neutral">
              {member ? "Raise a request" : "Join the circle"}
            </LinkButton>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Raised so far" value={shortMoney(totalRaised)} hint="across all requests" />
          <Stat
            label="Verified members"
            value={String(verified)}
            hint="TC / ID checked + vouched"
          />
          <Stat label="Open requests" value={String(open.length)} hint="live or under review" />
          <Stat label="Contributions" value={String(donations.length)} hint="all with receipts" />
        </div>
      </section>

      <section>
        <SectionTitle
          title="How the circle works"
          hint="Verification is the product. The fundraising is the easy part."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {STEPS.map((step) => (
            <Card key={step.title} className="flex flex-col gap-3">
              <h3 className="font-semibold tracking-tight">{step.title}</h3>
              <p className="text-sm text-ink-muted">{step.body}</p>
              <Link
                href={step.href}
                className="mt-auto text-sm font-medium text-brand hover:underline"
              >
                {step.cta} →
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Open requests"
          hint="Only verified members can see the documents and contribute."
          action={
            <Link href="/campaigns" className="text-sm font-medium text-brand hover:underline">
              View all →
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {open.slice(0, 3).map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="font-semibold tracking-tight">No outsiders</h3>
          <p className="mt-2 text-sm text-ink-muted">
            Membership is limited to people with a real JNV connection. Nobody can donate or raise
            without passing verification, which keeps the emotional-appeal scams out.
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold tracking-tight">No cash, no personal accounts</h3>
          <p className="mt-2 text-sm text-ink-muted">
            Contributions land in a nodal account held by the registered trust and leave it only
            against a bill, to the hospital, institute or vendor — never to an organiser&rsquo;s
            personal UPI.
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold tracking-tight">Receipts and 80G</h3>
          <p className="mt-2 text-sm text-ink-muted">
            Every contribution gets a numbered receipt, PAN is captured past the reporting limit,
            and the annual statement is filed. See the{" "}
            <Link href="/legal" className="underline">
              compliance checklist
            </Link>
            .
          </p>
        </Card>
      </section>
    </div>
  );
}
