import type { AuditAction, AuditEntry, Campaign, Donation, Member } from "@/lib/types";

/**
 * In-memory store for the demo.
 *
 * A production build would put this behind Prisma Postgres; keeping it in
 * process memory means the demo runs with zero setup. State survives hot
 * reloads (it hangs off globalThis) but resets when the server restarts.
 */
interface Store {
  members: Member[];
  campaigns: Campaign[];
  donations: Donation[];
  audit: AuditEntry[];
  seq: number;
}

const STORE_KEY = Symbol.for("jnv-fundraiser.store");

type GlobalWithStore = typeof globalThis & { [STORE_KEY]?: Store };

function iso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

function inDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function seed(): Store {
  const members: Member[] = [
    {
      id: "m-anjali",
      fullName: "Anjali Verma",
      relation: "alumni",
      schoolCode: "JNV-UP-SIT",
      admissionYear: 2008,
      batchYear: 2015,
      rollNumber: "SIT/2015/041",
      email: "anjali.verma@example.in",
      phone: "+91 98••••4410",
      city: "Lucknow",
      status: "verified",
      isCommittee: false,
      kycVerified: true,
      documents: [
        {
          id: "d-anjali-tc",
          kind: "transfer-certificate",
          label: "TC — JNV Sitapur, 2015",
          uploadedAt: iso(220),
          reviewedBy: "Dr. Sunita Meena",
        },
      ],
      vouches: [
        {
          byMemberId: "m-sunita",
          byName: "Dr. Sunita Meena",
          byBatch: 2004,
          note: "Batchmate of my junior wing; verified TC personally.",
          at: iso(219),
        },
        {
          byMemberId: "m-imran",
          byName: "Imran Qureshi",
          byBatch: 2015,
          note: "Same batch, house captain in class 12.",
          at: iso(219),
        },
      ],
      appliedAt: iso(221),
      reviewedAt: iso(219),
      reviewedBy: "Dr. Sunita Meena",
    },
    {
      id: "m-sunita",
      fullName: "Dr. Sunita Meena",
      relation: "alumni",
      schoolCode: "JNV-RJ-ALW",
      admissionYear: 1997,
      batchYear: 2004,
      rollNumber: "ALW/2004/012",
      email: "sunita.meena@example.in",
      phone: "+91 99••••7781",
      city: "Jaipur",
      status: "verified",
      isCommittee: true,
      kycVerified: true,
      documents: [
        {
          id: "d-sunita-tc",
          kind: "transfer-certificate",
          label: "TC — JNV Alwar, 2004",
          uploadedAt: iso(400),
          reviewedBy: "Founding committee",
        },
      ],
      vouches: [],
      appliedAt: iso(401),
      reviewedAt: iso(400),
      reviewedBy: "Founding committee",
    },
    {
      id: "m-imran",
      fullName: "Imran Qureshi",
      relation: "alumni",
      schoolCode: "JNV-UP-SIT",
      admissionYear: 2008,
      batchYear: 2015,
      rollNumber: "SIT/2015/007",
      email: "imran.q@example.in",
      phone: "+91 90••••1122",
      city: "Delhi",
      status: "verified",
      isCommittee: true,
      kycVerified: true,
      documents: [
        {
          id: "d-imran-ms",
          kind: "marksheet",
          label: "Class 12 CBSE marksheet, 2015",
          uploadedAt: iso(380),
          reviewedBy: "Dr. Sunita Meena",
        },
      ],
      vouches: [],
      appliedAt: iso(381),
      reviewedAt: iso(380),
      reviewedBy: "Dr. Sunita Meena",
    },
    {
      id: "m-lakshmi",
      fullName: "Lakshmi Nair",
      relation: "staff",
      schoolCode: "JNV-KL-ERN",
      admissionYear: 2011,
      batchYear: 2011,
      rollNumber: "NVS/PGT/8841",
      email: "lakshmi.nair@example.in",
      phone: "+91 94••••3390",
      city: "Kochi",
      status: "verified",
      isCommittee: false,
      kycVerified: true,
      documents: [
        {
          id: "d-lakshmi-appt",
          kind: "appointment-letter",
          label: "NVS appointment letter (PGT Physics)",
          uploadedAt: iso(150),
          reviewedBy: "Imran Qureshi",
        },
      ],
      vouches: [
        {
          byMemberId: "m-sunita",
          byName: "Dr. Sunita Meena",
          byBatch: 2004,
          note: "Verified against the NVS staff directory.",
          at: iso(149),
        },
        {
          byMemberId: "m-imran",
          byName: "Imran Qureshi",
          byBatch: 2015,
          note: "Spoke to the principal at JNV Ernakulam.",
          at: iso(149),
        },
      ],
      appliedAt: iso(151),
      reviewedAt: iso(149),
      reviewedBy: "Imran Qureshi",
    },
    {
      id: "m-ramesh",
      fullName: "Ramesh Yadav",
      relation: "alumni",
      schoolCode: "JNV-UP-SIT",
      admissionYear: 2010,
      batchYear: 2017,
      rollNumber: "SIT/2017/098",
      email: "ramesh.yadav@example.in",
      phone: "+91 87••••5567",
      city: "Gaya",
      status: "pending",
      isCommittee: false,
      kycVerified: false,
      documents: [
        {
          id: "d-ramesh-tc",
          kind: "transfer-certificate",
          label: "TC — JNV Sitapur, 2017",
          uploadedAt: iso(2),
        },
      ],
      vouches: [
        {
          byMemberId: "m-imran",
          byName: "Imran Qureshi",
          byBatch: 2015,
          note: "Junior from Tagore house; I have seen his TC myself.",
          at: iso(1),
        },
      ],
      appliedAt: iso(2),
    },
  ];

  const campaigns: Campaign[] = [
    {
      id: "c-kidney",
      title: "Kidney transplant for Sanjay Kumar (JNV Gaya, 2013)",
      organiserId: "m-imran",
      beneficiaryKind: "member",
      beneficiaryName: "Sanjay Kumar",
      schoolCode: "JNV-BR-GAY",
      category: "medical",
      goalAmount: 450000,
      deadline: inDays(38),
      summary:
        "Sanjay is on dialysis three times a week. AIIMS Patna has scheduled a transplant; the family has arranged ₹1.6 lakh of the ₹6.1 lakh estimate.",
      story:
        "Sanjay was in the 2013 batch of JNV Gaya and now teaches at a government school in Nawada. He was diagnosed with end-stage renal disease in March. His sister is a matched donor and AIIMS Patna has given a surgery date. The family has already spent their savings on eighteen months of dialysis.\n\nThe committee has seen the AIIMS estimate, the dialysis records and Sanjay's TC. Money goes straight to the hospital account in three tranches — pre-operative workup, surgery, and post-transplant medication for six months. Every tranche is settled with hospital bills before the next one unlocks.",
      documents: [
        {
          id: "d-kidney-est",
          kind: "hospital-estimate",
          label: "AIIMS Patna transplant estimate — ₹6,10,000",
          uploadedAt: iso(12),
          reviewedBy: "Dr. Sunita Meena",
        },
        {
          id: "d-kidney-tc",
          kind: "transfer-certificate",
          label: "Beneficiary TC — JNV Gaya, 2013",
          uploadedAt: iso(12),
          reviewedBy: "Imran Qureshi",
        },
      ],
      status: "live",
      approvals: [
        {
          byMemberId: "m-sunita",
          byName: "Dr. Sunita Meena",
          decision: "approve",
          note: "Estimate verified with the hospital's TPA desk over phone.",
          at: iso(11),
        },
        {
          byMemberId: "m-imran",
          byName: "Imran Qureshi",
          decision: "approve",
          note: "Beneficiary identity and batch confirmed with the 2013 group.",
          at: iso(11),
        },
      ],
      milestones: [
        {
          id: "ms-kidney-1",
          title: "Pre-operative workup and cross-matching",
          amount: 120000,
          status: "settled",
          releasedAt: iso(9),
          utilisationProof: {
            id: "d-kidney-bill1",
            kind: "utilisation-bill",
            label: "AIIMS receipt #PT-88213 — ₹1,18,400",
            uploadedAt: iso(6),
            reviewedBy: "Dr. Sunita Meena",
          },
        },
        {
          id: "ms-kidney-2",
          title: "Surgery and ICU stay",
          amount: 230000,
          status: "requested",
        },
        {
          id: "ms-kidney-3",
          title: "Six months of immunosuppressants",
          amount: 100000,
          status: "locked",
        },
      ],
      escrowAccount: "JNV Alumni Welfare Trust · A/c ••••4417 (nodal)",
      createdAt: iso(12),
    },
    {
      id: "c-neet",
      title: "NEET coaching + hostel for 4 girls from JNV Koraput",
      organiserId: "m-lakshmi",
      beneficiaryKind: "school",
      beneficiaryName: "JNV Koraput — batch of 2026",
      schoolCode: "JNV-OD-KOR",
      category: "education",
      goalAmount: 180000,
      deadline: inDays(54),
      summary:
        "Four students cleared the NEET screening cut-off but cannot afford the one-year coaching fee and hostel charges in Bhubaneswar.",
      story:
        "All four are first-generation learners from Koraput district. The principal has sent their class 11 report cards and the coaching institute's fee structure. The ask covers ₹32,000 per student in fees and ₹13,000 in hostel and mess charges.\n\nFunds are paid directly to the institute and the hostel — never in cash to the students. Attendance and term results are shared with donors every quarter.",
      documents: [
        {
          id: "d-neet-fee",
          kind: "fee-receipt",
          label: "Coaching fee structure 2026 batch",
          uploadedAt: iso(20),
          reviewedBy: "Imran Qureshi",
        },
      ],
      status: "live",
      approvals: [
        {
          byMemberId: "m-imran",
          byName: "Imran Qureshi",
          decision: "approve",
          note: "Principal's letter checked; institute is on the approved list.",
          at: iso(19),
        },
        {
          byMemberId: "m-sunita",
          byName: "Dr. Sunita Meena",
          decision: "approve",
          note: "Payments will be made institute-to-institute only.",
          at: iso(19),
        },
      ],
      milestones: [
        {
          id: "ms-neet-1",
          title: "First-term coaching fee (4 students)",
          amount: 64000,
          status: "released",
          releasedAt: iso(8),
        },
        {
          id: "ms-neet-2",
          title: "Hostel and mess, first half",
          amount: 52000,
          status: "locked",
        },
        {
          id: "ms-neet-3",
          title: "Second-term coaching fee",
          amount: 64000,
          status: "locked",
        },
      ],
      escrowAccount: "JNV Alumni Welfare Trust · A/c ••••4417 (nodal)",
      createdAt: iso(20),
    },
    {
      id: "c-flood",
      title: "Rebuilding after the Kamrup flood — 9 alumni families",
      organiserId: "m-anjali",
      beneficiaryKind: "family",
      beneficiaryName: "9 families around JNV Kamrup",
      schoolCode: "JNV-AS-KAM",
      category: "emergency",
      goalAmount: 275000,
      deadline: inDays(11),
      summary:
        "August floods damaged homes of nine alumni families. Relief covers roofing sheets, school books for 14 children, and one month of rations.",
      story:
        "The district administration's damage assessment lists all nine households. The local alumni chapter has done a physical survey and photographed each home.\n\nRelief is bought in bulk by the chapter and distributed against signed receipts. Any surplus is returned to the general emergency corpus, not retained by the organiser.",
      documents: [
        {
          id: "d-flood-fir",
          kind: "fir-copy",
          label: "District damage assessment report",
          uploadedAt: iso(5),
          reviewedBy: "Imran Qureshi",
        },
      ],
      status: "under_review",
      approvals: [
        {
          byMemberId: "m-imran",
          byName: "Imran Qureshi",
          decision: "approve",
          note: "Assessment report matches the chapter's photo survey.",
          at: iso(4),
        },
      ],
      milestones: [
        {
          id: "ms-flood-1",
          title: "Roofing sheets and repair labour",
          amount: 150000,
          status: "locked",
        },
        {
          id: "ms-flood-2",
          title: "Books, uniforms and one month of rations",
          amount: 125000,
          status: "locked",
        },
      ],
      escrowAccount: "JNV Alumni Welfare Trust · A/c ••••4417 (nodal)",
      createdAt: iso(5),
    },
  ];

  const donations: Donation[] = [
    {
      id: "dn-1",
      campaignId: "c-kidney",
      donorMemberId: "m-anjali",
      donorName: "Anjali Verma",
      amount: 25000,
      anonymous: false,
      method: "upi",
      pan: "ABCPV••••K",
      receiptNo: "JNV/25-26/000118",
      txnRef: "UPI-8841203991",
      message: "Sitapur 2015 batch is with you, Sanjay bhai.",
      createdAt: iso(10),
    },
    {
      id: "dn-2",
      campaignId: "c-kidney",
      donorMemberId: "m-lakshmi",
      donorName: "Lakshmi Nair",
      amount: 11000,
      anonymous: false,
      method: "netbanking",
      pan: "AKRPN••••M",
      receiptNo: "JNV/25-26/000119",
      txnRef: "NB-5590128841",
      createdAt: iso(9),
    },
    {
      id: "dn-3",
      campaignId: "c-kidney",
      donorMemberId: "m-imran",
      donorName: "Imran Qureshi",
      amount: 50000,
      anonymous: true,
      method: "netbanking",
      pan: "AQWPI••••L",
      receiptNo: "JNV/25-26/000121",
      txnRef: "NB-5590128902",
      createdAt: iso(8),
    },
    {
      id: "dn-4",
      campaignId: "c-kidney",
      donorMemberId: "m-sunita",
      donorName: "Dr. Sunita Meena",
      amount: 100000,
      anonymous: false,
      method: "netbanking",
      pan: "BQOPM••••R",
      receiptNo: "JNV/25-26/000124",
      txnRef: "NB-5590129113",
      message: "Alwar 2004. Keep the receipts coming, we will fund the rest.",
      createdAt: iso(6),
    },
    {
      id: "dn-5",
      campaignId: "c-neet",
      donorMemberId: "m-anjali",
      donorName: "Anjali Verma",
      amount: 15000,
      anonymous: false,
      method: "upi",
      pan: "ABCPV••••K",
      receiptNo: "JNV/25-26/000127",
      txnRef: "UPI-8841204410",
      createdAt: iso(7),
    },
    {
      id: "dn-6",
      campaignId: "c-neet",
      donorMemberId: "m-imran",
      donorName: "Imran Qureshi",
      amount: 40000,
      anonymous: false,
      method: "upi",
      pan: "AQWPI••••L",
      receiptNo: "JNV/25-26/000131",
      txnRef: "UPI-8841204987",
      message: "Ek bhi bachchi coaching se na chhoote.",
      createdAt: iso(4),
    },
    {
      id: "dn-7",
      campaignId: "c-neet",
      donorMemberId: "m-lakshmi",
      donorName: "Lakshmi Nair",
      amount: 21000,
      anonymous: false,
      method: "upi",
      pan: "AKRPN••••M",
      receiptNo: "JNV/25-26/000133",
      txnRef: "UPI-8841205012",
      createdAt: iso(2),
    },
  ];

  const audit: AuditEntry[] = [
    {
      id: "a-1",
      at: iso(12),
      action: "campaign.created",
      actor: "Imran Qureshi",
      detail: "Filed a medical fund request for ₹4,50,000.",
      subjectId: "c-kidney",
    },
    {
      id: "a-2",
      at: iso(11),
      action: "campaign.live",
      actor: "Review committee",
      detail: "Two approvals recorded; collections opened.",
      subjectId: "c-kidney",
    },
    {
      id: "a-3",
      at: iso(9),
      action: "milestone.released",
      actor: "Trust treasurer",
      detail: "₹1,20,000 released to AIIMS Patna for pre-operative workup.",
      subjectId: "c-kidney",
    },
    {
      id: "a-4",
      at: iso(6),
      action: "milestone.settled",
      actor: "Dr. Sunita Meena",
      detail: "Utilisation bill #PT-88213 verified against tranche 1.",
      subjectId: "c-kidney",
    },
    {
      id: "a-5",
      at: iso(2),
      action: "member.applied",
      actor: "Ramesh Yadav",
      detail: "Membership application filed for JNV Gaya, batch 2017.",
      subjectId: "m-ramesh",
    },
  ];

  return { members, campaigns, donations, audit, seq: 200 };
}

export function db(): Store {
  const holder = globalThis as GlobalWithStore;
  if (!holder[STORE_KEY]) {
    holder[STORE_KEY] = seed();
  }
  return holder[STORE_KEY];
}

export function nextId(prefix: string): string {
  const store = db();
  store.seq += 1;
  return `${prefix}-${store.seq}`;
}

export function log(action: AuditAction, actor: string, detail: string, subjectId?: string): void {
  db().audit.unshift({
    id: nextId("a"),
    at: new Date().toISOString(),
    action,
    actor,
    detail,
    subjectId,
  });
}

/* ---------------------------------- reads --------------------------------- */

export function getMember(id: string | null | undefined): Member | undefined {
  if (!id) return undefined;
  return db().members.find((member) => member.id === id);
}

export function listMembers(): Member[] {
  return [...db().members].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}

export function getCampaign(id: string): Campaign | undefined {
  return db().campaigns.find((campaign) => campaign.id === id);
}

export function listCampaigns(): Campaign[] {
  return [...db().campaigns].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function donationsFor(campaignId: string): Donation[] {
  return db()
    .donations.filter((donation) => donation.campaignId === campaignId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function raisedFor(campaignId: string): number {
  return db()
    .donations.filter((donation) => donation.campaignId === campaignId)
    .reduce((total, donation) => total + donation.amount, 0);
}

export function donorCount(campaignId: string): number {
  return new Set(
    db()
      .donations.filter((donation) => donation.campaignId === campaignId)
      .map((donation) => donation.donorMemberId ?? donation.id),
  ).size;
}

export function listDonations(): Donation[] {
  return [...db().donations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAudit(): AuditEntry[] {
  return db().audit;
}
