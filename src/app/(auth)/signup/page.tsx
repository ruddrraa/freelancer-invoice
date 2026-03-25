"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name") || ""),
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
        }),
      });
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mono-grid grid min-h-screen place-items-center bg-zinc-100 px-4">
      <Card className="w-full max-w-md">
        <CardTitle>Create account</CardTitle>
        <p className="mt-1 text-sm text-zinc-600">
          Start billing domestic and international clients.
        </p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <Input name="name" placeholder="Your full name" required />
          <Input name="email" type="email" placeholder="you@example.com" required />
          <Input name="password" type="password" placeholder="At least 8 characters" required />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-zinc-600">
          Already have an account?{" "}
          <Link className="font-medium text-zinc-900" href="/login">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
