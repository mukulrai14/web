/**
 * Domain model for the JNV Fundraiser demo.
 *
 * Two things make this different from a generic crowdfunding app:
 *  1. Membership is closed — only people connected to a Jawahar Navodaya
 *     Vidyalaya (students, alumni, staff, parents) can join, and every member
 *     is verified before they can raise or donate.
 *  2. Money never moves on trust alone — a fund request needs committee
 *     sign-off, supporting documents, and staged (milestone) release with
 *     utilisation proof.
 */

export type MemberRelation = "student" | "alumni" | "staff" | "parent";

export type VerificationStatus = "pending" | "verified" | "rejected";

/** How a membership claim was proved. */
export type ProofKind =
  | "transfer-certificate"
  | "marksheet"
  | "id-card"
  | "appointment-letter"
  | "alumni-vouch"
  | "hospital-estimate"
  | "fee-receipt"
  | "fir-copy"
  | "bank-passbook"
  | "utilisation-bill";

export interface DocumentRef {
  id: string;
  kind: ProofKind;
  /** Demo only: no real files are stored, just a label + checksum-ish id. */
  label: string;
  uploadedAt: string;
  /** Set once a committee member has eyeballed the document. */
  reviewedBy?: string;
}

/** An existing verified member attesting that an applicant is genuine. */
export interface Vouch {
  byMemberId: string;
  byName: string;
  byBatch: number;
  note: string;
  at: string;
}

export interface Member {
  id: string;
  fullName: string;
  relation: MemberRelation;
  schoolCode: string;
  /** Year the person joined JNV (usually class 6). */
  admissionYear: number;
  /** Class 12 batch year — the number Navodayans actually identify with. */
  batchYear: number;
  rollNumber: string;
  email: string;
  phone: string;
  city: string;
  status: VerificationStatus;
  /** Committee members review applications and approve fund requests. */
  isCommittee: boolean;
  /** KYC is separate from membership: needed only to receive money. */
  kycVerified: boolean;
  documents: DocumentRef[];
  vouches: Vouch[];
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export type CampaignCategory = "medical" | "education" | "emergency" | "livelihood" | "community";

export type CampaignStatus = "draft" | "under_review" | "live" | "funded" | "rejected" | "closed";

/** Who the money is for. Anything other than "self" needs extra proof. */
export type BeneficiaryKind = "self" | "member" | "family" | "school";

export interface Approval {
  byMemberId: string;
  byName: string;
  decision: "approve" | "reject";
  note: string;
  at: string;
}

export type MilestoneStatus = "locked" | "requested" | "released" | "settled";

/**
 * Funds are released in tranches. A tranche only unlocks after the previous
 * one has been settled with a bill / receipt, so donors can follow the rupee.
 */
export interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: MilestoneStatus;
  releasedAt?: string;
  utilisationProof?: DocumentRef;
}

export interface Campaign {
  id: string;
  title: string;
  organiserId: string;
  beneficiaryKind: BeneficiaryKind;
  beneficiaryName: string;
  /** JNV the case belongs to — shown as the community context. */
  schoolCode: string;
  category: CampaignCategory;
  goalAmount: number;
  deadline: string;
  summary: string;
  story: string;
  documents: DocumentRef[];
  status: CampaignStatus;
  approvals: Approval[];
  milestones: Milestone[];
  /** Masked nodal/escrow account the collections sit in. */
  escrowAccount: string;
  createdAt: string;
  reviewNote?: string;
}

export type PaymentMethod = "upi" | "netbanking" | "card" | "cheque";

export interface Donation {
  id: string;
  campaignId: string;
  donorMemberId: string | null;
  donorName: string;
  amount: number;
  anonymous: boolean;
  method: PaymentMethod;
  /** 80G receipts need a PAN once the donation crosses the reporting limit. */
  pan?: string;
  receiptNo: string;
  txnRef: string;
  message?: string;
  createdAt: string;
}

export type AuditAction =
  | "member.applied"
  | "member.verified"
  | "member.rejected"
  | "member.vouched"
  | "campaign.created"
  | "campaign.approved"
  | "campaign.rejected"
  | "campaign.live"
  | "campaign.closed"
  | "donation.received"
  | "milestone.requested"
  | "milestone.released"
  | "milestone.settled";

export interface AuditEntry {
  id: string;
  at: string;
  action: AuditAction;
  actor: string;
  detail: string;
  /** Campaign or member the entry belongs to. */
  subjectId?: string;
}
