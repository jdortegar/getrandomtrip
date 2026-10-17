"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { TableFilterToolbar } from "@/components/ui/TableFilterToolbar";
import { TableQueryBoundary } from "@/components/ui/TableQueryBoundary";
import { useCurrentTableRefresh } from "@/hooks/useCurrentTableRefresh";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";
import { useTableRequestGuard } from "@/hooks/useTableRequestGuard";
import type {
  Contact,
  ContactListResult,
  ContactSource,
  ContactStatus,
} from "@/types/emailCampaign";
import { AddContactForm } from "./AddContactForm";
import { ContactsTable } from "./ContactsTable";
import { EmailCampaignsSectionHeader } from "./EmailCampaignsSectionHeader";
import { EmailCampaignsSubnav } from "./EmailCampaignsSubnav";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const SOURCES: ContactSource[] = ["WAITLIST", "FRIENDS_FAMILY"];
const STATUSES: ContactStatus[] = ["SUBSCRIBED", "UNSUBSCRIBED", "BOUNCED"];

/** Admin contacts: filterable list, friends & family form, resubscribe. */
export function ContactsPageClient() {
  const pageCopy = useDictionary((d) => d.adminPages.emailCampaigns);
  const filterCopy = useDictionary((d) => d.common.tableFilters);
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const locale = useLocale();
  const isEnglish = locale.startsWith("en");
  const dateLocale = isEnglish ? "en-US" : "es-ES";
  const copy = pageCopy.contacts;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [source, setSource] = useState<ContactSource | "">("");
  const [status, setStatus] = useState<ContactStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useHasLoadedOnce(loading);
  const [resubscribingIds, setResubscribingIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const resubscribeInFlight = useRef(new Set<string>());
  const [rowError, setRowError] = useState<string | null>(null);

  const queryKey = JSON.stringify([page, source, status, searchQuery, debouncedSearch]);
  const [previousQuery, setPreviousQuery] = useState(queryKey);
  if (previousQuery !== queryKey) {
    setPreviousQuery(queryKey);
    setLoading(true);
  }
  const queryPending = loading || searchQuery !== debouncedSearch;
  const beginRequest = useTableRequestGuard(queryKey);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchContacts = useCallback(() => {
    if (searchQuery !== debouncedSearch) return;
    const isCurrent = beginRequest();
    if (!isCurrent()) return;
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) });
    if (source) params.set("source", source);
    if (status) params.set("status", status);
    if (debouncedSearch) params.set("q", debouncedSearch);

    return fetch(`/api/admin/email-campaigns/contacts?${params.toString()}`)
      .then(async (res) => ({
        data: (await res.json()) as Partial<ContactListResult>,
        res,
      }))
      .then(({ data, res }) => {
        if (!isCurrent()) return;
        if (res.ok && data.items) {
          setError(null);
          setContacts(data.items);
          setTotal(data.total ?? 0);
        } else {
          setError(copy.errorLoad);
        }
      })
      .catch(() => {
        if (isCurrent()) setError(copy.errorLoad);
      })
      .finally(() => {
        if (isCurrent()) setLoading(false);
      });
  }, [beginRequest, searchQuery, debouncedSearch, page, source, status, copy.errorLoad]);
  const refreshCurrentQuery = useCurrentTableRefresh(async () => {
    if (searchQuery !== debouncedSearch) return;
    setLoading(true);
    await fetchContacts();
  });

  useEffect(() => {
    void fetchContacts();
  }, [fetchContacts]);

  async function resubscribe(id: string) {
    if (resubscribeInFlight.current.has(id)) return;
    resubscribeInFlight.current.add(id);
    setResubscribingIds(new Set(resubscribeInFlight.current));
    setRowError(null);
    try {
      const res = await fetch(`/api/admin/email-campaigns/contacts/${id}`, {
        body: JSON.stringify({ status: "SUBSCRIBED" }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const data = (await res.json().catch(() => ({}))) as { contact?: Contact };
      if (!res.ok || !data.contact) {
        setRowError(copy.actions.resubscribeError);
        return;
      }
      const updated = data.contact;
      setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {
      setRowError(copy.actions.resubscribeError);
    } finally {
      resubscribeInFlight.current.delete(id);
      setResubscribingIds(new Set(resubscribeInFlight.current));
    }
  }

  function changeFilter(apply: () => void) {
    apply();
    setPage(1);
    setRowError(null);
  }

  const hasActiveFilters = source !== "" || status !== "" || searchQuery !== "";
  function clearFilters() {
    setSource("");
    setStatus("");
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-10">
      <EmailCampaignsSubnav active="contacts" copy={pageCopy.tabs} locale={locale} />
      <EmailCampaignsSectionHeader eyebrow={copy.eyebrow} heading={copy.heading} />

      <AddContactForm
        copy={copy.form}
        defaultLocale={isEnglish ? "en" : "es"}
        localeLabels={pageCopy.locales}
        onCreated={() => void refreshCurrentQuery()}
      />

      {loading && !hasLoadedOnce ? (
        <LoadingSpinner />
      ) : (
        <>
          <TableFilterToolbar
            copy={filterCopy}
            filters={[
              {
                id: "email-contacts-source",
                label: copy.filters.source,
                onChange: (value) => changeFilter(() => setSource(value as ContactSource | "")),
                options: [
                  { label: copy.filters.allSources, value: "" },
                  ...SOURCES.map((value) => ({ label: copy.source[value], value })),
                ],
                value: source,
              },
              {
                id: "email-contacts-status",
                label: copy.filters.status,
                onChange: (value) => changeFilter(() => setStatus(value as ContactStatus | "")),
                options: [
                  { label: copy.filters.allStatuses, value: "" },
                  ...STATUSES.map((value) => ({ label: copy.status[value], value })),
                ],
                value: status,
              },
            ]}
            hasActiveFilters={hasActiveFilters}
            hasError={!!error}
            isLoading={queryPending}
            onClear={clearFilters}
            search={{
              id: "email-contacts-search",
              label: filterCopy.searchLabel,
              onChange: (value) => changeFilter(() => setSearchQuery(value)),
              placeholder: copy.searchPlaceholder,
              value: searchQuery,
            }}
            shown={contacts.length}
            total={total}
          />

          {rowError && (
            <p className="text-sm text-red-600" role="alert">
              {rowError}
            </p>
          )}

          <TableQueryBoundary
            copy={filterCopy}
            error={error}
            isLoading={queryPending}
            onRetry={() => {
              if (!queryPending) void refreshCurrentQuery();
            }}
          >
            <ContactsTable
              contacts={contacts}
              copy={copy}
              dateLocale={dateLocale}
              localeLabels={pageCopy.locales}
              onResubscribe={(id) => void resubscribe(id)}
              resubscribingIds={resubscribingIds}
            />
          </TableQueryBoundary>

          <div inert={queryPending || !!error || undefined}>
            <Pagination
              nextLabel={paginationCopy.next}
              onPageChange={(next) => {
                if (!queryPending && !error) setPage(next);
              }}
              page={page}
              pageOfLabel={paginationCopy.pageOf}
              previousLabel={paginationCopy.previous}
              totalPages={totalPages}
            />
          </div>
        </>
      )}
    </div>
  );
}
