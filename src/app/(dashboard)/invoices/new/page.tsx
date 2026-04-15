"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/fetcher";
import { calculateInvoiceTotals } from "@/lib/invoice";
import { generateInvoiceNumber } from "@/lib/utils";
import { TaxType } from "@/types";

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
  companyName: string;
  email: string;
  phone: string;
  address: string;
  logoUrl: string;
  upiId: string;
  bankDetails: string;
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
  const [taxType, setTaxType] = useState<TaxType>("gst");
  const [taxValue, setTaxValue] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 14");
  const [error, setError] = useState("");
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [fxError, setFxError] = useState("");
  const [fxLoading, setFxLoading] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [addingClient, setAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    clientType: "domestic" as "domestic" | "international",
    currency: "INR",
  });

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

  useEffect(() => {
    const baseCurrency = profile?.defaultCurrency || "INR";
    if (!currency || !baseCurrency) return;

    if (baseCurrency === currency) {
      setFxRate(1);
      setFxError("");
      return;
    }

    let cancelled = false;

    async function loadRate() {
      try {
        setFxLoading(true);
        setFxError("");
        const res = await apiFetch<{ rate: number }>(
          `/api/exchange-rate?base=${encodeURIComponent(baseCurrency)}&target=${encodeURIComponent(currency)}`
        );
        if (!cancelled) {
          setFxRate(res.rate);
        }
      } catch (e) {
        if (!cancelled) {
          setFxRate(null);
          setFxError(e instanceof Error ? e.message : "Unable to fetch live FX rate");
        }
      } finally {
        if (!cancelled) {
          setFxLoading(false);
        }
      }
    }

    loadRate();
    return () => {
      cancelled = true;
    };
  }, [currency, profile?.defaultCurrency]);

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

  async function addClientFromInvoice() {
    try {
      setError("");
      setAddingClient(true);
      const created = await apiFetch<Client>("/api/clients", {
        method: "POST",
        body: JSON.stringify({
          name: newClient.name,
          email: newClient.email,
          phone: newClient.phone,
          address: newClient.address,
          country: newClient.country,
          clientType: newClient.clientType,
          currency: newClient.currency,
        }),
      });

      setClients((prev) => [created, ...prev]);
      setClientId(created._id);
      setClientType(created.clientType);
      setCurrency(created.currency || "INR");
      setNewClient({
        name: "",
        email: "",
        phone: "",
        address: "",
        country: "",
        clientType: "domestic",
        currency: "INR",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add client");
    } finally {
      setAddingClient(false);
    }
  }

  async function createInvoice(sendInvoice: boolean) {
    try {
      setError("");
      if (!selectedClient) {
        setError("Please select a customer");
        return;
      }

      if (sendInvoice) {
        setLoadingSend(true);
      } else {
        setLoadingDraft(true);
      }

      const created = await apiFetch<{ _id: string }>("/api/invoices", {
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
          terms: terms || paymentTerms,
        }),
      });

      if (sendInvoice) {
        await apiFetch(`/api/invoices/${created._id}/send`, { method: "POST" });
      }

      router.push("/invoices");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create invoice");
    } finally {
      setLoadingDraft(false);
      setLoadingSend(false);
    }
  }

  return (
    <div className="fade-up space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              onClick={() => router.push("/invoices")}
              className="mb-1 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900"
            >
              <ArrowLeft size={12} />
              Back to invoices
            </button>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
              Create New Invoice
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => createInvoice(false)} disabled={loadingDraft || loadingSend}>
              {loadingDraft ? "Saving..." : "Save as Draft"}
            </Button>
            <Button onClick={() => createInvoice(true)} disabled={loadingDraft || loadingSend}>
              <Send size={14} className="mr-1" />
              {loadingSend ? "Sending..." : "Send Invoice"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-zinc-900">Invoice Details</p>

          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs text-zinc-500">Customer</p>
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Select customer</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name} ({client.clientType})
                  </option>
                ))}
              </Select>
            </div>

            <div className="rounded-xl border border-zinc-200 p-3">
              <p className="mb-2 text-xs font-semibold text-zinc-700">Add new client</p>
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={newClient.name}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Client name"
                />
                <Input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Client email"
                />
                <Input
                  value={newClient.phone}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone (+countrycode)"
                />
                <Input
                  value={newClient.country}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                />
                <Textarea
                  rows={2}
                  value={newClient.address}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Billing address (optional)"
                  className="md:col-span-2"
                />
                <Select
                  value={newClient.clientType}
                  onChange={(e) =>
                    setNewClient((prev) => ({ ...prev, clientType: e.target.value as "domestic" | "international" }))
                  }
                >
                  <option value="domestic">Domestic</option>
                  <option value="international">International</option>
                </Select>
                <Select
                  value={newClient.currency}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, currency: e.target.value }))}
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </Select>
              </div>
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={addingClient || !newClient.name || !newClient.email || !newClient.phone}
                  onClick={addClientFromInvoice}
                >
                  {addingClient ? "Adding..." : "Add client"}
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs text-zinc-500">Billing Address</p>
              <Textarea
                value={selectedClient?.address || "No address available"}
                rows={2}
                readOnly
                className="resize-none bg-zinc-50"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="mb-1 text-xs text-zinc-500">Issue Date</p>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div>
                <p className="mb-1 text-xs text-zinc-500">Due Date</p>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div>
                <p className="mb-1 text-xs text-zinc-500">Payment Terms</p>
                <Select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
                  <option>Net 7</option>
                  <option>Net 14</option>
                  <option>Net 30</option>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200">
              <div className="grid grid-cols-[1.4fr_0.45fr_0.7fr_0.7fr_auto] gap-2 border-b border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-500">
                <p>Item</p>
                <p>QTY</p>
                <p>Cost</p>
                <p>Amount</p>
                <p />
              </div>
              <div className="space-y-2 p-3">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1.4fr_0.45fr_0.7fr_0.7fr_auto] gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                      placeholder="Item name"
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
                    <Input value={(item.quantity * item.price).toFixed(2)} readOnly className="bg-zinc-50" />
                    <Button variant="outline" onClick={() => removeItem(idx)}>
                      X
                    </Button>
                  </div>
                ))}
                <button
                  onClick={addItem}
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                >
                  + Add item
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="mb-1 text-xs text-zinc-500">Discount</p>
                <Input value="0.00" readOnly className="bg-zinc-50" />
              </div>
              <div>
                <p className="mb-1 text-xs text-zinc-500">Tax</p>
                <div className="grid grid-cols-[1fr_1fr] gap-2">
                  <Select value={taxType} onChange={(e) => setTaxType(e.target.value as TaxType)}>
                    <option value="gst">GST (%)</option>
                    <option value="igst">GST (IGST %)</option>
                    <option value="sgst">GST (SGST %)</option>
                    <option value="fixed">Fixed Tax Amount</option>
                    <option value="percentage">Generic % Tax</option>
                  </Select>
                  <Input type="number" min={0} value={taxValue} onChange={(e) => setTaxValue(Number(e.target.value || 0))} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-zinc-500">Total</p>
                <Input value={totals.total.toFixed(2)} readOnly className="bg-zinc-50 font-semibold" />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-zinc-500">Invoice Number</p>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div>
                <p className="mb-1 text-xs text-zinc-500">Currency</p>
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs">
              <p className="font-semibold text-zinc-800">Live exchange rate</p>
              {fxLoading ? <p className="mt-1 text-zinc-500">Loading live rate...</p> : null}
              {!fxLoading && fxRate !== null ? (
                <p className="mt-1 text-zinc-700">
                  1 {profile?.defaultCurrency || "INR"} = {fxRate.toFixed(4)} {currency}
                </p>
              ) : null}
              {fxError ? <p className="mt-1 text-rose-600">{fxError}</p> : null}
            </div>

            <div>
              <p className="mb-1 text-xs text-zinc-500">Notes to Customer</p>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thank you for your trust. Please complete payment before due date."
              />
            </div>

            <div>
              <p className="mb-1 text-xs text-zinc-500">Terms</p>
              <Textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Late fee after due date, payment within selected net terms."
              />
            </div>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-zinc-900">Preview</p>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <InvoicePreview
              invoiceNumber={invoiceNumber}
              issueDate={issueDate}
              dueDate={dueDate}
              currency={currency}
              clientName={selectedClient?.name || ""}
              clientEmail={selectedClient?.email || ""}
              clientPhone={selectedClient?.phone || ""}
              clientAddress={selectedClient?.address || ""}
              issuerName={profile?.name || ""}
              issuerCompanyName={profile?.companyName || ""}
              issuerEmail={profile?.email || ""}
              issuerPhone={profile?.phone || ""}
              issuerAddress={profile?.address || ""}
              issuerLogoUrl={profile?.logoUrl || ""}
              lineItems={lineItems}
              subtotal={totals.subtotal}
              taxAmount={totals.taxAmount}
              taxType={taxType}
              taxValue={taxValue}
              total={totals.total}
              clientType={clientType}
              notes={notes}
              terms={terms || paymentTerms}
              paymentDetails={{
                upiId: clientType === "domestic" ? profile?.upiId : "",
                bankDetails: clientType === "domestic" ? profile?.bankDetails : "",
                paypal: clientType === "international" ? profile?.paypalEmail : "",
                wise: clientType === "international" ? profile?.wiseDetails : "",
                stripe: clientType === "international" ? profile?.stripePaymentLink : "",
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
