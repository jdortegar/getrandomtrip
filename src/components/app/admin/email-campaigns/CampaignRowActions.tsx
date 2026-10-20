"use client";

import { Eye, Loader2, Pencil, Trash2 } from "lucide-react";
import { TableIconButton, TableIconLink } from "@/components/ui/TableIconButton";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type { CampaignStatus } from "@/types/emailCampaign";

interface CampaignRowActionsProps {
  copy: EmailCampaignsAdminDict["campaigns"]["actions"];
  /** Locale-aware detail/editor href of the campaign. */
  href: string;
  /** True while this campaign's delete request is in flight. */
  isDeleting: boolean;
  onDelete: () => void;
  status: CampaignStatus;
}

/** View/edit link per campaign, plus delete for drafts (opens the confirmation). */
export function CampaignRowActions({
  copy,
  href,
  isDeleting,
  onDelete,
  status,
}: CampaignRowActionsProps) {
  const isDraft = status === "DRAFT";

  return (
    <div className="flex items-center gap-2" data-component="CampaignRowActions">
      <TableIconLink href={href} title={isDraft ? copy.edit : copy.view}>
        {isDraft ? (
          <Pencil aria-hidden className="h-4 w-4" />
        ) : (
          <Eye aria-hidden className="h-4 w-4" />
        )}
      </TableIconLink>
      {isDraft && (
        <TableIconButton
          aria-busy={isDeleting}
          danger
          disabled={isDeleting}
          onClick={onDelete}
          title={copy.delete}
        >
          {isDeleting ? (
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 aria-hidden className="h-4 w-4" />
          )}
        </TableIconButton>
      )}
    </div>
  );
}
