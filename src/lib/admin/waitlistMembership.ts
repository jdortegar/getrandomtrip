import { prisma } from "@/lib/prisma";

/**
 * Batched existing-`User` lookup keyed by email, used to flag waitlist
 * entries that already resolve to an account (any role).
 *
 * Exact-match only — `WaitlistEntry.email` is lowercased on insert while
 * `User.email` is stored as typed, so a case-differing match (e.g.
 * `Alice@Example.com`) is not detected here. This is an accepted, documented
 * limitation shared by every other email-matching call site in the app
 * (see design.md "Resolved Decisions #3"); no normalization is added.
 */
export async function findExistingUserEmails(
  emails: string[],
): Promise<Set<string>> {
  if (emails.length === 0) return new Set();

  const rows = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });

  return new Set(rows.map((r) => r.email));
}
