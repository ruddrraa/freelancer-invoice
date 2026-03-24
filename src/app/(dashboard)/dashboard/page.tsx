"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { apiFetch } from "@/lib/fetcher";

const RevenueChart = dynamic(
  () => import("@/components/dashboard/revenue-chart").then((mod) => mod.RevenueChart),
  { ssr: false }
);

type SummaryResponse = {
  totals: {
    earnings: number;
    pendingInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
  };
  monthlyRevenue: Array<{ _id: string; revenue: number }>;
  recentActivity: Array<{ _id: string; action: string; createdAt: string }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load() {
      try {
        const response = await apiFetch<SummaryResponse>("/api/dashboard/summary");
        setData(response);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    }

    load();
    timer = setInterval(load, 30000);
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);

  return (
    <div className="space-y-4 fade-up">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h2>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Total Earnings</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatMoney(data?.totals.earnings || 0)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{data?.totals.pendingInvoices || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Paid</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{data?.totals.paidInvoices || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Overdue</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{data?.totals.overdueInvoices || 0}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardTitle>Monthly Revenue</CardTitle>
          <div className="mt-4">
            <RevenueChart data={data?.monthlyRevenue || []} />
          </div>
        </Card>

        <Card>
          <CardTitle>Recent Activity</CardTitle>
          <div className="mt-3 space-y-2">
            {(data?.recentActivity || []).map((item) => (
              <div key={item._id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <p className="font-medium text-slate-700">{item.action.replaceAll("_", " ")}</p>
                <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
