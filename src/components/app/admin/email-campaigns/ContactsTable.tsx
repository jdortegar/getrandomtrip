import { Loader2, RotateCcw } from "lucide-react";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import { TableIconButton } from "@/components/ui/TableIconButton";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type { Contact } from "@/types/emailCampaign";

const TH =
  "px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap";
const TD = "px-5 py-4 text-sm text-neutral-700";

interface ContactsTableProps {
  contacts: Contact[];
  copy: EmailCampaignsAdminDict["contacts"];
  /** BCP 47 locale used for dates, e.g. `es-ES`. */
  dateLocale: string;
  localeLabels: EmailCampaignsAdminDict["locales"];
  onResubscribe: (id: string) => void;
  resubscribingIds: ReadonlySet<string>;
}

export function ContactsTable({
  contacts,
  copy,
  dateLocale,
  localeLabels,
  onResubscribe,
  resubscribingIds,
}: ContactsTableProps) {
  const cols = copy.columns;

  if (contacts.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <p className="py-16 text-center text-sm text-ink">{copy.empty}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className={TH}>{cols.email}</th>
              <th className={TH}>{cols.name}</th>
              <th className={TH}>{cols.source}</th>
              <th className={TH}>{cols.status}</th>
              <th className={TH}>{cols.locale}</th>
              <th className={TH}>{cols.createdAt}</th>
              <th className={TH}>{cols.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {contacts.map((contact) => {
              const pending = resubscribingIds.has(contact.id);
              return (
                <tr className="transition-colors hover:bg-gray-50" key={contact.id}>
                  <td className="px-5 py-4 text-sm font-semibold text-ink">
                    {contact.email}
                    {contact.tags.length > 0 && (
                      <p className="mt-0.5 text-xs font-normal text-neutral-500">
                        {contact.tags.join(", ")}
                      </p>
                    )}
                  </td>
                  <td className={TD}>{contact.name || "—"}</td>
                  <td className={`${TD} whitespace-nowrap`}>
                    {copy.source[contact.source] ?? contact.source}
                  </td>
                  <td className="px-5 py-4">
                    <StatusIndicatorBadge
                      family="email-contact"
                      label={copy.status[contact.status] ?? contact.status}
                      status={contact.status}
                    />
                  </td>
                  <td className={TD}>{localeLabels[contact.locale]}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-neutral-500">
                    {new Date(contact.createdAt).toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    {contact.status !== "SUBSCRIBED" && (
                      <TableIconButton
                        aria-busy={pending}
                        disabled={pending}
                        onClick={() => onResubscribe(contact.id)}
                        title={
                          pending
                            ? copy.actions.resubscribing
                            : copy.actions.resubscribe
                        }
                      >
                        {pending ? (
                          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw aria-hidden className="h-4 w-4" />
                        )}
                      </TableIconButton>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
