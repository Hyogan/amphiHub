import type { AppRole } from "@/store/sessionSlice";

/** A user can hold several roles. The highest one wins. Anything unknown counts as student. */
export function highestRole(rows: { role: string }[]): AppRole {
  if (rows.some((r) => r.role === "admin")) return "admin";
  if (rows.some((r) => r.role === "moderator")) return "moderator";
  return "student";
}
