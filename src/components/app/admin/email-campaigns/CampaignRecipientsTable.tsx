import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type { CampaignRecipient } from "@/types/emailCampaign";

const TH =
  "px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap";
const TD = "px-5 py-4 text-sm text-neutral-700 whitespace-nowrap";

interface CampaignRecipientsTableProps {
  copy: EmailCampaignsAdminDict["recipients"];
  recipients: CampaignRecipient[];
}

/** Per-recipient delivery and engagement of one campaign. */
export function CampaignRecipientsTable({ copy, recipients }: CampaignRecipientsTableProps) {
  const cols = copy.columns;
  const flag = (value: boolean) => (value ? copy.yes : copy.no);

  return (
    <section className="space-y-4" data-component="CampaignRecipientsTable">
      <h3 className="text-xl font-semibold text-ink">{copy.heading}</h3>
      {recipients.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-neutral-700 shadow-sm">
          {copy.empty}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className={TH}>{cols.email}</th>
                  <th className={TH}>{cols.name}</th>
                  <th className={TH}>{cols.status}</th>
                  <th className={TH}>{cols.opened}</th>
                  <th className={TH}>{cols.clicked}</th>
                  <th className={TH}>{cols.purchased}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recipients.map((recipient) => (
                  <tr className="transition-colors hover:bg-gray-50" key={recipient.sendId}>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-ink">
                      {recipient.email}
                    </td>
                    <td className={TD}>{recipient.name ?? "—"}</td>
                    <td className="px-5 py-4">
                      <StatusIndicatorBadge
                        family="email-send"
                        label={copy.status[recipient.status] ?? recipient.status}
                        status={recipient.status}
                      />
                    </td>
                    <td className={TD}>{flag(recipient.opened)}</td>
                    <td className={TD}>{flag(recipient.clicked)}</td>
                    <td className={TD}>{flag(recipient.purchased)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
