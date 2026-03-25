"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiFetch } from "@/lib/fetcher";
import { formatMoney } from "@/lib/utils";

type Invoice = {
  _id: string;
  invoiceNumber: string;
  clientSnapshot: { name: string; email: string; phone?: string };
  issueDate: string;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  total: number;
  currency: string;
};

type InvoiceListResponse = {
  items: Invoice[];
  pagination: {
    page: number;
    totalPages: number;
  };
};

export default function InvoiceListPage() {
  const [data, setData] = useState<InvoiceListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("limit", "10");
    return params.toString();
  }, [search, status, page]);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<InvoiceListResponse>(`/api/invoices?${query}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [query]);

  async function markPaid(id: string) {
    await apiFetch(`/api/invoices/${id}/mark-paid`, { method: "POST" });
    await load();
  }

  async function duplicateInvoice(id: string) {
    await apiFetch(`/api/invoices/${id}/duplicate`, { method: "POST" });
    await load();
  }

  async function sendInvoice(id: string) {
    await apiFetch(`/api/invoices/${id}/send`, { method: "POST" });
    await load();
  }

  async function sendToWhatsapp(invoice: Invoice) {
    try {
      setActionMessage("");
      const appUrl = window.location.origin;
      const pdfUrl = `${appUrl}/api/invoices/${invoice._id}/pdf`;
      const download = await fetch(pdfUrl, { credentials: "include" });
      if (!download.ok) {
        throw new Error("Unable to prepare PDF for WhatsApp");
      }

      const blob = await download.blob();
      const file = new File([blob], `${invoice.invoiceNumber}.pdf`, {
        type: "application/pdf",
      });

      const shareText = `Invoice ${invoice.invoiceNumber} for ${invoice.clientSnapshot.name}`;

      if (
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `Invoice ${invoice.invoiceNumber}`,
          text: shareText,
        });
        return;
      }

      const text = encodeURIComponent(`${shareText}. PDF: ${pdfUrl}`);
      const phone = (invoice.clientSnapshot.phone || "").replace(/[^\d]/g, "");
      const whatsappUrl = phone
        ? `https://wa.me/${phone}?text=${text}`
        : `https://wa.me/?text=${text}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setActionMessage("Browser direct PDF share support nahi karta, WhatsApp link fallback open kiya hai.");
    } catch (e) {
      setActionMessage(e instanceof Error ? e.message : "Failed to open WhatsApp flow");
    }
  }

  async function deleteInvoice() {
    if (!deleteInvoiceId) return;
    setDeletingInvoice(true);
    try {
      await apiFetch(`/api/invoices/${deleteInvoiceId}`, { method: "DELETE" });
      await load();
      setDeleteInvoiceId(null);
    } finally {
      setDeletingInvoice(false);
    }
  }

  return (
    <div className="space-y-4 fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Invoices</h2>
        <Link href="/invoices/new">
          <Button>Create Invoice</Button>
        </Link>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <Input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search invoice # or client"
          />
          <Select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </Select>
          <Button variant="secondary" onClick={load}>
            Refresh
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Invoice History</CardTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2">Invoice</th>
                <th className="py-2">Client</th>
                <th className="py-2">Due</th>
                <th className="py-2">Status</th>
                <th className="py-2">Total</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items || []).map((invoice) => (
                <tr key={invoice._id} className="border-t border-slate-100">
                  <td className="py-3">{invoice.invoiceNumber}</td>
                  <td className="py-3">{invoice.clientSnapshot.name}</td>
                  <td className="py-3">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="py-3">
                    <Badge text={invoice.status} variant={invoice.status} />
                  </td>
                  <td className="py-3">{formatMoney(invoice.total, invoice.currency)}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {invoice.status !== "paid" ? (
                        <Button size="sm" variant="outline" onClick={() => markPaid(invoice._id)}>
                          Mark Paid
                        </Button>
                      ) : null}
                      <Button size="sm" variant="secondary" onClick={() => sendInvoice(invoice._id)}>
                        Email
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => sendToWhatsapp(invoice)}>
                        WhatsApp
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => duplicateInvoice(invoice._id)}>
                        Duplicate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDeleteInvoiceId(invoice._id)}>
                        Delete
                      </Button>
                      <a href={`/api/invoices/${invoice._id}/pdf`} target="_blank">
                        <Button size="sm" variant="secondary">PDF</Button>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading ? <p className="mt-3 text-sm text-slate-500">Loading...</p> : null}
        {actionMessage ? <p className="mt-3 text-sm text-slate-600">{actionMessage}</p> : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <span className="text-sm text-slate-600">
            Page {data?.pagination.page || 1} / {data?.pagination.totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(data?.pagination.totalPages || 1) <= page}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteInvoiceId)}
        title="Delete invoice?"
        description="This action is permanent and cannot be undone."
        confirmText="Delete"
        loading={deletingInvoice}
        onConfirm={deleteInvoice}
        onClose={() => (deletingInvoice ? null : setDeleteInvoiceId(null))}
      />
    </div>
  );
}
