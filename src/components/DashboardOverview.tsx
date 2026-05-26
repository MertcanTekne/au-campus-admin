"use client";

import { useEffect, useState } from "react";
import { fetchDashboardStats, getFirestoreErrorMessage } from "@/lib/adminData";
import { DashboardStats } from "@/types/admin";

const statCards: { key: keyof DashboardStats; label: string }[] = [
  { key: "totalUsers", label: "Toplam kullanıcı" },
  { key: "studentCount", label: "Öğrenci" },
  { key: "academicCount", label: "Akademik personel" },
  { key: "pendingAcademicCount", label: "Onay bekleyen akademik" },
  { key: "adminCount", label: "Admin" },
  { key: "totalClasses", label: "Toplam sınıf" },
];

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadStats() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      setStats(await fetchDashboardStats());
    } catch {
      setErrorMessage(getFirestoreErrorMessage());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function loadInitialStats() {
      try {
        const dashboardStats = await fetchDashboardStats();
        if (isMounted) setStats(dashboardStats);
      } catch {
        if (isMounted) setErrorMessage(getFirestoreErrorMessage());
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadInitialStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#e15b6a]">Genel Bakış</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            AÜ Campus Admin Panel
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Kullanıcı, onay ve sınıf durumlarını Firestore üzerinden izleyin.
          </p>
        </div>
        <button
          type="button"
          onClick={loadStats}
          disabled={isLoading}
          className="h-10 rounded-md border border-white/15 px-4 text-sm font-semibold text-zinc-100 transition hover:border-[#b21f35] hover:bg-[#b21f35]/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Yenile
        </button>
      </div>
      {errorMessage ? (
        <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </p>
      ) : null}
      {isLoading ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-sm text-zinc-300">
          İstatistikler yükleniyor...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statCards.map((card) => (
            <article key={card.key} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm text-zinc-400">{card.label}</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                {stats?.[card.key] ?? 0}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
