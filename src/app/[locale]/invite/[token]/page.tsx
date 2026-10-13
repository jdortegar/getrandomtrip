import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  getProfileTravelDocuments,
  peekTravelerInvite,
} from "@/lib/travelers/travelerInviteTokens";
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
 * destination; never serializes the full invited email for a viewer who is
 * not signed in with that address. The same rule applies to travel documents:
 * only the invited viewer gets the row's nationalities and visas, prefilled
 * from their own profile when the row has none yet.
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
    // The page payload is server-rendered, so the full invited address is
    // only ever resolved for a viewer already signed in with that address;
    // everyone else gets the masked form. `submit` enforces the match anyway.
    const session = await getServerSession(authOptions);
    const peek = await peekTravelerInvite(token, session?.user?.email);
    if (peek.ok) {
      let travelDocuments = peek.travelDocuments ?? null;
      const viewerId = session?.user?.id;
      if (
        travelDocuments &&
        viewerId &&
        travelDocuments.nationalities.length === 0 &&
        travelDocuments.visas.length === 0
      ) {
        travelDocuments = {
          ...travelDocuments,
          ...(await getProfileTravelDocuments(viewerId)),
        };
      }
      resolution = {
        ok: true,
        buyerFirstName: peek.buyerFirstName,
        idDocumentRequired: peek.idDocumentRequired,
        invitedEmail: peek.invitedEmail,
        maskedEmail: peek.maskedEmail,
        emailMismatch: peek.viewerEmailMatches === false,
        travelDocuments,
      };
    } else {
      resolution = { ok: false, reason: peek.reason };
    }
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
