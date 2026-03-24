"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { apiFetch } from "@/lib/fetcher";

type Profile = {
  name: string;
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

type Client = {
  _id: string;
  name: string;
  email: string;
  clientType: "domestic" | "international";
};

const defaultProfile: Profile = {
  name: "",
  email: "",
  phone: "",
  address: "",
  logoUrl: "",
  upiId: "",
  bankDetails: "",
  paypalEmail: "",
  wiseDetails: "",
  stripePaymentLink: "",
  defaultCurrency: "INR",
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [clients, setClients] = useState<Client[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function load() {
      const [p, c] = await Promise.all([
        apiFetch<Profile>("/api/profile"),
        apiFetch<Client[]>("/api/clients"),
      ]);
      setProfile(p);
      setClients(c);
    }
    load().catch((e) => setStatus(e.message));
  }, []);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving...");
    try {
      const saved = await apiFetch<Profile>("/api/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      setProfile(saved);
      setStatus("Saved");
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

  return (
    <div className="space-y-4 fade-up">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h2>
      {status ? <p className="text-sm text-slate-600 dark:text-slate-300">{status}</p> : null}

      <Card>
        <CardTitle>Profile & Payment Methods</CardTitle>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={updateProfile}>
          <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Name" />
          <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone" />
          <Input value={profile.logoUrl} onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })} placeholder="Logo URL" />
          <Input value={profile.upiId} onChange={(e) => setProfile({ ...profile, upiId: e.target.value })} placeholder="UPI ID" />
          <Input value={profile.paypalEmail} onChange={(e) => setProfile({ ...profile, paypalEmail: e.target.value })} placeholder="PayPal email" />
          <Input value={profile.stripePaymentLink} onChange={(e) => setProfile({ ...profile, stripePaymentLink: e.target.value })} placeholder="Stripe payment link" />
          <Input value={profile.wiseDetails} onChange={(e) => setProfile({ ...profile, wiseDetails: e.target.value })} placeholder="Wise details" />
          <Select value={profile.defaultCurrency} onChange={(e) => setProfile({ ...profile, defaultCurrency: e.target.value })}>
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </Select>
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
          <Select name="clientType" defaultValue="domestic">
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
          </Select>
          <Input name="phone" placeholder="Phone" />
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
            <div key={client._id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
              <p className="font-medium text-slate-800 dark:text-slate-100">{client.name}</p>
              <p className="text-slate-500 dark:text-slate-300">{client.email}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
