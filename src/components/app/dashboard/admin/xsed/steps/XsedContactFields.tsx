"use client";

import { FormField } from "@/components/ui/FormField";
import type { XsedContact } from "@/types/xsed";
import type { AdminXsedDict } from "@/lib/types/dictionary";

interface Props {
  idPrefix: string;
  contact: XsedContact;
  onChange: (patch: Partial<XsedContact>) => void;
  copy: AdminXsedDict["form"]["fields"]["contact"];
}

// On-the-ground contact info (hotel front desk, restaurant, activity
// operator) for a single accommodation/dinner/activity item — shared by
// XsedSectionFields, which owns the rest of that item's title/content/photos.
export function XsedContactFields({ idPrefix, contact, onChange, copy }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id={`${idPrefix}-contact-name`}
          label={copy.name}
          placeholder={copy.namePlaceholder}
          value={contact.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <FormField
          id={`${idPrefix}-contact-phone`}
          label={copy.phone}
          placeholder={copy.phonePlaceholder}
          type="tel"
          value={contact.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          id={`${idPrefix}-contact-address`}
          label={copy.address}
          placeholder={copy.addressPlaceholder}
          value={contact.address}
          onChange={(e) => onChange({ address: e.target.value })}
        />
        <FormField
          id={`${idPrefix}-contact-hour`}
          label={copy.hour}
          placeholder={copy.hourPlaceholder}
          value={contact.hour}
          onChange={(e) => onChange({ hour: e.target.value })}
        />
      </div>
    </div>
  );
}
