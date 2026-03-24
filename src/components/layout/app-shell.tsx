"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#dff6ff,transparent_45%),radial-gradient(circle_at_80%_10%,#ffe4cf,transparent_40%),#f8fafc] dark:bg-[radial-gradient(circle_at_20%_0%,#1d2a3f,transparent_45%),radial-gradient(circle_at_80%_10%,#3a2721,transparent_40%),#020617]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[230px_1fr]">
        <aside className="rounded-2xl border border-slate-200/70 bg-white/85 p-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
          <h1 className="mb-6 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Freelancer Invoice
          </h1>
          <nav className="space-y-2">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                    active
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main>
          <header className="mb-4 flex items-center justify-end gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
