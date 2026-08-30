import { cookies } from "next/headers";
import { getMember } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/personas";
import type { Member } from "@/lib/types";

export { SESSION_COOKIE };

/**
 * The signed-in member, or undefined for a guest. Real auth would be an OTP
 * on the registered phone plus a session token; the demo swaps identities
 * through a cookie so all four states are one click apart.
 */
export async function currentMember(): Promise<Member | undefined> {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value ?? "m-anjali";
  if (id === "guest") return undefined;
  return getMember(id);
}

export function canRaise(member: Member | undefined): boolean {
  return member?.status === "verified";
}

export function canDonate(member: Member | undefined): boolean {
  return member?.status === "verified";
}

export function canReview(member: Member | undefined): boolean {
  return member?.status === "verified" && member.isCommittee;
}
