# Navodaya Sahyog — JNV community fundraiser (demo)

A demo of a **closed, verified** fundraising circle for Jawahar Navodaya Vidyalaya
students, alumni, staff and their families.

The point of the app is not the fundraising — it is the verification around it.
Anyone can build a donate button; the hard part is making sure the person asking
is really a Navodayan, that the need is real, and that the money can be followed
to a bill.

## Running it

```bash
pnpm install          # from the repo root
pnpm --filter jnv-fundraiser dev
```

Then open http://localhost:3004.

There is no login. The header has a persona switcher so you can move between the
four states the app cares about:

| Persona | What you can do |
| --- | --- |
| Anjali — verified alumni | Raise requests, contribute, vouch for JNV Sitapur applicants |
| Dr. Sunita — review committee | Everything above, plus verify members, approve requests, release escrow |
| Ramesh — verification pending | Browse only; the raise and donate paths stay locked |
| Guest — not a member | Public pages only |

## The model

**Membership.** A claim is checked mechanically first (does the vidyalaya exist,
does the batch year fit the admission year, is the roll number already
registered). A clean claim still needs a proof document *and* two vouches from
verified members of the *same* vidyalaya, and then a committee decision. The
committee cannot approve someone who is short of vouches — that rule is enforced
in the action, not just in the UI.

**Fund requests.** Only a verified member can file one, for themselves, another
Navodayan, a family or a vidyalaya. Each request carries at least one supporting
document and a tranche plan whose amounts must add up to the goal. It goes live
only after two independent committee approvals, and nobody can approve their own
request.

**Money.** Contributions are restricted to verified members, capped at the
approved goal, and require a PAN above ₹2,000 so the 80G receipt stays valid.
Funds notionally sit in the trust's nodal account and leave it tranche by
tranche: the organiser requests a release, the committee authorises it, and the
organiser files a bill before the next tranche can be requested.

**Transparency.** Every contribution, release and decision lands in a public
ledger and an append-only audit log.

See `/legal` in the running app for how each of these maps to Indian law —
entity registration, 12AB/80G, Form 10BD, RBI payment-aggregator rules, FCRA,
and the DPDP Act.

## Layout

```
src/
├── app/
│   ├── page.tsx              # landing
│   ├── campaigns/            # list + detail (donate, tranches, review)
│   ├── raise/                # file a fund request
│   ├── verify/               # membership application + vouching
│   ├── admin/                # committee desk
│   ├── ledger/               # public money trail
│   └── legal/                # compliance notes
├── components/               # UI primitives, forms, badges
└── lib/
    ├── types.ts              # domain model
    ├── jnv.ts                # school directory + claim-checking rules
    ├── db.ts                 # in-memory store and seed data
    ├── actions.ts            # server actions (all the rules live here)
    └── session.ts            # demo persona cookie
```

## Limits

Prototype only. No payment gateway, no document storage, no real authentication,
no database — state lives in server memory and resets on restart. All names,
cases, receipts and account numbers are fictional. Not affiliated with or
endorsed by Navodaya Vidyalaya Samiti.
