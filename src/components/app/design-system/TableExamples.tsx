"use client";

import { useState } from "react";
import { ExperienceStatusBadge } from "@/components/common/ExperienceStatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { SortButton, type SortButtonOrder } from "@/components/ui/SortButton";
import { TableFilterToolbar } from "@/components/ui/TableFilterToolbar";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface TableExamplesProps {
  copy: DesignSystemDict;
}

export function TableExamples({ copy }: TableExamplesProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState<SortButtonOrder>("asc");
  const [sort, setSort] = useState<"name" | "nights">("name");
  const labels = copy.tables;
  const rows = labels.rows
    .filter(
      (row) =>
        row.name
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase()) &&
        (status === "all" || row.status === status),
    )
    .sort(
      (a, b) =>
        (sort === "name" ? a.name.localeCompare(b.name) : a.nights - b.nights) *
        (order === "asc" ? 1 : -1),
    );
  const totalPages = Math.max(1, Math.ceil(rows.length / 3));
  const visible = rows.slice((page - 1) * 3, page * 3);
  function handleSort(key: "name" | "nights") {
    setSort(key);
    setOrder(sort === key && order === "asc" ? "desc" : "asc");
    setPage(1);
  }
  return (
    <>
      <div className="bg-white border border-gray-200 overflow-hidden rounded-xl shadow-sm">
        <div className="p-5">
          <TableFilterToolbar
            copy={labels.toolbar}
            filters={[
              {
                id: "gallery-status",
                label: labels.status,
                onChange: (value) => {
                  setStatus(value);
                  setPage(1);
                },
                options: [
                  { label: labels.all, value: "all" },
                  ...Object.entries(copy.badges.statuses).map(
                    ([value, label]) => ({ label, value }),
                  ),
                ],
                value: status,
              },
            ]}
            hasActiveFilters={Boolean(query || status !== "all")}
            onClear={() => {
              setQuery("");
              setStatus("all");
              setPage(1);
            }}
            search={{
              id: "gallery-search",
              label: labels.search,
              onChange: (value) => {
                setQuery(value);
                setPage(1);
              },
              placeholder: labels.searchPlaceholder,
              value: query,
            }}
            shown={rows.length}
            total={labels.rows.length}
          />
        </div>
        <div
          aria-label={labels.caption}
          className="overflow-x-auto"
          role="region"
          tabIndex={0}
        >
          <table className="min-w-[520px] text-left w-full">
            <caption className="px-5 py-3 text-left text-neutral-600 text-sm">
              {labels.caption}
            </caption>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {(["name", "nights"] as const).map((key) => (
                  <th
                    aria-sort={
                      sort === key
                        ? order === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className="px-5 py-3 text-left"
                    key={key}
                    scope="col"
                  >
                    <SortButton
                      active={sort === key}
                      ariaLabel={labels.sort.replace("{column}", labels[key])}
                      label={labels[key]}
                      onSort={() => handleSort(key)}
                      order={order}
                    />
                  </th>
                ))}
                <th
                  className="font-semibold px-5 py-3 text-[11px] text-left text-neutral-600 tracking-wider uppercase"
                  scope="col"
                >
                  {labels.status}
                </th>
              </tr>
            </thead>
            <tbody className="divide-gray-100 divide-y">
              {visible.length ? (
                visible.map((row) => (
                  <tr
                    className={cn("transition-colors", "hover:bg-gray-50")}
                    key={row.name}
                  >
                    <th
                      className="font-semibold px-5 py-4 text-left text-sm"
                      scope="row"
                    >
                      {row.name}
                    </th>
                    <td className="font-barlow-condensed font-bold px-5 py-4 text-lg">
                      {row.nights}
                    </td>
                    <td className="px-5 py-4">
                      <ExperienceStatusBadge
                        label={copy.badges.statuses[row.status]}
                        status={row.status}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-5 py-10 text-center text-neutral-600 text-sm"
                    colSpan={3}
                  >
                    {labels.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-5">
          <Pagination
            nextLabel={labels.next}
            onPageChange={setPage}
            page={page}
            pageOfLabel={labels.pageOf}
            previousLabel={labels.previous}
            totalPages={totalPages}
          />
        </div>
      </div>
      <UsageExample
        code={`<TableFilterToolbar copy={copy.filters} filters={filters} shown={filtered.length} total={rows.length} … />\n<SortButton active={active} ariaLabel={copy.sort} label={copy.name} onSort={handleSort} order={order} />\n<Pagination page={page} totalPages={totalPages} onPageChange={setPage} … />`}
        label={copy.usage}
      />
    </>
  );
}
