"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchClasses, formatDate, getFirestoreErrorMessage, getFirestoreWriteErrorMessage, updateClassActiveState } from "@/lib/adminData";
import { CampusClass } from "@/types/admin";
import { ClassDetailPanel } from "@/components/ClassDetailPanel";
import { CreateClassModal } from "@/components/CreateClassModal";

type ActiveFilter = "all" | "active" | "inactive";

type ClassesPanelProps = {
  authorUid: string;
  authorEmail: string;
};

export function ClassesPanel({ authorUid, authorEmail }: ClassesPanelProps) {
  const [classes, setClasses] = useState<CampusClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<CampusClass | null>(null);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingClassId, setUpdatingClassId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadClasses() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const classList = await fetchClasses();
      setClasses(classList);
      setSelectedClass((currentSelected) =>
        currentSelected ? classList.find((campusClass) => campusClass.id === currentSelected.id) || null : null,
      );
    } catch {
      setErrorMessage(getFirestoreErrorMessage());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function loadInitialClasses() {
      try {
        const classList = await fetchClasses();
        if (isMounted) setClasses(classList);
      } catch {
        if (isMounted) setErrorMessage(getFirestoreErrorMessage());
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadInitialClasses();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredClasses = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase("tr-TR");
    return classes.filter((campusClass) => {
      const searchable = [campusClass.className, campusClass.courseCode, campusClass.instructorEmail].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
      const searchMatches = !normalizedSearch || searchable.includes(normalizedSearch);
      const activeMatches = activeFilter === "all" || (activeFilter === "active" && campusClass.isActive === true) || (activeFilter === "inactive" && campusClass.isActive === false);
      return searchMatches && activeMatches;
    });
  }, [activeFilter, classes, searchText]);

  function applyUpdatedClass(updatedClass: CampusClass) {
    setClasses((currentClasses) =>
      currentClasses.map((campusClass) => (campusClass.id === updatedClass.id ? updatedClass : campusClass)),
    );
    setSelectedClass(updatedClass);
  }

  async function handleToggleActive(campusClass: CampusClass) {
    const nextState = !campusClass.isActive;
    setUpdatingClassId(campusClass.id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await updateClassActiveState(campusClass.id, nextState);
      const updatedClass = { ...campusClass, isActive: nextState };
      applyUpdatedClass(updatedClass);
      setSuccessMessage(nextState ? "Sınıf aktif hale getirildi." : "Sınıf pasif hale getirildi.");
    } catch {
      setErrorMessage(getFirestoreWriteErrorMessage());
    } finally {
      setUpdatingClassId("");
    }
  }

  async function handleClassCreated() {
    setSuccessMessage("Sınıf oluşturuldu.");
    await loadClasses();
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium text-[#e15b6a]">Sınıf Yönetimi</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Sınıflar</h2>
          <p className="mt-2 text-sm text-zinc-400">Sınıfları görüntüleyin, oluşturun ve akademik içerikleri yönetin.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto_auto]">
          <input value={searchText} onChange={(event) => setSearchText(event.target.value)} className="h-10 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-50 outline-none placeholder:text-zinc-500 focus:border-[#b21f35]" placeholder="Ders adı, kod veya eğitmen ara" />
          <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)} className="h-10 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-50 outline-none focus:border-[#b21f35]"><option value="all">Tüm sınıflar</option><option value="active">Aktif</option><option value="inactive">Pasif</option></select>
          <button type="button" onClick={loadClasses} disabled={isLoading} className="h-10 rounded-md border border-white/15 px-4 text-sm font-semibold text-zinc-100 transition hover:border-[#b21f35] hover:bg-[#b21f35]/10 disabled:opacity-60">Yenile</button>
          <button type="button" onClick={() => setIsCreateModalOpen(true)} className="h-10 rounded-md bg-[#b21f35] px-4 text-sm font-semibold text-white transition hover:bg-[#c62940]">Yeni Sınıf Oluştur</button>
        </div>
      </div>

      {errorMessage ? <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{errorMessage}</p> : null}
      {successMessage ? <p className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{successMessage}</p> : null}

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_560px]">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
          {isLoading ? <div className="p-6 text-sm text-zinc-300">Sınıflar yükleniyor...</div> : filteredClasses.length === 0 ? <div className="p-6 text-sm text-zinc-300">Sınıf bulunamadı.</div> : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wide text-zinc-400"><tr><th className="px-4 py-3">Sınıf</th><th className="px-4 py-3">Kod</th><th className="px-4 py-3">Şube</th><th className="px-4 py-3">Dönem</th><th className="px-4 py-3">Eğitmen</th><th className="px-4 py-3">Katılım</th><th className="px-4 py-3">Durum</th><th className="px-4 py-3">Kayıt</th><th className="px-4 py-3">İşlem</th></tr></thead>
                <tbody className="divide-y divide-white/10">
                  {filteredClasses.map((campusClass) => (
                    <tr key={campusClass.id} className="align-top">
                      <td className="px-4 py-3 font-medium text-white">{campusClass.className || campusClass.courseCode || "İsimsiz sınıf"}</td>
                      <td className="px-4 py-3 text-zinc-300">{campusClass.courseCode || "-"}</td>
                      <td className="px-4 py-3 text-zinc-300">{campusClass.section || "-"}</td>
                      <td className="px-4 py-3 text-zinc-300">{campusClass.term || "-"}</td>
                      <td className="px-4 py-3 break-all text-zinc-300">{campusClass.instructorEmail || "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">{campusClass.joinCode || "-"}</td>
                      <td className="px-4 py-3"><span className={`rounded-md px-2 py-1 text-xs font-medium ${campusClass.isActive ? "bg-emerald-500/15 text-emerald-100" : "bg-zinc-500/15 text-zinc-300"}`}>{campusClass.isActive ? "Aktif" : "Pasif"}</span></td>
                      <td className="px-4 py-3 text-zinc-300">{formatDate(campusClass.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setSelectedClass(campusClass)} className="rounded-md bg-[#b21f35] px-3 py-2 text-xs font-semibold text-white hover:bg-[#c62940]">Aç</button>
                          <button type="button" onClick={() => handleToggleActive(campusClass)} disabled={updatingClassId === campusClass.id} className="rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/5 disabled:opacity-60">{campusClass.isActive ? "Pasif" : "Aktif"}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedClass ? (
          <ClassDetailPanel selectedClass={selectedClass} authorUid={authorUid} authorEmail={authorEmail} onClose={() => setSelectedClass(null)} onClassUpdated={applyUpdatedClass} />
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm text-zinc-400">Detayları görmek için bir sınıf seçin.</div>
        )}
      </div>

      <CreateClassModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreated={handleClassCreated} />
    </section>
  );
}
