import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type {
  CampaignApiFailure,
  CampaignErrorCode,
} from "@/types/emailCampaign";

export const CAMPAIGNS_API = "/api/admin/email-campaigns/campaigns";

/** Locale-less admin path of the campaigns section. */
export const CAMPAIGNS_PATH = "/dashboard/admin/email-campaigns";

const DOMAIN_CODES: CampaignErrorCode[] = [
  "admin_email_missing",
  "campaign_empty_audience",
  "campaign_not_editable",
  "campaign_not_sendable",
  "invalid_promo_code",
  "not_found",
];

/** Classifies a failed admin campaign API response from its status and `error` code. */
export async function readCampaignFailure(
  res: Pick<Response, "json" | "status">,
): Promise<CampaignApiFailure> {
  const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
  const code = body?.error;
  if (DOMAIN_CODES.includes(code as CampaignErrorCode)) {
    return code as CampaignErrorCode;
  }
  if (res.status === 404) return "not_found";
  if (res.status === 400) return "validation";
  return "generic";
}

export function campaignFailureMessage(
  failure: CampaignApiFailure,
  copy: EmailCampaignsAdminDict["errors"],
): string {
  const messages: Record<CampaignApiFailure, string> = {
    admin_email_missing: copy.adminEmailMissing,
    campaign_empty_audience: copy.emptyAudience,
    campaign_not_editable: copy.notEditable,
    campaign_not_sendable: copy.notSendable,
    generic: copy.generic,
    invalid_promo_code: copy.invalidPromo,
    not_found: copy.notFound,
    validation: copy.validation,
  };
  return messages[failure];
}

/** Fills `{name}` placeholders of a dictionary template. */
export function fillTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
