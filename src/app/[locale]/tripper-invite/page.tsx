import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { peekTripperInvite } from "@/lib/auth/tripperInviteTokens";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import TripperInviteClient, {
  type TripperInviteResolution,
} from "@/components/auth/TripperInviteClient";

type Props = {
  params: Promise<{ locale?: string | string[] }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function TripperInvitePage({
  params,
  searchParams,
}: Props) {
  const resolvedParams = await params;
  const raw = resolvedParams?.locale;
  const localeStr = typeof raw === "string" ? raw : raw?.[0];
  const locale = hasLocale(localeStr) ? localeStr : "es";
  const { token } = await searchParams;
  const dict = await getDictionary(locale);

  let resolution: TripperInviteResolution;

  if (!token) {
    resolution = { ok: false, reason: "missing" };
  } else {
    const peek = await peekTripperInvite(token);
    if (!peek.ok) {
      resolution = { ok: false, reason: peek.reason };
    } else {
      const existing = await prisma.user.findUnique({
        where: { email: peek.email },
        select: { id: true },
      });
      resolution = {
        ok: true,
        email: peek.email,
        hasAccount: !!existing,
      };
    }
  }

  return (
    <>
      <Navbar backgroundPrimary dict={dict} locale={locale} />
      <TripperInviteClient
        authCopy={dict.auth}
        copy={dict.tripperInviteAccept}
        locale={locale}
        resolution={resolution}
        token={token ?? null}
      />
    </>
  );
}
