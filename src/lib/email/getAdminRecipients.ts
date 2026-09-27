import { prisma } from "@/lib/prisma";

interface AdminRecipient {
  email: string;
  locale: string | null;
  name: string | null;
}

/** Admin-only routing: never use this for customer mail or private links. */
export async function getAdminRecipients(): Promise<AdminRecipient[]> {
  const admins = await prisma.user.findMany({
    where: { roles: { has: "ADMIN" } },
    select: { email: true, name: true, locale: true },
  });
  const recipients = new Map<string, AdminRecipient>();

  for (const address of ["hola@getrandomtrip.com", process.env.ADMIN_EMAIL]) {
    const email = address?.trim().toLowerCase();
    if (email) recipients.set(email, { email, name: null, locale: null });
  }

  for (const admin of admins) {
    const email = admin.email.trim().toLowerCase();
    // Keep the user's name and locale when a configured address is also an admin.
    if (email) recipients.set(email, { ...admin, email });
  }

  return [...recipients.values()];
}

export async function getAdminEmails(): Promise<string[]> {
  return (await getAdminRecipients()).map(({ email }) => email);
}
