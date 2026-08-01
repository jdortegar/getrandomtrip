import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { peekTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import Navbar from "@/components/Navbar";
import TravelerInviteClient, {
  type TravelerInviteResolution,
} from "@/components/travelers/TravelerInviteClient";

type Props = {
  params: Promise<{ locale?: string | string[]; token?: string | string[] }>;
};

/**
 * Companion invite landing — server peek → client form. Never consumes the
 * token (only `POST /api/travelers/submit` does that); never renders the
 * destination.
 */
export default async function TravelerInvitePage({ params }: Props) {
  const resolvedParams = await params;

  const rawLocale = resolvedParams?.locale;
  const localeStr = typeof rawLocale === "string" ? rawLocale : rawLocale?.[0];
  const locale = hasLocale(localeStr) ? localeStr : "es";

  const rawToken = resolvedParams?.token;
  const token = typeof rawToken === "string" ? rawToken : rawToken?.[0];

  const dict = await getDictionary(locale);

  let resolution: TravelerInviteResolution;

  if (!token) {
    resolution = { ok: false, reason: "invalid" };
  } else {
    const peek = await peekTravelerInvite(token);
    resolution = peek.ok
      ? { ok: true, buyerFirstName: peek.buyerFirstName }
      : { ok: false, reason: peek.reason };
  }

  return (
    <>
      <Navbar backgroundPrimary dict={dict} locale={locale} />
      <TravelerInviteClient
        authCopy={{ auth: dict.auth }}
        copy={dict.inviteTravelers}
        locale={locale}
        resolution={resolution}
        token={token ?? null}
      />
    </>
  );
}
