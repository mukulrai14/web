/**
 * Shape returned by every form action. Lives outside `actions.ts` because a
 * `"use server"` module may only export async functions.
 */
export interface ActionState {
  status: "idle" | "ok" | "error";
  message: string;
  /** Blocking problems, shown as a list under the form. */
  errors?: string[];
  /** Non-blocking observations passed on to the reviewing committee. */
  flags?: string[];
}

export const IDLE: ActionState = { status: "idle", message: "" };
