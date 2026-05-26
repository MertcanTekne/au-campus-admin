"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  addAnnouncement,
  addMaterial,
  deleteAnnouncement,
  deleteMaterial,
  fetchClassDetail,
  formatDate,
  getFirestoreErrorMessage,
  getFirestoreWriteErrorMessage,
  updateClassActiveState,
} from "@/lib/adminData";
import { CampusClass, ClassDetail } from "@/types/admin";

type ClassDetailPanelProps = {
  selectedClass: CampusClass;
  authorUid: string;
  authorEmail: string;
  onClose: () => void;
  onClassUpdated: (updatedClass: CampusClass) => void;
};

type MaterialType = "text" | "link";

export function ClassDetailPanel({
  selectedClass,
  authorUid,
  authorEmail,
  onClose,
  onClassUpdated,
}: ClassDetailPanelProps) {
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialType, setMaterialType] = useState<MaterialType>("text");
  const [materialContent, setMaterialContent] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingClass, setIsUpdatingClass] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadDetail() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      setDetail(await fetchClassDetail(selectedClass.id));
    } catch {
      setErrorMessage(getFirestoreErrorMessage());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function loadInitialDetail() {
      try {
        const classDetail = await fetchClassDetail(selectedClass.id);
        if (isMounted) {
          setDetail(classDetail);
          setErrorMessage("");
          setSuccessMessage("");
        }
      } catch {
        if (isMounted) setErrorMessage(getFirestoreErrorMessage());
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadInitialDetail();
    return () => {
      isMounted = false;
    };
  }, [selectedClass.id]);

  async function handleToggleActive() {
    setIsUpdatingClass(true);
    setErrorMessage("");
    setSuccessMessage("");
    const nextState = !selectedClass.isActive;
    try {
      await updateClassActiveState(selectedClass.id, nextState);
      onClassUpdated({ ...selectedClass, isActive: nextState });
      setSuccessMessage(nextState ? "Sınıf aktif hale getirildi." : "Sınıf pasif hale getirildi.");
    } catch {
      setErrorMessage(getFirestoreWriteErrorMessage());
    } finally {
      setIsUpdatingClass(false);
    }
  }

  async function handleCopyJoinCode() {
    if (!selectedClass.joinCode) {
      setErrorMessage("Bu sınıf için katılım kodu bulunamadı.");
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedClass.joinCode);
      setSuccessMessage("Katılım kodu kopyalandı.");
    } catch {
      setErrorMessage("Katılım kodu kopyalanamadı. Tarayıcı izinlerini kontrol edin.");
    }
  }

  async function handleAnnouncementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      setErrorMessage("Duyuru başlığı ve içeriği zorunludur.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addAnnouncement(selectedClass.id, {
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        authorUid,
        authorEmail,
      });
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setSuccessMessage("Duyuru eklendi.");
      await loadDetail();
    } catch {
      setErrorMessage(getFirestoreWriteErrorMessage());
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMaterialSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!materialTitle.trim()) {
      setErrorMessage("Materyal başlığı zorunludur.");
      return;
    }
    if (materialType === "link" && !materialUrl.trim()) {
      setErrorMessage("Link türündeki materyaller için URL zorunludur.");
      return;
    }
    if (materialType === "text" && !materialContent.trim()) {
      setErrorMessage("Text türündeki materyaller için içerik zorunludur.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addMaterial(selectedClass.id, {
        title: materialTitle.trim(),
        type: materialType,
        content: materialContent.trim(),
        url: materialUrl.trim(),
        authorUid,
        authorEmail,
      });
      setMaterialTitle("");
      setMaterialContent("");
      setMaterialUrl("");
      setSuccessMessage("Materyal eklendi.");
      await loadDetail();
    } catch {
      setErrorMessage(getFirestoreWriteErrorMessage());
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteAnnouncement(announcementId: string) {
    if (!window.confirm("Bu duyuruyu silmek istediğinizden emin misiniz?")) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await deleteAnnouncement(selectedClass.id, announcementId);
      setSuccessMessage("Duyuru silindi.");
      await loadDetail();
    } catch {
      setErrorMessage(getFirestoreWriteErrorMessage());
    }
  }

  async function handleDeleteMaterial(materialId: string) {
    if (!window.confirm("Bu materyali silmek istediğinizden emin misiniz?")) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await deleteMaterial(selectedClass.id, materialId);
      setSuccessMessage("Materyal silindi.");
      await loadDetail();
    } catch {
      setErrorMessage(getFirestoreWriteErrorMessage());
    }
  }

  return (
    <aside className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#e15b6a]">Sınıf detayı</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{selectedClass.className || selectedClass.courseCode || "Sınıf"}</h3>
        </div>
        <button type="button" onClick={onClose} className="rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-100 hover:bg-white/5">Kapat</button>
      </div>

      {errorMessage ? <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{errorMessage}</p> : null}
      {successMessage ? <p className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{successMessage}</p> : null}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-zinc-500">Ders kodu</dt><dd className="mt-1 text-zinc-100">{selectedClass.courseCode || "-"}</dd></div>
        <div><dt className="text-zinc-500">Şube</dt><dd className="mt-1 text-zinc-100">{selectedClass.section || "-"}</dd></div>
        <div><dt className="text-zinc-500">Dönem</dt><dd className="mt-1 text-zinc-100">{selectedClass.term || "-"}</dd></div>
        <div><dt className="text-zinc-500">Eğitmen</dt><dd className="mt-1 break-all text-zinc-100">{selectedClass.instructorEmail || "-"}</dd></div>
        <div>
          <dt className="text-zinc-500">Katılım kodu</dt>
          <dd className="mt-1 flex items-center gap-2">
            <span className="font-mono text-zinc-100">{selectedClass.joinCode || "-"}</span>
            <button type="button" onClick={handleCopyJoinCode} className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-100 hover:bg-white/5">Kopyala</button>
          </dd>
        </div>
        <div><dt className="text-zinc-500">Katılımcı sayısı</dt><dd className="mt-1 text-zinc-100">{isLoading ? "Yükleniyor..." : detail?.memberCount ?? 0}</dd></div>
      </dl>

      <button type="button" onClick={handleToggleActive} disabled={isUpdatingClass} className="mt-5 h-10 rounded-md bg-[#b21f35] px-4 text-sm font-semibold text-white transition hover:bg-[#c62940] disabled:opacity-60">
        {selectedClass.isActive ? "Pasif Yap" : "Aktif Yap"}
      </button>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Duyurular</h4>
          <form onSubmit={handleAnnouncementSubmit} className="mt-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
            <input value={announcementTitle} onChange={(event) => setAnnouncementTitle(event.target.value)} placeholder="Başlık" className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-50 outline-none placeholder:text-zinc-500 focus:border-[#b21f35]" />
            <textarea value={announcementContent} onChange={(event) => setAnnouncementContent(event.target.value)} placeholder="İçerik" rows={3} className="mt-3 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none placeholder:text-zinc-500 focus:border-[#b21f35]" />
            <button type="submit" disabled={isSubmitting} className="mt-3 h-9 rounded-md bg-[#b21f35] px-3 text-sm font-semibold text-white disabled:opacity-60">Duyuru Ekle</button>
          </form>
          <div className="mt-3 grid gap-3">
            {isLoading ? <p className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">Duyurular yükleniyor...</p> : detail?.announcements.length ? detail.announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3"><p className="font-medium text-white">{announcement.title || "Duyuru"}</p><button type="button" onClick={() => handleDeleteAnnouncement(announcement.id)} className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-100 hover:bg-red-500/10">Sil</button></div>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{announcement.content || "İçerik yok."}</p>
                <p className="mt-3 text-xs text-zinc-500">{formatDate(announcement.createdAt)}</p>
              </article>
            )) : <p className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">Bu sınıfta duyuru yok.</p>}
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Materyaller</h4>
          <form onSubmit={handleMaterialSubmit} className="mt-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
            <input value={materialTitle} onChange={(event) => setMaterialTitle(event.target.value)} placeholder="Başlık" className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-50 outline-none placeholder:text-zinc-500 focus:border-[#b21f35]" />
            <select value={materialType} onChange={(event) => setMaterialType(event.target.value as MaterialType)} className="mt-3 h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-50 outline-none focus:border-[#b21f35]"><option value="text">Text</option><option value="link">Link</option></select>
            <textarea value={materialContent} onChange={(event) => setMaterialContent(event.target.value)} placeholder="İçerik / açıklama" rows={3} className="mt-3 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none placeholder:text-zinc-500 focus:border-[#b21f35]" />
            <input value={materialUrl} onChange={(event) => setMaterialUrl(event.target.value)} placeholder="URL" className="mt-3 h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-50 outline-none placeholder:text-zinc-500 focus:border-[#b21f35]" />
            <button type="submit" disabled={isSubmitting} className="mt-3 h-9 rounded-md bg-[#b21f35] px-3 text-sm font-semibold text-white disabled:opacity-60">Materyal Ekle</button>
          </form>
          <div className="mt-3 grid gap-3">
            {isLoading ? <p className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">Materyaller yükleniyor...</p> : detail?.materials.length ? detail.materials.map((material) => (
              <article key={material.id} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3"><p className="font-medium text-white">{material.title || "Materyal"}</p><button type="button" onClick={() => handleDeleteMaterial(material.id)} className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-100 hover:bg-red-500/10">Sil</button></div>
                <p className="mt-2 text-sm text-zinc-300">{material.type || "Tür yok"}</p>
                {material.content ? <p className="mt-2 text-sm leading-6 text-zinc-300">{material.content}</p> : null}
                {material.url ? <p className="mt-2 break-all text-sm text-[#ffb3bd]">{material.url}</p> : null}
                <p className="mt-3 text-xs text-zinc-500">{formatDate(material.createdAt)}</p>
              </article>
            )) : <p className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">Bu sınıfta materyal yok.</p>}
          </div>
        </section>
      </div>
    </aside>
  );
}
