import { Card, Notice, SectionTitle } from "@/components/ui";

interface Item {
  title: string;
  law: string;
  body: string;
  inDemo: string;
}

const ENTITY: Item[] = [
  {
    title: "Register a legal entity first",
    law: "Indian Trusts Act 1882 · Societies Registration Act 1860 · Section 8, Companies Act 2013",
    body: "Money for other people cannot sit in a person's savings account. Register a public charitable trust, a society, or a Section 8 company, with a governing body, a deed that names 'relief of the poor, education and medical relief' among its objects, its own PAN and TAN, and a current account in the entity's name.",
    inDemo:
      "Every request in this demo collects into a fictional trust's nodal account, never into the organiser's account.",
  },
  {
    title: "Get 12AB and 80G approval",
    law: "Income-tax Act 1961, s. 12AB and s. 80G",
    body: "12AB exempts the entity's income; 80G lets donors claim a deduction. Both are applied for on Form 10A/10AB and are time-limited — they must be renewed. Do not print '80G available' on a receipt before the approval order is in hand.",
    inDemo:
      "Receipts are numbered and PAN is captured above ₹2,000 so the 80G paperwork would be valid.",
  },
  {
    title: "File the donation statement",
    law: "Rule 18AB · Form 10BD and Form 10BE",
    body: "Every year the entity files Form 10BD listing each donor with PAN and amount, and issues Form 10BE certificates to donors. Mismatches here are the most common reason donors lose their deduction.",
    inDemo:
      "Every contribution stores donor identity, PAN and a receipt number in the ledger — the data Form 10BD needs.",
  },
];

const MONEY: Item[] = [
  {
    title: "Collect through a licensed payment aggregator",
    law: "RBI guidelines on Payment Aggregators and Payment Gateways",
    body: "Use an authorised aggregator (Razorpay, Cashfree, PayU and the like). Settlements go into an escrow or nodal account, and the aggregator runs its own KYC on the entity. Never route collections through a personal UPI ID or a QR code shared in a WhatsApp group.",
    inDemo: "The payment step is simulated. Nothing is charged and no gateway is connected.",
  },
  {
    title: "No cash, and watch the ₹2,000 line",
    law: "Income-tax Act s. 80G(5D) and s. 269ST",
    body: "Cash donations above ₹2,000 get no 80G deduction, and receiving ₹2 lakh or more in cash from one person or for one event attracts a penalty equal to the amount. Keep the entire flow digital and traceable.",
    inDemo: "Cash is not an accepted method, and PAN becomes mandatory above ₹2,000.",
  },
  {
    title: "Foreign contributions need FCRA",
    law: "Foreign Contribution (Regulation) Act 2010",
    body: "An unregistered entity cannot accept money from a foreign source — that includes OCI cardholders and foreign citizens of Indian origin. FCRA registration or prior permission requires an FCRA account at SBI New Delhi. NRIs holding Indian passports remitting from their own funds are not a foreign source, but the burden of proof is on you.",
    inDemo:
      "Foreign-currency contributions are described as blocked; the demo has no gateway to enforce it.",
  },
  {
    title: "Release against bills, not on trust",
    law: "General fiduciary duty · trust deed covenants",
    body: "Pay the hospital, institute or vendor directly. Release in tranches, take the bill for each one, and publish the utilisation. Decide upfront — in the terms — what happens to surplus or to a campaign whose beneficiary passes away: usually the money moves to a general corpus or a similar case, never back to the organiser.",
    inDemo:
      "Tranches unlock one at a time, each needs utilisation proof, and surplus is capped by refusing over-collection past the approved goal.",
  },
];

const PEOPLE: Item[] = [
  {
    title: "Consent notice and data minimisation",
    law: "Digital Personal Data Protection Act 2023",
    body: "Verification collects sensitive identity documents. You need an itemised consent notice, a stated purpose, a retention limit, security safeguards, a named Data Protection Officer or grievance contact, and a way for members to withdraw consent and have data erased.",
    inDemo:
      "The application form carries a declaration and consent checkbox; no document is actually stored.",
  },
  {
    title: "Children's data needs a guardian",
    law: "DPDP Act 2023, s. 9",
    body: "Current JNV students are usually minors. Processing their data needs verifiable parental consent, and behavioural tracking or targeted advertising at them is prohibited outright. Prefer routing student cases through a parent, a teacher, or the alumni chapter.",
    inDemo:
      "Students can be members, and cases for a vidyalaya are filed by staff or alumni rather than by children.",
  },
  {
    title: "Medical and personal detail is not content",
    law: "DPDP Act 2023 · common-law privacy",
    body: "Publish the minimum needed for a donor to make a decision, with the patient's written consent. Diagnosis photos, full medical records and a family's address do not belong on a public page.",
    inDemo:
      "Campaign pages carry a document reference and a committee sign-off, not the document itself.",
  },
  {
    title: "Platform duties and grievance redressal",
    law: "IT Act 2000 · IT (Intermediary Guidelines) Rules 2021 · Consumer Protection Act 2019",
    body: "Publish terms of use, a privacy policy, a refund and cancellation policy, and the name and contact of a grievance officer with defined response timelines. Keep takedown and dispute processes written down before you need them.",
    inDemo:
      "A dispute route to the committee is shown on every request; the policies themselves are not drafted here.",
  },
];

const GUARDRAILS: Item[] = [
  {
    title: "Donation crowdfunding only",
    law: "SEBI and RBI perimeter",
    body: "Offering returns, equity or interest turns this into securities or lending and pulls you into SEBI or RBI licensing. Keep it to donations with no expectation of return, and say so in the terms.",
    inDemo: "There is no notion of return, repayment or interest anywhere in the model.",
  },
  {
    title: "The JNV name is not yours to use",
    law: "Emblems and Names (Prevention of Improper Use) Act 1950 · trademark law",
    body: "Jawahar Navodaya Vidyalaya and Navodaya Vidyalaya Samiti are Government of India institutions. Using the name or logo in a way that suggests official backing needs written permission from NVS. An independent alumni body should make its independence obvious.",
    inDemo: "The footer states plainly that the demo is not affiliated with or endorsed by NVS.",
  },
  {
    title: "Audit, report, repeat",
    law: "Trust deed · Income-tax audit under s. 12A(1)(b)",
    body: "Get the accounts audited by a chartered accountant, file ITR-7, publish an annual report with case-wise utilisation, and hold a members' meeting. Transparency is what keeps a community fund alive past its first controversy.",
    inDemo:
      "The public ledger and append-only audit log are the raw material such a report is built from.",
  },
  {
    title: "Fraud controls",
    law: "IPC/BNS cheating provisions · PMLA record-keeping practice",
    body: "Verify the organiser and the beneficiary separately, cap what one member can raise in a year, require independent committee approval, keep records for at least eight years, and have a written policy for freezing a case and reporting it to the police.",
    inDemo:
      "Two vouches plus a committee decision for members, two independent approvals per request, no self-approval, and a hard cap on request size.",
  },
];

function Group({ title, items }: { title: string; items: Item[] }) {
  return (
    <section>
      <SectionTitle title={title} />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.title} className="space-y-2">
            <h3 className="font-semibold tracking-tight">{item.title}</h3>
            <p className="text-xs font-medium text-ink-muted">{item.law}</p>
            <p className="text-sm text-ink-muted">{item.body}</p>
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-muted">
              <strong className="text-ink">In this demo:</strong> {item.inDemo}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default function LegalPage() {
  return (
    <div className="space-y-10">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Legal and compliance notes</h1>
        <p className="text-sm text-ink-muted">
          &ldquo;Legally fund raise&rdquo; ka matlab sirf ek acha app nahi hai — uske peeche ek
          registered sanstha, tax approvals, licensed payment rasta aur likhit policies chahiye. Yeh
          page batata hai ki is demo ka har feature kis kanoon ki taraf ishara karta hai.
        </p>
      </div>

      <Notice tone="accent" title="This is not legal advice">
        A prototype cannot make you compliant. Before collecting a single rupee from the public, get
        a chartered accountant and a lawyer who have set up charitable entities in India to review
        your structure, your terms, and your money flow.
      </Notice>

      <Group title="The entity and its tax status" items={ENTITY} />
      <Group title="Handling the money" items={MONEY} />
      <Group title="Members, beneficiaries and their data" items={PEOPLE} />
      <Group title="Guardrails" items={GUARDRAILS} />

      <section>
        <SectionTitle title="What this demo deliberately does not do" />
        <Card>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-muted">
            <li>No payment gateway, no real money, no bank integration.</li>
            <li>
              No document storage, no OCR, no identity API — proofs are described, not uploaded.
            </li>
            <li>No OTP or password login; the header switcher fakes four identities.</li>
            <li>
              No database. State lives in server memory and resets when the process restarts, which
              makes it easy to demo but useless as a system of record.
            </li>
            <li>All names, cases, receipts, PANs and account numbers are fictional.</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
