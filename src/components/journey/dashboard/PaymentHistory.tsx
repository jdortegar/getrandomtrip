"use client";

import { StatusBadge } from "@/components/app/admin/StatusBadge";
import GlassCard from "@/components/ui/GlassCard";
import { formatUSDWithCents } from "@/lib/format";
import { formatDateISO } from "@/lib/datetime";
import { PaymentItem } from "./types";

export default function PaymentHistory({ items }: { items: PaymentItem[] }) {
  return (
    <GlassCard>
      <div className="p-5">
        <h3 className="text-base font-semibold text-neutral-900">
          Historial de pagos
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-neutral-600">
              <tr>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Descripción</th>
                <th className="py-2 pr-4">Monto</th>
                <th className="py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-neutral-200">
                  <td className="py-2 pr-4">{formatDateISO(p.dateISO)}</td>
                  <td className="py-2 pr-4">{p.description}</td>
                  <td className="py-2 pr-4 font-medium">
                    {formatUSDWithCents(p.amountUsd)}
                  </td>
                  <td className="py-2">
                    <StatusBadge
                      label={p.status}
                      status={p.status.toUpperCase()}
                      variant="payment"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </GlassCard>
  );
}
