"use client";

import { useEffect, useState } from "react";
import {
  fetchAcademicDashboardStats,
  fetchDashboardStats,
  getFirestoreErrorMessage,
} from "@/lib/adminData";
import { AcademicDashboardStats, DashboardStats, PanelUser } from "@/types/admin";

const adminStatCards: { key: keyof DashboardStats; label: string }[] = [
  { key: "totalUsers", label: "Toplam kullanıcı" },
  { key: "studentCount", label: "Öğrenci" },
  { key: "academicCount", label: "Akademik personel" },
  { key: "pendingAcademicCount", label: "Onay bekleyen akademik" },
  { key: "adminCount", label: "Admin" },
  { key: "totalClasses", label: "Toplam sınıf" },
];

const academicStatCards: { key: keyof AcademicDashboardStats; label: string }[] = [
  { key: "ownClassCount", label: "Kendi sınıf sayısı" },
  { key: "activeClassCount", label: "Aktif sınıf sayısı" },
  { key: "totalAnnouncementCount", label: "Toplam duyuru" },
  { key: "totalMaterialCount", label: "Toplam materyal" },
];

type DashboardOverviewProps = {
  panelUser: PanelUser;
};

export function DashboardOverview({ panelUser }: DashboardOverviewProps) {
  const [adminStats, setAdminStats] = useState<DashboardStats | null>(null);
  const [academicStats, setAcademicStats] = useState<AcademicDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadStats() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      if (panelUser.role === "admin") {
        setAdminStats(await fetchDashboardStats());
      } else {
        setAcademicStats(await fetchAcademicDashboardStats(panelUser));
      }
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
        if (panelUser.role === "admin") {
          const stats = await fetchDashboardStats();
          if (isMounted) setAdminStats(stats);
        } else {
          const stats = await fetchAcademicDashboardStats(panelUser);
          if (isMounted) setAcademicStats(stats);
        }
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
  }, [panelUser]);

  const isAdmin = panelUser.role === "admin";

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#e15b6a]">Genel Bakış</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {isAdmin ? "AÜ Campus Admin Panel" : "AÜ Campus Akademik Panel"}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {isAdmin
              ? "Kullanıcı, onay ve sınıf durumlarını Firestore üzerinden izleyin."
              : "Sınıflarınızı, duyurularınızı ve materyallerinizi web üzerinden yönetin."}
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
          {isAdmin
            ? adminStatCards.map((card) => (
                <article
                  key={card.key}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-sm text-zinc-400">{card.label}</p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                    {adminStats?.[card.key] ?? 0}
                  </p>
                </article>
              ))
            : academicStatCards.map((card) => (
                <article
                  key={card.key}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-sm text-zinc-400">{card.label}</p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                    {academicStats?.[card.key] ?? 0}
                  </p>
                </article>
              ))}
        </div>
      )}
    </section>
  );
}
