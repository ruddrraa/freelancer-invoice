"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/fetcher";
import { calculateInvoiceTotals } from "@/lib/invoice";
import { generateInvoiceNumber } from "@/lib/utils";

type Client = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  clientType: "domestic" | "international";
  currency: string;
};

type Profile = {
  name: string;
  upiId: string;
  paypalEmail: string;
  wiseDetails: string;
  stripePaymentLink: string;
  defaultCurrency: string;
};

type LineItem = { name: string; quantity: number; price: number };

export default function NewInvoicePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [clientType, setClientType] = useState<"domestic" | "international">("domestic");
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState("INR");
  const [taxType, setTaxType] = useState<"percentage" | "fixed">("percentage");
  const [taxValue, setTaxValue] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [error, setError] = useState("");

  const [lineItems, setLineItems] = useState<LineItem[]>([{ name: "", quantity: 1, price: 0 }]);

  useEffect(() => {
    async function load() {
      const [user, clientList] = await Promise.all([
        apiFetch<Profile>("/api/profile"),
        apiFetch<Client[]>("/api/clients"),
      ]);
      setProfile(user);
      setClients(clientList);
      setCurrency(user.defaultCurrency || "INR");
    }
    load().catch((e) => setError(e.message));
  }, []);

  const selectedClient = useMemo(
    () => clients.find((item) => item._id === clientId) || null,
    [clients, clientId]
  );

  useEffect(() => {
    if (selectedClient) {
      setClientType(selectedClient.clientType);
      setCurrency(selectedClient.currency || currency);
    }
  }, [selectedClient]);

  const totals = useMemo(() => calculateInvoiceTotals(lineItems, taxType, taxValue), [lineItems, taxType, taxValue]);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setLineItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setLineItems((prev) => [...prev, { name: "", quantity: 1, price: 0 }]);
  }

  function removeItem(index: number) {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev));
  }

  async function createInvoice() {
    try {
      setError("");
      await apiFetch("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          invoiceNumber,
          issueDate,
          dueDate,
          clientId: selectedClient?._id,
          clientType,
          clientSnapshot: {
            name: selectedClient?.name || "",
            email: selectedClient?.email || "",
            phone: selectedClient?.phone || "",
            address: selectedClient?.address || "",
          },
          lineItems,
          taxType,
          taxValue,
          currency,
          notes,
          terms,
        }),
      });
      router.push("/invoices");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create invoice");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] fade-up">
      <Card>
        <CardTitle>Create Invoice</CardTitle>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Invoice number" />
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.name} ({client.clientType})
              </option>
            ))}
          </Select>
          <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Select value={clientType} onChange={(e) => setClientType(e.target.value as "domestic" | "international")}>
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
          </Select>
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </Select>
        </div>

        <div className="mt-4 space-y-2">
          {lineItems.map((item, idx) => (
            <div key={idx} className="grid gap-2 md:grid-cols-[1fr_100px_120px_auto]">
              <Input
                value={item.name}
                onChange={(e) => updateItem(idx, { name: e.target.value })}
                placeholder="Product / Service"
              />
              <Input
                type="number"
                min={0}
                value={item.quantity}
                onChange={(e) => updateItem(idx, { quantity: Number(e.target.value || 0) })}
              />
              <Input
                type="number"
                min={0}
                value={item.price}
                onChange={(e) => updateItem(idx, { price: Number(e.target.value || 0) })}
              />
              <Button variant="outline" onClick={() => removeItem(idx)}>
                Remove
              </Button>
            </div>
          ))}
          <Button variant="secondary" onClick={addItem}>
            Add line item
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Select value={taxType} onChange={(e) => setTaxType(e.target.value as "percentage" | "fixed")}>
            <option value="percentage">Tax %</option>
            <option value="fixed">Tax fixed</option>
          </Select>
          <Input type="number" min={0} value={taxValue} onChange={(e) => setTaxValue(Number(e.target.value || 0))} />
          <div className="md:col-span-2">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
          </div>
          <div className="md:col-span-2">
            <Textarea rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Terms" />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-4 flex gap-2">
          <Button onClick={createInvoice}>Save Invoice</Button>
          <Button variant="secondary" onClick={() => router.push("/invoices")}>Cancel</Button>
        </div>
      </Card>

      <InvoicePreview
        invoiceNumber={invoiceNumber}
        issueDate={issueDate}
        dueDate={dueDate}
        currency={currency}
        clientName={selectedClient?.name || ""}
        issuerName={profile?.name || ""}
        lineItems={lineItems}
        subtotal={totals.subtotal}
        taxAmount={totals.taxAmount}
        total={totals.total}
        paymentDetails={{
          upiId: clientType === "domestic" ? profile?.upiId : "",
          paypal: clientType === "international" ? profile?.paypalEmail : "",
          wise: clientType === "international" ? profile?.wiseDetails : "",
          stripe: clientType === "international" ? profile?.stripePaymentLink : "",
        }}
      />
    </div>
  );
}
