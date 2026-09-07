import type React from "react";
import type { XsedDropDraft } from "@/types/xsed";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import { XsedIdentityStep } from "./steps/XsedIdentityStep";
import { XsedAccommodationStep } from "./steps/XsedAccommodationStep";
import { XsedDinnerStep } from "./steps/XsedDinnerStep";
import { XsedActivityStep } from "./steps/XsedActivityStep";
import { XsedItineraryStep } from "./steps/XsedItineraryStep";
import { XsedInclusionsStep } from "./steps/XsedInclusionsStep";

export function resolveXsedStepContent(
  activeTab: string,
  substepId: string,
  form: XsedDropDraft,
  onChange: (patch: Partial<XsedDropDraft>) => void,
  dict: AdminXsedDict["form"],
): React.ReactNode {
  if (activeTab === "main" && substepId === "identity") {
    return <XsedIdentityStep copy={dict.fields} form={form} onChange={onChange} />;
  }
  if (activeTab === "logistics") {
    if (substepId === "accommodation") {
      return (
        <XsedAccommodationStep
          contactCopy={dict.fields.contact}
          copy={dict.fields.accommodation}
          form={form}
          imageCopy={dict.fields}
          onChange={onChange}
          sectionsCopy={dict.fields.sections}
        />
      );
    }
    if (substepId === "dinner") {
      return (
        <XsedDinnerStep
          contactCopy={dict.fields.contact}
          copy={dict.fields.activities}
          form={form}
          imageCopy={dict.fields}
          onChange={onChange}
          sectionsCopy={dict.fields.sections}
        />
      );
    }
    if (substepId === "activity") {
      return (
        <XsedActivityStep
          contactCopy={dict.fields.contact}
          copy={dict.fields.activities}
          form={form}
          imageCopy={dict.fields}
          onChange={onChange}
          sectionsCopy={dict.fields.sections}
        />
      );
    }
    if (substepId === "itinerary") {
      return (
        <XsedItineraryStep copy={dict.fields.itinerary} form={form} onChange={onChange} />
      );
    }
    if (substepId === "inclusions") {
      return (
        <XsedInclusionsStep
          copy={{
            addExclusion: dict.fields.addExclusion,
            addInclusion: dict.fields.addInclusion,
            exclusions: dict.fields.exclusions,
            inclusions: dict.fields.inclusions,
          }}
          form={form}
          onChange={onChange}
        />
      );
    }
  }
  return null;
}
