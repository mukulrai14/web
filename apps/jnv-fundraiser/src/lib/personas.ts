/**
 * Demo identities offered by the header switcher. Kept apart from
 * `session.ts` because that module reaches for `next/headers`, which a client
 * component cannot import.
 */
export const PERSONAS = [
  { id: "m-anjali", label: "Anjali — verified alumni" },
  { id: "m-sunita", label: "Dr. Sunita — review committee" },
  { id: "m-ramesh", label: "Ramesh — verification pending" },
  { id: "guest", label: "Guest — not a member yet" },
] as const;

export const SESSION_COOKIE = "jnv_demo_member";
