"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { apiFetch } from "@/lib/fetcher";

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
  smtpSenderEmail: string;
  smtpAppPassword: string;
  smtpConfigured?: boolean;
  defaultCurrency: string;
};

type Client = {
  _id: string;
  name: string;
  email: string;
  clientType: "domestic" | "international";
};

const defaultProfile: Profile = {
  name: "",
  companyName: "",
  email: "",
  phone: "",
  address: "",
  logoUrl: "",
  upiId: "",
  bankDetails: "",
  paypalEmail: "",
  wiseDetails: "",
  stripePaymentLink: "",
  smtpSenderEmail: "",
  smtpAppPassword: "",
  smtpConfigured: false,
  defaultCurrency: "INR",
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [clients, setClients] = useState<Client[]>([]);
  const [status, setStatus] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState(false);

  useEffect(() => {
    async function load() {
      const [p, c] = await Promise.all([
        apiFetch<Profile>("/api/profile"),
        apiFetch<Client[]>("/api/clients"),
      ]);
      setProfile({ ...defaultProfile, ...p });
      setClients(c);
    }
    load().catch((e) => setStatus(e.message));
  }, []);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving...");
    try {
      const enteredAppPassword = profile.smtpAppPassword;
      const saved = await apiFetch<Profile>("/api/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      setProfile((prev) => ({
        ...defaultProfile,
        ...saved,
        smtpAppPassword: enteredAppPassword || prev.smtpAppPassword,
      }));
      setStatus(saved.smtpConfigured ? "Saved. Personal SMTP is configured." : "Saved");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to save");
    }
  }

  async function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      clientType: String(form.get("clientType") || "domestic"),
      phone: String(form.get("phone") || ""),
      address: String(form.get("address") || ""),
      country: String(form.get("country") || ""),
      currency: String(form.get("currency") || "INR"),
    };

    await apiFetch("/api/clients", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const updated = await apiFetch<Client[]>("/api/clients");
    setClients(updated);
    (event.currentTarget as HTMLFormElement).reset();
  }

  async function deleteClient() {
    if (!deleteClientId) return;
    setStatus("Deleting client...");
    setDeletingClient(true);
    try {
      await apiFetch(`/api/clients/${deleteClientId}`, { method: "DELETE" });
      setClients((prev) => prev.filter((client) => client._id !== deleteClientId));
      setStatus("Client deleted");
      setDeleteClientId(null);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to delete client");
    } finally {
      setDeletingClient(false);
    }
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadingLogo(true);
      setStatus("Uploading logo...");

      const sign = await apiFetch<{
        timestamp: number;
        signature: string;
        folder: string;
        cloudName: string;
        apiKey: string;
      }>("/api/uploads/cloudinary-sign", { method: "POST" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sign.apiKey);
      formData.append("timestamp", String(sign.timestamp));
      formData.append("signature", sign.signature);
      formData.append("folder", sign.folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { secure_url?: string; error?: { message?: string } };

      if (!response.ok || !result.secure_url) {
        throw new Error(result.error?.message || "Logo upload failed");
      }

      setProfile((prev) => ({ ...prev, logoUrl: result.secure_url || "" }));
      setStatus("Logo uploaded. Click Save Profile to persist it.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-4 fade-up">
      <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
      {status ? <p className="text-sm text-slate-600">{status}</p> : null}

      <Card>
        <CardTitle>Profile & Payment Methods</CardTitle>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={updateProfile}>
          <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Name" />
          <Input value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} placeholder="Company name" />
          <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone" />
          <div className="space-y-2">
            <Input value={profile.logoUrl} onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })} placeholder="Logo URL" />
            <label className="inline-flex cursor-pointer items-center text-xs font-medium text-zinc-700 hover:text-zinc-900">
              <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} disabled={uploadingLogo} />
              {uploadingLogo ? "Uploading logo..." : "Upload logo"}
            </label>
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt="Profile logo" className="h-10 w-10 rounded-md border border-zinc-200 object-cover" />
            ) : null}
          </div>
          <Input value={profile.upiId} onChange={(e) => setProfile({ ...profile, upiId: e.target.value })} placeholder="UPI ID" />
          <Input value={profile.paypalEmail} onChange={(e) => setProfile({ ...profile, paypalEmail: e.target.value })} placeholder="PayPal email" />
          <Input value={profile.stripePaymentLink} onChange={(e) => setProfile({ ...profile, stripePaymentLink: e.target.value })} placeholder="Stripe payment link" />
          <Input value={profile.wiseDetails} onChange={(e) => setProfile({ ...profile, wiseDetails: e.target.value })} placeholder="Wise details" />
          <Input value={profile.smtpSenderEmail} onChange={(e) => setProfile({ ...profile, smtpSenderEmail: e.target.value })} placeholder="Send mail from (Gmail/Outlook)" />
          <Input type="password" value={profile.smtpAppPassword} onChange={(e) => setProfile({ ...profile, smtpAppPassword: e.target.value })} placeholder={profile.smtpConfigured ? "App password saved (enter new to change)" : "App password"} />
          <Select value={profile.defaultCurrency} onChange={(e) => setProfile({ ...profile, defaultCurrency: e.target.value })}>
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </Select>
          <div className="md:col-span-2 text-xs text-zinc-500">
            For free personal sending, use Gmail/Outlook address with app password (normal login password will fail).
          </div>
          {profile.smtpConfigured ? (
            <div className="md:col-span-2 text-xs text-emerald-700">Personal SMTP configured for invoice emails.</div>
          ) : null}
          <div className="md:col-span-2">
            <Textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Address" rows={2} />
          </div>
          <div className="md:col-span-2">
            <Textarea value={profile.bankDetails} onChange={(e) => setProfile({ ...profile, bankDetails: e.target.value })} placeholder="Bank account details" rows={3} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save Profile</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle>Client Directory</CardTitle>
        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={createClient}>
          <Input name="name" placeholder="Client name" required />
          <Input name="email" type="email" placeholder="Client email" required />
          <Input name="phone" placeholder="Phone (+countrycode)" required />
          <Select name="clientType" defaultValue="domestic">
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
          </Select>
          <Input name="country" placeholder="Country" />
          <Input name="currency" placeholder="INR / USD" defaultValue="INR" />
          <div className="md:col-span-3">
            <Textarea name="address" placeholder="Address" rows={2} />
          </div>
          <div className="md:col-span-3">
            <Button type="submit">Add Client</Button>
          </div>
        </form>

        <div className="mt-5 space-y-2">
          {clients.map((client) => (
            <div key={client._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-slate-800">{client.name}</p>
                <p className="text-slate-500">{client.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setDeleteClientId(client._id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteClientId)}
        title="Delete client?"
        description="This removes the client from your directory. Existing invoices keep their snapshot data."
        confirmText="Delete"
        loading={deletingClient}
        onConfirm={deleteClient}
        onClose={() => (deletingClient ? null : setDeleteClientId(null))}
      />
    </div>
  );
}
