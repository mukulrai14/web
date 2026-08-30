import Link from "next/link";
import { RaiseForm } from "@/components/raise-form";
import { Card, LinkButton, Notice } from "@/components/ui";
import { REQUIRED_APPROVALS, REQUIRED_VOUCHES } from "@/lib/jnv";
import { currentMember } from "@/lib/session";

const RULES = [
  "Only a verified member can file a request — for themselves, another Navodayan, a family or a vidyalaya.",
  "At least one verifiable document must back the ask: a hospital estimate, fee letter, FIR or damage report.",
  `${REQUIRED_APPROVALS} committee members must independently approve it, and no one can approve their own request.`,
  "Money is collected in the trust's nodal account and released in tranches, straight to the hospital, institute or vendor.",
  "Every released tranche needs a bill before the next one unlocks. Unused funds return to the community corpus.",
];

export default async function RaisePage() {
  const me = await currentMember();

  return (
    <div className="space-y-8">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Raise a fund request</h1>
        <p className="text-sm text-ink-muted">
          Madad maangna sharm ki baat nahi hai — lekin paisa maangne ka tareeka saaf hona chahiye.
          Jo bhi aap yahan bharenge, committee usko document se milaayegi aur donors ko poora hisaab
          dikhega.
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold">Ground rules</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-ink-muted">
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </Card>

      {me?.status === "verified" ? (
        <RaiseForm defaultSchool={me.schoolCode} />
      ) : (
        <Notice tone="accent" title="Verification required">
          <p>
            {me
              ? `Your membership is ${me.status}. You need ${REQUIRED_VOUCHES} vouches and a committee decision before you can raise a request.`
              : "Only verified Navodayans can raise a request."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <LinkButton href="/verify">Go to verification</LinkButton>
            <LinkButton href="/campaigns" tone="neutral">
              Browse requests instead
            </LinkButton>
          </div>
          <p className="mt-3 text-xs">
            Emergency ho? Apne vidyalaya ke kisi verified member se kahiye ki woh aapki taraf se
            request file kare —{" "}
            <Link href="/campaigns" className="underline">
              woh aapke naam par bhi utha sakte hain
            </Link>
            .
          </p>
        </Notice>
      )}
    </div>
  );
}
