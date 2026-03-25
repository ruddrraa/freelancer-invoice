"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bell, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
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

type RangeKey = "day" | "week" | "month" | "year";

const rangeOptions: Array<{ label: string; value: RangeKey }> = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

function formatMonthLabel(ym: string) {
  const [year, month] = ym.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState<RangeKey>("month");
  const [selectedActivityDate, setSelectedActivityDate] = useState<string>("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

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

  const monthlyRevenue = useMemo(() => {
    const points = [...(data?.monthlyRevenue || [])].sort((a, b) => a._id.localeCompare(b._id));
    const countByRange: Record<RangeKey, number> = {
      day: 1,
      week: 3,
      month: 6,
      year: 12,
    };
    return points.slice(-countByRange[range]);
  }, [data?.monthlyRevenue, range]);

  const selectedRevenue = useMemo(
    () => monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0),
    [monthlyRevenue]
  );

  const dateRangeLabel = useMemo(() => {
    if (!monthlyRevenue.length) return "No revenue data";
    const first = formatMonthLabel(monthlyRevenue[0]._id);
    const last = formatMonthLabel(monthlyRevenue[monthlyRevenue.length - 1]._id);
    return `${first} - ${last}`;
  }, [monthlyRevenue]);

  const calendarMeta = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const today = new Date();

    const cells: Array<{ date: number; inMonth: boolean; isToday: boolean; key: string; iso: string }> = [];

    for (let index = 0; index < 42; index += 1) {
      let date = 0;
      let inMonth = true;
      let cellYear = year;
      let cellMonth = month;

      if (index < firstDayIndex) {
        inMonth = false;
        date = daysInPrevMonth - firstDayIndex + index + 1;
        cellMonth = month - 1;
        if (cellMonth < 0) {
          cellMonth = 11;
          cellYear -= 1;
        }
      } else if (index >= firstDayIndex + daysInMonth) {
        inMonth = false;
        date = index - (firstDayIndex + daysInMonth) + 1;
        cellMonth = month + 1;
        if (cellMonth > 11) {
          cellMonth = 0;
          cellYear += 1;
        }
      } else {
        date = index - firstDayIndex + 1;
      }

      const isToday =
        cellYear === today.getFullYear() &&
        cellMonth === today.getMonth() &&
        date === today.getDate();

      cells.push({
        date,
        inMonth,
        isToday,
        key: `${cellYear}-${cellMonth + 1}-${date}-${index}`,
        iso: new Date(cellYear, cellMonth, date).toISOString().slice(0, 10),
      });
    }

    return {
      monthLabel: calendarMonth.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      }),
      cells,
    };
  }, [calendarMonth]);

  const totalInvoices =
    (data?.totals.pendingInvoices || 0) +
    (data?.totals.paidInvoices || 0) +
    (data?.totals.overdueInvoices || 0);
  const paidRatio = totalInvoices ? Math.round(((data?.totals.paidInvoices || 0) / totalInvoices) * 100) : 0;

  const activityRows = useMemo(() => {
    const all = (data?.recentActivity || []).slice(0, 12);
    if (!selectedActivityDate) return all.slice(0, 6);
    return all
      .filter((item) => new Date(item.createdAt).toISOString().slice(0, 10) === selectedActivityDate)
      .slice(0, 6);
  }, [data?.recentActivity, selectedActivityDate]);

  function scrollToActivity() {
    const target = document.getElementById("recent-activity");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-4 fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-300 bg-white px-4 py-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Dashboard</h2>
        <div className="flex items-center gap-2 text-xs">
          {rangeOptions.map((item) => (
            <button
              key={item.label}
              onClick={() => setRange(item.value)}
              className={`rounded-full border px-3 py-1.5 transition ${
                range === item.value
                  ? "border-zinc-800 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="ml-1 inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-zinc-600">
            <CalendarDays size={12} />
            {dateRangeLabel}
          </div>
          <button
            className="ml-2 rounded-full border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-100"
            onClick={scrollToActivity}
            title="Jump to recent activity"
          >
            <Bell size={14} />
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden border-zinc-900 bg-zinc-900 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.2),transparent_35%),repeating-linear-gradient(45deg,rgba(255,255,255,0.08),rgba(255,255,255,0.08)_8px,transparent_8px,transparent_16px)]" />
          <div className="relative">
            <p className="text-xs opacity-80">Revenue ({range})</p>
            <p className="mt-1 text-3xl font-semibold">{formatMoney(selectedRevenue || 0)}</p>
            <p className="mt-2 text-xs opacity-80">Filtered from chart range</p>
          </div>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Pending Invoices</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">{data?.totals.pendingInvoices || 0}</p>
          <p className="mt-2 text-xs text-emerald-600">+1.7% from last month</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Paid Invoices</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">{data?.totals.paidInvoices || 0}</p>
          <p className="mt-2 text-xs text-emerald-600">+2.9% from last month</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Overdue</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">{data?.totals.overdueInvoices || 0}</p>
          <p className="mt-2 text-xs text-rose-600">-0.9% from last month</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-lg font-semibold text-zinc-900">Total Revenue</p>
            <button
              className="rounded-full border border-zinc-300 p-1.5 text-zinc-500 hover:bg-zinc-100"
              onClick={() => router.push("/invoices")}
              title="Open invoices"
            >
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="mt-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-2 py-3">
            <RevenueChart data={monthlyRevenue} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <button
              className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100"
              onClick={() =>
                setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
            >
              <ChevronLeft size={16} />
            </button>
            <p className="font-medium text-zinc-800">{calendarMeta.monthLabel}</p>
            <button
              className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100"
              onClick={() =>
                setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <p key={day} className="text-zinc-500">
                {day}
              </p>
            ))}
            {calendarMeta.cells.map((cell) => (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedActivityDate(cell.iso)}
                className={`rounded-xl py-2 text-sm ${
                  selectedActivityDate === cell.iso
                    ? "bg-zinc-900 text-white"
                    : cell.isToday
                    ? "bg-zinc-900 text-white"
                    : cell.inMonth
                      ? "text-zinc-700"
                      : "text-zinc-400"
                }`}
              >
                {cell.date}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-sm font-semibold text-zinc-900">Invoice completion</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-zinc-600">
                {data?.totals.paidInvoices || 0} paid of {totalInvoices}
              </p>
              <div
                className="grid h-12 w-12 place-items-center rounded-full text-xs font-semibold text-zinc-900"
                style={{
                  background: `conic-gradient(#111 ${paidRatio}%, #d4d4d8 0)`,
                }}
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-white">{paidRatio}%</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0" id="recent-activity">
        <div className="border-b border-zinc-200 px-4 py-3 text-lg font-semibold text-zinc-900">
          <div className="flex items-center justify-between">
            <span>Recent Activity</span>
            {selectedActivityDate ? (
              <button
                type="button"
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                onClick={() => setSelectedActivityDate("")}
              >
                Clear date filter
              </button>
            ) : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-170 text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="px-4 py-2">Activity</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {activityRows.map((item) => (
                <tr key={item._id} className="border-t border-zinc-200">
                  <td className="px-4 py-3 font-medium text-zinc-800">
                    {item.action.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-white">
                      Logged
                    </span>
                  </td>
                </tr>
              ))}
              {!activityRows.length ? (
                <tr className="border-t border-zinc-200">
                  <td className="px-4 py-4 text-zinc-500" colSpan={3}>
                    No recent activities found{selectedActivityDate ? " for selected date" : ""}.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
