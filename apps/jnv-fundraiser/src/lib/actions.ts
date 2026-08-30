"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, donationsFor, getCampaign, getMember, log, nextId, raisedFor } from "@/lib/db";
import {
  checkMembershipClaim,
  MAX_GOAL_WITHOUT_TRUST,
  PAN_REQUIRED_ABOVE,
  REQUIRED_APPROVALS,
  REQUIRED_VOUCHES,
  getSchool,
  schoolName,
} from "@/lib/jnv";
import { canDonate, canRaise, canReview, currentMember, SESSION_COOKIE } from "@/lib/session";
import type { ActionState } from "@/lib/action-state";
import type { Campaign, Member, Milestone } from "@/lib/types";

function fail(message: string, errors: string[] = []): ActionState {
  return { status: "error", message, errors };
}

function issues(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}

/* ------------------------------- demo session ------------------------------ */

export async function switchPersona(formData: FormData): Promise<void> {
  const id = String(formData.get("memberId") ?? "guest");
  const store = await cookies();
  store.set(SESSION_COOKIE, id, { path: "/", httpOnly: true, sameSite: "lax" });
  revalidatePath("/", "layout");
}

/* --------------------------- membership verification ---------------------- */

const membershipSchema = z.object({
  fullName: z.string().trim().min(3, "Full name is required."),
  relation: z.enum(["student", "alumni", "staff", "parent"]),
  schoolCode: z.string().trim().min(1, "Choose your vidyalaya."),
  admissionYear: z.coerce.number().int().min(1985, "Admission year looks wrong."),
  batchYear: z.coerce.number().int().min(1985, "Batch year looks wrong."),
  rollNumber: z.string().trim().min(1, "Roll or employee number is required."),
  email: z.email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  city: z.string().trim().min(2, "City is required."),
  proofLabel: z.string().trim().min(4, "Describe the proof document you are attaching."),
  proofKind: z.enum(["transfer-certificate", "marksheet", "id-card", "appointment-letter"]),
  consent: z.literal("on", { message: "You must accept the declaration to apply." }),
});

/**
 * Files a membership application. Nothing is approved here — a clean claim
 * still needs {@link REQUIRED_VOUCHES} vouches from verified members of the
 * same vidyalaya and a committee decision.
 */
export async function applyMembership(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = membershipSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail("Application could not be filed.", issues(parsed.error));
  }
  const input = parsed.data;

  const check = checkMembershipClaim({
    schoolCode: input.schoolCode,
    relation: input.relation,
    admissionYear: input.admissionYear,
    batchYear: input.batchYear,
    rollNumber: input.rollNumber,
  });
  if (!check.ok) {
    return fail("The details do not add up.", check.errors);
  }

  const store = db();
  const duplicate = store.members.find(
    (member) =>
      member.schoolCode === input.schoolCode &&
      member.rollNumber.toLowerCase() === input.rollNumber.toLowerCase(),
  );
  if (duplicate) {
    return fail("This roll number is already registered.", [
      `${schoolName(input.schoolCode)} roll ${input.rollNumber} belongs to an existing application. If that is you, recover the account instead of filing again.`,
    ]);
  }

  const member: Member = {
    id: nextId("m"),
    fullName: input.fullName,
    relation: input.relation,
    schoolCode: input.schoolCode,
    admissionYear: input.admissionYear,
    batchYear: input.batchYear,
    rollNumber: input.rollNumber,
    email: input.email,
    phone: input.phone,
    city: input.city,
    status: "pending",
    isCommittee: false,
    kycVerified: false,
    documents: [
      {
        id: nextId("d"),
        kind: input.proofKind,
        label: input.proofLabel,
        uploadedAt: new Date().toISOString(),
      },
    ],
    vouches: [],
    appliedAt: new Date().toISOString(),
  };

  store.members.push(member);
  log(
    "member.applied",
    member.fullName,
    `Applied as ${member.relation} of ${schoolName(member.schoolCode)}, batch ${member.batchYear}.`,
    member.id,
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, member.id, { path: "/", httpOnly: true, sameSite: "lax" });
  revalidatePath("/", "layout");

  return {
    status: "ok",
    message: `Application filed. You now need ${REQUIRED_VOUCHES} vouches from verified members of ${schoolName(member.schoolCode)} and one committee decision.`,
    flags: check.flags,
  };
}

/** A verified member attests that a pending applicant is genuine. */
export async function vouchForMember(formData: FormData): Promise<void> {
  const me = await currentMember();
  const memberId = String(formData.get("memberId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const applicant = getMember(memberId);

  if (!me || me.status !== "verified" || !applicant) return;
  if (applicant.id === me.id) return;
  if (applicant.vouches.some((vouch) => vouch.byMemberId === me.id)) return;

  applicant.vouches.push({
    byMemberId: me.id,
    byName: me.fullName,
    byBatch: me.batchYear,
    note: note || "Known personally from the vidyalaya.",
    at: new Date().toISOString(),
  });
  log("member.vouched", me.fullName, `Vouched for ${applicant.fullName}.`, applicant.id);
  revalidatePath("/admin");
  revalidatePath("/verify");
}

/** Committee decision on a membership application. */
export async function decideMembership(formData: FormData): Promise<void> {
  const me = await currentMember();
  if (!canReview(me) || !me) return;

  const memberId = String(formData.get("memberId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const applicant = getMember(memberId);
  if (!applicant || applicant.status !== "pending") return;

  if (decision === "approve") {
    // The committee cannot wave someone through on its own — the community
    // vouches are a hard precondition.
    if (applicant.vouches.length < REQUIRED_VOUCHES) return;
    applicant.status = "verified";
    applicant.kycVerified = true;
    log(
      "member.verified",
      me.fullName,
      `${applicant.fullName} verified as ${applicant.relation} of ${schoolName(applicant.schoolCode)}.`,
      applicant.id,
    );
  } else {
    applicant.status = "rejected";
    log(
      "member.rejected",
      me.fullName,
      `${applicant.fullName}'s application rejected. ${note}`.trim(),
      applicant.id,
    );
  }

  applicant.reviewedAt = new Date().toISOString();
  applicant.reviewedBy = me.fullName;
  applicant.reviewNote = note;
  revalidatePath("/admin");
  revalidatePath("/verify");
}

/* ------------------------------ fund requests ----------------------------- */

const campaignSchema = z
  .object({
    title: z.string().trim().min(12, "Give the request a clear title (12+ characters)."),
    category: z.enum(["medical", "education", "emergency", "livelihood", "community"]),
    beneficiaryKind: z.enum(["self", "member", "family", "school"]),
    beneficiaryName: z.string().trim().min(3, "Who is the money for?"),
    schoolCode: z.string().trim().min(1, "Choose the vidyalaya this case belongs to."),
    goalAmount: z.coerce.number().int().min(5000, "Minimum goal is ₹5,000."),
    deadlineDays: z.coerce
      .number()
      .int()
      .min(7, "Give donors at least 7 days.")
      .max(120, "A single request can run for at most 120 days."),
    summary: z.string().trim().min(40, "Summary should be at least 40 characters."),
    story: z.string().trim().min(120, "Explain the situation in at least 120 characters."),
    proofKind: z.enum(["hospital-estimate", "fee-receipt", "fir-copy", "bank-passbook"]),
    proofLabel: z.string().trim().min(6, "Name the supporting document."),
    m1Title: z.string().trim().min(4, "First tranche needs a title."),
    m1Amount: z.coerce.number().int().min(1000, "First tranche must be at least ₹1,000."),
    m2Title: z.string().trim().optional(),
    m2Amount: z.coerce.number().int().optional(),
    m3Title: z.string().trim().optional(),
    m3Amount: z.coerce.number().int().optional(),
    declaration: z.literal("on", { message: "You must sign the declaration." }),
  })
  .refine((data) => data.goalAmount <= MAX_GOAL_WITHOUT_TRUST, {
    message: `Requests above ₹${MAX_GOAL_WITHOUT_TRUST.toLocaleString("en-IN")} must be routed through the registered trust with a board resolution.`,
  });

function buildMilestones(input: {
  m1Title: string;
  m1Amount: number;
  m2Title?: string;
  m2Amount?: number;
  m3Title?: string;
  m3Amount?: number;
}): Milestone[] {
  const rows: Array<{ title?: string; amount?: number }> = [
    { title: input.m1Title, amount: input.m1Amount },
    { title: input.m2Title, amount: input.m2Amount },
    { title: input.m3Title, amount: input.m3Amount },
  ];

  return rows
    .filter((row) => row.title && row.title.trim().length > 0 && (row.amount ?? 0) > 0)
    .map((row, index) => ({
      id: nextId(`ms${index + 1}`),
      title: row.title as string,
      amount: row.amount as number,
      status: "locked" as const,
    }));
}

/**
 * Creates a fund request. It goes straight to `under_review`: no request can
 * collect a rupee before {@link REQUIRED_APPROVALS} committee members have
 * signed off on it.
 */
export async function createCampaign(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await currentMember();
  if (!canRaise(me) || !me) {
    return fail("Only verified members can raise funds.", [
      "Complete membership verification first — the request form stays locked until then.",
    ]);
  }

  const parsed = campaignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail("Fund request could not be filed.", issues(parsed.error));
  }
  const input = parsed.data;

  if (!getSchool(input.schoolCode)) {
    return fail("Fund request could not be filed.", ["Unknown vidyalaya code."]);
  }

  const milestones = buildMilestones(input);
  const tranchesTotal = milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
  if (tranchesTotal !== input.goalAmount) {
    return fail("Tranches must add up to the goal.", [
      `Tranches total ₹${tranchesTotal.toLocaleString("en-IN")} but the goal is ₹${input.goalAmount.toLocaleString("en-IN")}.`,
    ]);
  }

  const flags: string[] = [];
  if (input.beneficiaryKind !== "self") {
    flags.push(
      "Money is not for the organiser — the committee will ask for the beneficiary's consent letter and ID.",
    );
  }
  if (!me.kycVerified) {
    flags.push("Organiser KYC is incomplete; payouts stay blocked until it clears.");
  }

  const campaign: Campaign = {
    id: nextId("c"),
    title: input.title,
    organiserId: me.id,
    beneficiaryKind: input.beneficiaryKind,
    beneficiaryName: input.beneficiaryName,
    schoolCode: input.schoolCode,
    category: input.category,
    goalAmount: input.goalAmount,
    deadline: new Date(Date.now() + input.deadlineDays * 86400000).toISOString(),
    summary: input.summary,
    story: input.story,
    documents: [
      {
        id: nextId("d"),
        kind: input.proofKind,
        label: input.proofLabel,
        uploadedAt: new Date().toISOString(),
      },
    ],
    status: "under_review",
    approvals: [],
    milestones,
    escrowAccount: "JNV Alumni Welfare Trust · A/c ••••4417 (nodal)",
    createdAt: new Date().toISOString(),
  };

  db().campaigns.push(campaign);
  log(
    "campaign.created",
    me.fullName,
    `Filed a ${campaign.category} request for ₹${campaign.goalAmount.toLocaleString("en-IN")}.`,
    campaign.id,
  );
  revalidatePath("/campaigns");
  revalidatePath("/admin");
  redirect(`/campaigns/${campaign.id}?filed=1`);
}

/** Committee sign-off. The second approval flips the request live. */
export async function reviewCampaign(formData: FormData): Promise<void> {
  const me = await currentMember();
  if (!canReview(me) || !me) return;

  const campaignId = String(formData.get("campaignId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const campaign = getCampaign(campaignId);
  if (!campaign || campaign.status !== "under_review") return;
  if (campaign.organiserId === me.id) return; // no self-approval
  if (campaign.approvals.some((approval) => approval.byMemberId === me.id)) return;

  campaign.approvals.push({
    byMemberId: me.id,
    byName: me.fullName,
    decision: decision === "approve" ? "approve" : "reject",
    note: note || (decision === "approve" ? "Documents verified." : "Insufficient proof."),
    at: new Date().toISOString(),
  });

  if (decision === "reject") {
    campaign.status = "rejected";
    campaign.reviewNote = note;
    log("campaign.rejected", me.fullName, note || "Request rejected.", campaign.id);
  } else {
    log("campaign.approved", me.fullName, note || "Approved after document check.", campaign.id);
    const approvals = campaign.approvals.filter((a) => a.decision === "approve").length;
    if (approvals >= REQUIRED_APPROVALS) {
      campaign.status = "live";
      log(
        "campaign.live",
        "Review committee",
        `${approvals} approvals recorded; collections opened.`,
        campaign.id,
      );
    }
  }

  revalidatePath("/admin");
  revalidatePath(`/campaigns/${campaign.id}`);
  revalidatePath("/campaigns");
}

/* --------------------------------- giving --------------------------------- */

const donationSchema = z.object({
  campaignId: z.string().trim().min(1),
  amount: z.coerce.number().int().min(100, "Minimum contribution is ₹100."),
  method: z.enum(["upi", "netbanking", "card", "cheque"]),
  pan: z.string().trim().optional(),
  message: z.string().trim().max(200, "Keep the note under 200 characters.").optional(),
  anonymous: z.string().optional(),
});

export async function donate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await currentMember();
  if (!canDonate(me) || !me) {
    return fail("Only verified members can contribute.", [
      "This is a closed circle — giving is open to verified Navodayans and their families.",
    ]);
  }

  const parsed = donationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail("Contribution not recorded.", issues(parsed.error));
  }
  const input = parsed.data;

  const campaign = getCampaign(input.campaignId);
  if (!campaign || campaign.status !== "live") {
    return fail("This request is not collecting right now.");
  }

  // Cash is not accepted at all, and PAN is mandatory past the reporting limit
  // so 80G receipts stay valid.
  if (input.amount > PAN_REQUIRED_ABOVE && !input.pan) {
    return fail("PAN is required.", [
      `Contributions above ₹${PAN_REQUIRED_ABOVE.toLocaleString("en-IN")} need a PAN for the 80G receipt.`,
    ]);
  }
  if (input.pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(input.pan.toUpperCase())) {
    return fail("PAN format is invalid.", ["A PAN looks like ABCDE1234F."]);
  }

  const alreadyRaised = raisedFor(campaign.id);
  const remaining = campaign.goalAmount - alreadyRaised;
  if (remaining <= 0) {
    return fail("This request is already fully funded.");
  }
  // Never over-collect: a request stops at its approved goal.
  const amount = Math.min(input.amount, remaining);

  const sequence = 1000 + db().donations.length;
  db().donations.push({
    id: nextId("dn"),
    campaignId: campaign.id,
    donorMemberId: me.id,
    donorName: me.fullName,
    amount,
    anonymous: input.anonymous === "on",
    method: input.method,
    pan: input.pan
      ? `${input.pan.slice(0, 5).toUpperCase()}••••${input.pan.slice(-1).toUpperCase()}`
      : undefined,
    receiptNo: `JNV/25-26/00${sequence}`,
    txnRef: `${input.method.toUpperCase()}-${Date.now().toString().slice(-10)}`,
    message: input.message || undefined,
    createdAt: new Date().toISOString(),
  });

  log(
    "donation.received",
    input.anonymous === "on" ? "Anonymous member" : me.fullName,
    `Contributed ₹${amount.toLocaleString("en-IN")} to "${campaign.title}".`,
    campaign.id,
  );

  if (raisedFor(campaign.id) >= campaign.goalAmount) {
    campaign.status = "funded";
    log("campaign.closed", "System", "Goal reached; collections closed.", campaign.id);
  }

  revalidatePath(`/campaigns/${campaign.id}`);
  revalidatePath("/campaigns");
  revalidatePath("/ledger");

  const short = amount !== input.amount ? " (trimmed to the remaining goal)" : "";
  return {
    status: "ok",
    message: `₹${amount.toLocaleString("en-IN")} recorded${short}. Receipt and 80G certificate go to ${me.email}.`,
  };
}

/* ---------------------------- staged fund release -------------------------- */

/** Organiser asks the treasurer to release the next tranche. */
export async function requestMilestone(formData: FormData): Promise<void> {
  const me = await currentMember();
  if (!me || me.status !== "verified") return;

  const campaign = getCampaign(String(formData.get("campaignId") ?? ""));
  const milestoneId = String(formData.get("milestoneId") ?? "");
  if (!campaign || campaign.organiserId !== me.id) return;

  const index = campaign.milestones.findIndex((milestone) => milestone.id === milestoneId);
  if (index < 0) return;
  const milestone = campaign.milestones[index];
  if (milestone.status !== "locked") return;

  // A tranche only opens once every earlier one has been settled with bills.
  const previousUnsettled = campaign.milestones
    .slice(0, index)
    .some((earlier) => earlier.status !== "settled");
  if (previousUnsettled) return;

  const collected = raisedFor(campaign.id);
  const alreadyOut = campaign.milestones
    .filter((row) => row.status === "released" || row.status === "settled")
    .reduce((sum, row) => sum + row.amount, 0);
  if (collected - alreadyOut < milestone.amount) return;

  milestone.status = "requested";
  log(
    "milestone.requested",
    me.fullName,
    `Requested release of ₹${milestone.amount.toLocaleString("en-IN")} for "${milestone.title}".`,
    campaign.id,
  );
  revalidatePath(`/campaigns/${campaign.id}`);
  revalidatePath("/admin");
}

/** Committee releases the money from escrow to the vendor or hospital. */
export async function releaseMilestone(formData: FormData): Promise<void> {
  const me = await currentMember();
  if (!canReview(me) || !me) return;

  const campaign = getCampaign(String(formData.get("campaignId") ?? ""));
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const milestone = campaign?.milestones.find((row) => row.id === milestoneId);
  if (!campaign || !milestone || milestone.status !== "requested") return;

  milestone.status = "released";
  milestone.releasedAt = new Date().toISOString();
  log(
    "milestone.released",
    me.fullName,
    `Released ₹${milestone.amount.toLocaleString("en-IN")} from escrow for "${milestone.title}".`,
    campaign.id,
  );
  revalidatePath(`/campaigns/${campaign.id}`);
  revalidatePath("/admin");
  revalidatePath("/ledger");
}

/** Organiser closes the loop by filing the bill for a released tranche. */
export async function settleMilestone(formData: FormData): Promise<void> {
  const me = await currentMember();
  if (!me || me.status !== "verified") return;

  const campaign = getCampaign(String(formData.get("campaignId") ?? ""));
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const label = String(formData.get("proofLabel") ?? "").trim();
  const milestone = campaign?.milestones.find((row) => row.id === milestoneId);
  if (!campaign || !milestone || campaign.organiserId !== me.id) return;
  if (milestone.status !== "released" || label.length < 6) return;

  milestone.status = "settled";
  milestone.utilisationProof = {
    id: nextId("d"),
    kind: "utilisation-bill",
    label,
    uploadedAt: new Date().toISOString(),
  };
  log(
    "milestone.settled",
    me.fullName,
    `Filed utilisation proof for "${milestone.title}": ${label}.`,
    campaign.id,
  );

  const allSettled = campaign.milestones.every((row) => row.status === "settled");
  if (allSettled && donationsFor(campaign.id).length > 0) {
    campaign.status = "closed";
    log("campaign.closed", "System", "All tranches settled; case closed.", campaign.id);
  }

  revalidatePath(`/campaigns/${campaign.id}`);
  revalidatePath("/admin");
  revalidatePath("/ledger");
}
