import type { CampaignCategory, MemberRelation, VerificationStatus } from "@/lib/types";

/**
 * A representative slice of the ~660 Jawahar Navodaya Vidyalayas. A real
 * deployment would sync this from the NVS school directory; the demo keeps a
 * fixed list so the verification rules have something concrete to check
 * membership claims against.
 */
export interface School {
  code: string;
  district: string;
  state: string;
  /** Year the vidyalaya started — used to sanity-check batch years. */
  establishedIn: number;
}

export const SCHOOLS: School[] = [
  { code: "JNV-UP-SIT", district: "Sitapur", state: "Uttar Pradesh", establishedIn: 1986 },
  { code: "JNV-UP-VAR", district: "Varanasi", state: "Uttar Pradesh", establishedIn: 1987 },
  { code: "JNV-UP-JHA", district: "Jhansi", state: "Uttar Pradesh", establishedIn: 1989 },
  { code: "JNV-BR-PAT", district: "Patna", state: "Bihar", establishedIn: 1987 },
  { code: "JNV-BR-GAY", district: "Gaya", state: "Bihar", establishedIn: 1988 },
  { code: "JNV-RJ-JAI", district: "Jaipur", state: "Rajasthan", establishedIn: 1986 },
  { code: "JNV-RJ-ALW", district: "Alwar", state: "Rajasthan", establishedIn: 1990 },
  { code: "JNV-MP-BHO", district: "Bhopal", state: "Madhya Pradesh", establishedIn: 1986 },
  { code: "JNV-MP-REW", district: "Rewa", state: "Madhya Pradesh", establishedIn: 1988 },
  { code: "JNV-MH-PUN", district: "Pune", state: "Maharashtra", establishedIn: 1987 },
  { code: "JNV-MH-NAG", district: "Nagpur", state: "Maharashtra", establishedIn: 1986 },
  { code: "JNV-KA-MYS", district: "Mysuru", state: "Karnataka", establishedIn: 1987 },
  { code: "JNV-KA-BEL", district: "Belagavi", state: "Karnataka", establishedIn: 1989 },
  { code: "JNV-TN-COI", district: "Coimbatore", state: "Tamil Nadu", establishedIn: 1987 },
  { code: "JNV-KL-ERN", district: "Ernakulam", state: "Kerala", establishedIn: 1987 },
  { code: "JNV-TG-HYD", district: "Ranga Reddy", state: "Telangana", establishedIn: 1987 },
  { code: "JNV-AP-GUN", district: "Guntur", state: "Andhra Pradesh", establishedIn: 1987 },
  { code: "JNV-OD-KOR", district: "Koraput", state: "Odisha", establishedIn: 1988 },
  { code: "JNV-WB-NAD", district: "Nadia", state: "West Bengal", establishedIn: 1988 },
  { code: "JNV-JH-RAN", district: "Ranchi", state: "Jharkhand", establishedIn: 1990 },
  { code: "JNV-CG-RAI", district: "Raipur", state: "Chhattisgarh", establishedIn: 1987 },
  { code: "JNV-PB-LUD", district: "Ludhiana", state: "Punjab", establishedIn: 1988 },
  { code: "JNV-HR-ROH", district: "Rohtak", state: "Haryana", establishedIn: 1986 },
  { code: "JNV-HP-SOL", district: "Solan", state: "Himachal Pradesh", establishedIn: 1988 },
  { code: "JNV-UK-NAI", district: "Nainital", state: "Uttarakhand", establishedIn: 1987 },
  { code: "JNV-GJ-KUT", district: "Kutch", state: "Gujarat", establishedIn: 1988 },
  { code: "JNV-AS-KAM", district: "Kamrup", state: "Assam", establishedIn: 1987 },
  { code: "JNV-ML-SHI", district: "East Khasi Hills", state: "Meghalaya", establishedIn: 1990 },
  { code: "JNV-MN-IMP", district: "Imphal West", state: "Manipur", establishedIn: 1989 },
  { code: "JNV-JK-JAM", district: "Jammu", state: "Jammu & Kashmir", establishedIn: 1993 },
];

const SCHOOL_BY_CODE = new Map(SCHOOLS.map((school) => [school.code, school]));

export function getSchool(code: string): School | undefined {
  return SCHOOL_BY_CODE.get(code);
}

export function schoolName(code: string): string {
  const school = getSchool(code);
  return school ? `JNV ${school.district}, ${school.state}` : code;
}

export const RELATION_LABELS: Record<MemberRelation, string> = {
  student: "Current student / वर्तमान छात्र",
  alumni: "Alumni / पूर्व छात्र",
  staff: "Teacher or staff / शिक्षक या स्टाफ",
  parent: "Parent or guardian / अभिभावक",
};

export const CATEGORY_LABELS: Record<CampaignCategory, string> = {
  medical: "Medical / चिकित्सा",
  education: "Education / शिक्षा",
  emergency: "Emergency / आपदा",
  livelihood: "Livelihood / आजीविका",
  community: "School & community / विद्यालय",
};

export const STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: "Verification pending",
  verified: "Verified Navodayan",
  rejected: "Not verified",
};

/** Documents we accept as proof of the JNV connection, per relation. */
export const ACCEPTED_PROOFS: Record<MemberRelation, string[]> = {
  student: ["School ID card", "Fee/hostel receipt", "Class teacher attestation"],
  alumni: ["Transfer certificate (TC)", "Class 10 or 12 marksheet", "Old ID card"],
  staff: ["NVS appointment letter", "Service ID card"],
  parent: ["Ward's TC or ID card", "Parent ID issued by the vidyalaya"],
};

export interface MembershipClaim {
  schoolCode: string;
  relation: MemberRelation;
  admissionYear: number;
  batchYear: number;
  rollNumber: string;
}

export interface ClaimCheck {
  ok: boolean;
  /** Blocking problems — the application cannot be filed. */
  errors: string[];
  /** Non-blocking notes shown to the reviewing committee. */
  flags: string[];
}

/**
 * Cheap, deterministic checks that catch obviously-wrong claims before a
 * human ever looks at them. This is deliberately *not* the whole verification
 * — a clean claim still needs documents and two vouches.
 */
export function checkMembershipClaim(claim: MembershipClaim): ClaimCheck {
  const errors: string[] = [];
  const flags: string[] = [];
  const currentYear = new Date().getFullYear();
  const school = getSchool(claim.schoolCode);

  if (!school) {
    errors.push("Chosen vidyalaya is not in the NVS directory.");
    return { ok: false, errors, flags };
  }

  if (claim.admissionYear < school.establishedIn) {
    errors.push(
      `JNV ${school.district} opened in ${school.establishedIn}; admission in ${claim.admissionYear} is not possible.`,
    );
  }

  if (claim.batchYear < claim.admissionYear) {
    errors.push("Batch (class 12) year cannot be before the admission year.");
  }

  if (claim.batchYear > currentYear + 7) {
    errors.push("Batch year is too far in the future.");
  }

  // Class 6 to class 12 is a seven-year run. Repeats and mid-way entry happen,
  // so a mismatch is a flag for the committee rather than a hard failure.
  const span = claim.batchYear - claim.admissionYear;
  if (span !== 6 && span !== 7 && claim.relation !== "staff" && claim.relation !== "parent") {
    flags.push(
      `Admission-to-batch gap is ${span} years — the usual class 6→12 run is 6 to 7 years.`,
    );
  }

  if (claim.relation === "student" && claim.batchYear < currentYear) {
    flags.push("Marked as a current student but the batch year has already passed.");
  }

  if (claim.relation === "alumni" && claim.batchYear > currentYear) {
    flags.push("Marked as alumni but the batch has not passed out yet.");
  }

  if (!/^[A-Za-z0-9/-]{4,20}$/.test(claim.rollNumber)) {
    errors.push("Roll number format looks invalid.");
  }

  return { ok: errors.length === 0, errors, flags };
}

/** Minimum vouches from already-verified members of the same vidyalaya. */
export const REQUIRED_VOUCHES = 2;

/** Committee sign-offs a fund request needs before it can collect money. */
export const REQUIRED_APPROVALS = 2;

/** Above this, an 80G receipt needs the donor's PAN (Indian IT rules). */
export const PAN_REQUIRED_ABOVE = 2000;

/** Demo guard rail — a single request cannot exceed this without a trust deed. */
export const MAX_GOAL_WITHOUT_TRUST = 500000;
