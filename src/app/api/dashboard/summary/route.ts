import { NextRequest } from "next/server";
import { fail, getUserIdOrThrow, ok } from "@/lib/api";
import { connectDb } from "@/lib/db";
import ActivityLog from "@/models/ActivityLog";
import Invoice from "@/models/Invoice";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdOrThrow(req);
    await connectDb();

    const [stats, monthly, recent] = await Promise.all([
      Invoice.aggregate([
        { $match: { userId: { $eq: new (await import("mongoose")).default.Types.ObjectId(userId) } } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            amount: { $sum: "$total" },
          },
        },
      ]),
      Invoice.aggregate([
        { $match: { userId: { $eq: new (await import("mongoose")).default.Types.ObjectId(userId) } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$issueDate" } },
            revenue: {
              $sum: {
                $cond: [{ $eq: ["$status", "paid"] }, "$total", 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
      ActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(12).lean(),
    ]);

    const totals = {
      earnings: 0,
      pendingInvoices: 0,
      paidInvoices: 0,
      overdueInvoices: 0,
    };

    stats.forEach((entry: { _id: string; count: number; amount: number }) => {
      if (entry._id === "paid") {
        totals.earnings = entry.amount;
        totals.paidInvoices = entry.count;
      }
      if (entry._id === "pending") {
        totals.pendingInvoices = entry.count;
      }
      if (entry._id === "overdue") {
        totals.overdueInvoices = entry.count;
      }
    });

    return ok({ totals, monthlyRevenue: monthly, recentActivity: recent });
  } catch {
    return fail("Unauthorized", 401);
  }
}
