import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieName } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  if (token) {
    redirect("/dashboard");
  }

  return (
    <main className="mono-grid relative min-h-screen overflow-hidden bg-zinc-100 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="fade-up rounded-3xl border border-zinc-300 bg-white p-10 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)] md:p-14">
          <p className="mb-3 inline-flex rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700">
            Premium Invoice Suite
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-zinc-900 md:text-6xl">
            Manage global freelance invoices with built-in payments and automation
          </h1>
          <p className="mt-5 max-w-2xl text-zinc-600 md:text-lg">
            Smart invoice creation, domestic UPI flows, international payment links, PDF/email delivery,
            and real-time payment tracking in one production-grade platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup">
              <Button size="lg">Create Account</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

