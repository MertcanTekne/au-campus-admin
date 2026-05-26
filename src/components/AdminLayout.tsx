"use client";

import { AdminSection } from "@/types/admin";

type AdminLayoutProps = {
  activeSection: AdminSection;
  adminEmail?: string | null;
  isBusy?: boolean;
  onLogout: () => void;
  onSectionChange: (section: AdminSection) => void;
  children: React.ReactNode;
};

const navigationItems: { id: AdminSection; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Kullanıcılar" },
  { id: "approvals", label: "Akademik Onaylar" },
  { id: "classes", label: "Sınıflar" },
];

export function AdminLayout({
  activeSection,
  adminEmail,
  isBusy,
  onLogout,
  onSectionChange,
  children,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 bg-zinc-950/95 px-5 py-5 lg:border-b-0 lg:border-r">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e15b6a]">
              AÜ Campus
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Admin Panel
            </h1>
          </div>
          <nav className="grid gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange(item.id)}
                className={`rounded-md px-4 py-3 text-left text-sm font-medium transition ${
                  item.id === activeSection
                    ? "bg-[#b21f35] text-white"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="flex flex-col gap-4 border-b border-white/10 bg-[#09090b]/95 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <p className="text-sm text-zinc-500">Giriş yapan admin</p>
              <p className="mt-1 break-all text-sm font-medium text-zinc-100">
                {adminEmail || "-"}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              disabled={isBusy}
              className="h-10 rounded-md border border-white/15 px-4 text-sm font-semibold text-zinc-100 transition hover:border-[#b21f35] hover:bg-[#b21f35]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Çıkış Yap
            </button>
          </header>
          <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
