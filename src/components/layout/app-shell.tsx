"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, FileText, LayoutDashboard, LogOut, Menu, Settings } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="mono-grid min-h-screen bg-[#d7d9df]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <header className="mb-4 rounded-2xl border border-zinc-300 bg-[#f4f4f6] px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-900 text-white"
            >
              <span className="text-sm font-bold">FI</span>
            </Link>

            <nav className="flex flex-1 flex-wrap items-center gap-2 md:justify-center">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "bg-white text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    <Icon size={14} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2" ref={menuRef}>
              <button className="rounded-lg border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-100">
                <Bell size={14} />
              </button>
              <button
                className="rounded-lg border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-100"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Open menu"
              >
                <Menu size={14} />
              </button>

              {menuOpen ? (
                <div className="absolute right-6 top-20 z-50 w-52 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
                  {nav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={`menu-${item.href}`}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                      >
                        <Icon size={14} />
                        {item.label}
                      </Link>
                    );
                  })}
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
