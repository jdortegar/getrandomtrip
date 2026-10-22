/**
 * Renders a campaign to final email bodies. Used for admin preview, test
 * sends, and (T6) once per recipient with that recipient's signed
 * unsubscribe link.
 */
import { render } from "@react-email/components";
import { createElement } from "react";

import CampaignEmail from "@/emails/CampaignEmail";
import type {
  CampaignEmailContent,
  CampaignEmailPromo,
  RenderedCampaignEmail,
} from "@/types/emailCampaign";

export async function renderCampaignEmail(
  campaign: CampaignEmailContent,
  options: { unsubscribeUrl: string; promo?: CampaignEmailPromo | null },
): Promise<RenderedCampaignEmail> {
  const element = createElement(CampaignEmail, {
    locale: campaign.locale,
    preheader: campaign.preheader,
    title: campaign.title,
    bodyMarkdown: campaign.bodyMarkdown,
    cta:
      campaign.ctaLabel && campaign.ctaUrl
        ? { label: campaign.ctaLabel, url: campaign.ctaUrl }
        : null,
    promo: options.promo ?? null,
    unsubscribeUrl: options.unsubscribeUrl,
  });

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { subject: campaign.subject, html, text };
}
