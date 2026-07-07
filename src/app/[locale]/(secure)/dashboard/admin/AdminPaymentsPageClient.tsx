"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { StatusBadge } from "@/components/app/admin/StatusBadge";
import type { AdminPayment } from "@/lib/admin/types";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

export function AdminPaymentsPageClient() {
  const copy = useDictionary((d) => d.adminPages.payments);
  const locale = useLocale();
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<AdminPayment[]>([]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/payments");
        const data = (await res.json()) as {
          error?: string;
          payments?: AdminPayment[];
        };
        if (!res.ok || !data.payments) {
          setError(data.error ?? copy.errorLoad);
          return;
        }
        setPayments(data.payments);
      } catch {
        setError(copy.errorLoad);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const cols = copy.columns;

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.title}
        </h2>
      </div>

      <div className="flex items-center justify-end">
        <span className="text-[13px] text-neutral-400">
          {copy.count.replace("{n}", String(payments.length))}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {payments.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-500">
            {copy.empty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.paymentId}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.traveler}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.amount}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.status}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.provider}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.created}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((payment) => (
                  <tr className="transition-colors hover:bg-gray-50" key={payment.id}>
                    <td className="px-5 py-4 text-xs text-neutral-500">
                      {payment.id}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-neutral-900">
                        {payment.user.name}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {payment.user.email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-barlow-condensed text-lg font-bold leading-none text-gray-900">
                        {payment.amount} {payment.currency}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={payment.status} variant="payment" />
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {payment.provider}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-500">
                      {new Date(payment.createdAt).toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
