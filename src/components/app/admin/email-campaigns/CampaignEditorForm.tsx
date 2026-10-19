"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormValidationScope } from "@/components/ui/FormValidationScope";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type {
  Campaign,
  CampaignFormIssue,
  CampaignFormIssues,
  CampaignFormValues,
  CampaignLocale,
} from "@/types/emailCampaign";
import { CampaignAudienceFields } from "./CampaignAudienceFields";
import { CampaignContentFields } from "./CampaignContentFields";
import {
  CAMPAIGNS_API,
  campaignFailureMessage,
  fillTemplate,
  readCampaignFailure,
} from "./campaignApi";
import {
  campaignChanges,
  campaignToForm,
  emptyCampaignForm,
  formToCampaignInput,
  validateCampaignForm,
} from "./campaignForm";
import { PendingButtonContent } from "./PendingButtonContent";

const CTA_CLASS =
  "h-11 rounded-sm border-2 border-primary bg-primary px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-primary-800";

type Feedback = { kind: "error" | "success"; message: string } | null;

interface CampaignEditorFormProps {
  /** The saved DRAFT to edit; omit to create a new campaign. */
  campaign?: Campaign;
  copy: EmailCampaignsAdminDict["editor"];
  /** BCP 47 locale for dates and money, e.g. `es-ES`. */
  dateLocale: string;
  defaultLocale: CampaignLocale;
  errorsCopy: EmailCampaignsAdminDict["errors"];
  localeLabels: EmailCampaignsAdminDict["locales"];
  onSaved: (campaign: Campaign) => void;
  sourceLabels: EmailCampaignsAdminDict["contacts"]["source"];
}

const issueCode = (issue: CampaignFormIssue) =>
  issue.kind === "tooLong" ? `tooLong${issue.max}` : issue.kind;

/** Creates a campaign (POST) or edits a DRAFT (PATCH with only changed fields). */
export function CampaignEditorForm({
  campaign,
  copy,
  dateLocale,
  defaultLocale,
  errorsCopy,
  localeLabels,
  onSaved,
  sourceLabels,
}: CampaignEditorFormProps) {
  const [values, setValues] = useState<CampaignFormValues>(() =>
    campaign ? campaignToForm(campaign) : emptyCampaignForm(defaultLocale),
  );
  const [issues, setIssues] = useState<CampaignFormIssues>({});
  const [focusRequest, setFocusRequest] = useState(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const inFlight = useRef(false);

  const validation = useMemo(() => {
    const entries = Object.entries(issues) as [string, CampaignFormIssue][];
    const messages: Record<string, string> & { invalid: string } = {
      ctaPair: copy.validation.ctaPair,
      ctaUrl: copy.validation.ctaUrl,
      invalid: copy.validation.summary,
      required: copy.validation.required,
      segment: copy.validation.segment,
    };
    for (const [, issue] of entries) {
      if (issue.kind === "tooLong") {
        messages[issueCode(issue)] = fillTemplate(copy.validation.tooLong, {
          max: issue.max,
        });
      }
    }
    return {
      errors: entries.map(([path, issue]) => ({ code: issueCode(issue), path })),
      messages,
    };
  }, [copy.validation, issues]);

  function update(patch: Partial<CampaignFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
    setFeedback(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const found = validateCampaignForm(values);
    setIssues(found);
    if (Object.keys(found).length > 0) {
      setFocusRequest((n) => n + 1);
      setFeedback({ kind: "error", message: copy.validation.summary });
      return;
    }

    const input = formToCampaignInput(values);
    const body = campaign ? campaignChanges(campaign, input) : input;
    if (campaign && Object.keys(body).length === 0) {
      setFeedback({ kind: "success", message: copy.saved });
      return;
    }

    inFlight.current = true;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(campaign ? `${CAMPAIGNS_API}/${campaign.id}` : CAMPAIGNS_API, {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: campaign ? "PATCH" : "POST",
      });
      if (!res.ok) {
        const failure = await readCampaignFailure(res);
        setFeedback({ kind: "error", message: campaignFailureMessage(failure, errorsCopy) });
        return;
      }
      const data = (await res.json()) as { campaign: Campaign };
      if (campaign) setFeedback({ kind: "success", message: copy.saved });
      onSaved(data.campaign);
    } catch {
      setFeedback({ kind: "error", message: errorsCopy.generic });
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  const segmentIssue = issues.segmentSources;

  return (
    <form
      className="flex flex-col gap-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-8"
      data-component="CampaignEditorForm"
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
    >
      <FormValidationScope
        errors={validation.errors}
        focusRequest={focusRequest}
        messages={validation.messages}
      >
        <CampaignContentFields
          copy={copy}
          onChange={(field, value) => update({ [field]: value })}
          values={values}
        />
        <CampaignAudienceFields
          copy={copy}
          dateLocale={dateLocale}
          localeLabels={localeLabels}
          onLocaleChange={(locale) => update({ locale })}
          onPromoCodeChange={(promoCode) => update({ promoCode })}
          onToggleSource={(source) =>
            update({
              segmentSources: values.segmentSources.includes(source)
                ? values.segmentSources.filter((s) => s !== source)
                : [...values.segmentSources, source],
            })
          }
          segmentError={segmentIssue ? copy.validation.segment : undefined}
          sourceLabels={sourceLabels}
          values={values}
        />
      </FormValidationScope>
      <div className="flex flex-wrap items-center gap-4">
        <Button aria-busy={saving} className={CTA_CLASS} disabled={saving} type="submit">
          <PendingButtonContent
            icon={campaign ? Save : Plus}
            label={campaign ? copy.save : copy.create}
            pending={saving}
            pendingLabel={campaign ? copy.saving : copy.creating}
          />
        </Button>
        {feedback && (
          <p
            className={feedback.kind === "error" ? "text-sm text-red-700" : "text-sm text-green-700"}
            role={feedback.kind === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </form>
  );
}
