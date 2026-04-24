"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import type { AdminPayment } from "@/lib/admin/types";

export function AdminPaymentsPageClient() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<AdminPayment[]>([]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/payments");
        const data = (await res.json()) as { error?: string; payments?: AdminPayment[] };
        if (!res.ok || !data.payments) {
          setError(data.error ?? "Failed to load payments");
          return;
        }
        setPayments(data.payments);
      } catch {
        setError("Failed to load payments");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-gray-200 px-5 py-4">
        <p className="text-xs text-neutral-500">{payments.length} payments</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-5 my-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                {["Payment ID", "Traveler", "Amount", "Status", "Provider", "Created"].map((h) => (
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr className="border-b border-gray-100 last:border-0" key={payment.id}>
                  <td className="px-4 py-3.5 text-xs text-neutral-500">{payment.id}</td>
                  <td className="px-4 py-3.5 text-sm text-neutral-700">
                    <p>{payment.user.name}</p>
                    <p className="text-xs text-neutral-500">{payment.user.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-neutral-700">
                    {payment.amount} {payment.currency}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-neutral-700">{payment.status}</td>
                  <td className="px-4 py-3.5 text-sm text-neutral-700">{payment.provider}</td>
                  <td className="px-4 py-3.5 text-xs text-neutral-400">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No payments found.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
