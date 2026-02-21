"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";

interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: "paid" | "failed" | "pending";
  pdfUrl: string | null;
}

const statusConfig = {
  paid: {
    icon: CheckCircle2,
    label: "Paid",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
};

export default function BillingHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch("/api/billing/usage");
        if (!res.ok) {
          throw new Error("Failed to fetch billing history");
        }
        const data = await res.json();
        setInvoices(data.invoices ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load billing history"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, []);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
        <div className="flex items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading billing history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
        <div className="flex items-center justify-center gap-3 text-red-400">
          <XCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
          <FileText className="w-8 h-8" />
          <p className="text-sm">No billing history yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-300">Billing History</h3>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="text-left py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Date
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Description
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-right py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Invoice
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice, index) => {
              const status = statusConfig[invoice.status];
              const StatusIcon = status.icon;
              return (
                <tr
                  key={invoice.id}
                  className={`border-b border-zinc-800/30 ${
                    index % 2 === 0 ? "bg-zinc-900/30" : ""
                  }`}
                >
                  <td className="py-3.5 px-6 text-sm text-zinc-400">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="py-3.5 px-6 text-sm text-zinc-300">
                    {invoice.description}
                  </td>
                  <td className="py-3.5 px-6 text-sm text-zinc-300 font-medium">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    {invoice.pdfUrl ? (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-600">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="md:hidden divide-y divide-zinc-800/30">
        {invoices.map((invoice) => {
          const status = statusConfig[invoice.status];
          const StatusIcon = status.icon;
          return (
            <div key={invoice.id} className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-300 font-medium">
                  {invoice.description}
                </span>
                <span className="text-sm text-zinc-300 font-semibold">
                  {formatAmount(invoice.amount, invoice.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  {formatDate(invoice.date)}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${status.color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                  {invoice.pdfUrl && (
                    <a
                      href={invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
