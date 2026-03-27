import type { Payment } from "@/lib/utils/trips";
import type { DashboardCopy, DashboardStats } from "./types";

interface FinancialSummaryProps {
  copy: DashboardCopy;
  payments: Payment[];
  stats: DashboardStats;
}

export function FinancialSummary({
  copy,
  payments,
  stats,
}: FinancialSummaryProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        {copy.financialSummary.title}
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
          <span className="text-sm text-neutral-600">
            {copy.financialSummary.totalSpent}
          </span>
          <span className="font-bold text-neutral-900">
            ${(stats.totalSpent ?? 0).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
          <span className="text-sm text-neutral-600">
            {copy.financialSummary.completedPayments}
          </span>
          <span className="font-bold text-neutral-900">
            {
              payments.filter(
                (payment) =>
                  payment.status === "APPROVED" ||
                  payment.status === "COMPLETED",
              ).length
            }
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
          <span className="text-sm text-neutral-600">
            {copy.financialSummary.pendingPayments}
          </span>
          <span className="font-bold text-neutral-900">
            {payments.filter((payment) => payment.status === "PENDING").length}
          </span>
        </div>
      </div>
    </div>
  );
}
