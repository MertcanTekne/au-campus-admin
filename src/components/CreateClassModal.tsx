"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createClass,
  fetchAcademicUsers,
  getFirestoreErrorMessage,
  getFirestoreWriteErrorMessage,
} from "@/lib/adminData";
import { AdminUser, CreateClassInput } from "@/types/admin";

type CreateClassModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const emptyForm: CreateClassInput = {
  className: "",
  courseCode: "",
  section: "",
  term: "",
  description: "",
  instructorUid: "",
  instructorEmail: "",
  isActive: true,
};

export function CreateClassModal({ isOpen, onClose, onCreated }: CreateClassModalProps) {
  const [form, setForm] = useState<CreateClassInput>(emptyForm);
  const [academicUsers, setAcademicUsers] = useState<AdminUser[]>([]);
  const [selectedAcademicUid, setSelectedAcademicUid] = useState("");
  const [isLoadingAcademics, setIsLoadingAcademics] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;
    async function loadAcademicUsers() {
      setIsLoadingAcademics(true);
      setErrorMessage("");
      try {
        const users = await fetchAcademicUsers();
        if (isMounted) setAcademicUsers(users);
      } catch {
        if (isMounted) setErrorMessage(getFirestoreErrorMessage());
      } finally {
        if (isMounted) setIsLoadingAcademics(false);
      }
    }

    void loadAcademicUsers();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateField<K extends keyof CreateClassInput>(key: K, value: CreateClassInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleAcademicSelect(uid: string) {
    setSelectedAcademicUid(uid);
    const selectedUser = academicUsers.find((user) => user.uid === uid);

    if (selectedUser) {
      setForm((current) => ({
        ...current,
        instructorUid: selectedUser.uid,
        instructorEmail: selectedUser.email,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (
      !form.className.trim() ||
      !form.courseCode.trim() ||
      !form.section.trim() ||
      !form.term.trim() ||
      !form.instructorUid.trim() ||
      !form.instructorEmail.trim()
    ) {
      setErrorMessage("Ders adı, ders kodu, şube, dönem, eğitmen UID ve eğitmen email alanları zorunludur.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createClass({
        ...form,
        className: form.className.trim(),
        courseCode: form.courseCode.trim(),
        section: form.section.trim(),
        term: form.term.trim(),
        description: form.description.trim(),
        instructorUid: form.instructorUid.trim(),
        instructorEmail: form.instructorEmail.trim(),
      });
      setForm(emptyForm);
      setSelectedAcademicUid("");
      onCreated();
      onClose();
    } catch {
      setErrorMessage(getFirestoreWriteErrorMessage());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl rounded-lg border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/40"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#e15b6a]">Sınıf Yönetimi</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Yeni Sınıf Oluştur</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-100 hover:bg-white/5">
            Kapat
          </button>
        </div>

        {errorMessage ? <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{errorMessage}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-200">Ders adı<input value={form.className} onChange={(event) => updateField("className", event.target.value)} className="mt-2 h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-zinc-50 outline-none focus:border-[#b21f35]" /></label>
          <label className="text-sm text-zinc-200">Ders kodu<input value={form.courseCode} onChange={(event) => updateField("courseCode", event.target.value)} className="mt-2 h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-zinc-50 outline-none focus:border-[#b21f35]" /></label>
          <label className="text-sm text-zinc-200">Şube<input value={form.section} onChange={(event) => updateField("section", event.target.value)} className="mt-2 h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-zinc-50 outline-none focus:border-[#b21f35]" /></label>
          <label className="text-sm text-zinc-200">Dönem<input value={form.term} onChange={(event) => updateField("term", event.target.value)} className="mt-2 h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-zinc-50 outline-none focus:border-[#b21f35]" /></label>
          <label className="md:col-span-2 text-sm text-zinc-200">Açıklama<textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={3} className="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none focus:border-[#b21f35]" /></label>
        </div>

        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <label className="text-sm text-zinc-200">
            Akademik personel
            <select value={selectedAcademicUid} onChange={(event) => handleAcademicSelect(event.target.value)} disabled={isLoadingAcademics || academicUsers.length === 0} className="mt-2 h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-zinc-50 outline-none focus:border-[#b21f35] disabled:opacity-60">
              <option value="">{academicUsers.length === 0 ? "Akademik kullanıcı yok, manuel girin" : "Akademik personel seçin"}</option>
              {academicUsers.map((user) => <option key={user.uid} value={user.uid}>{user.email || user.uid}</option>)}
            </select>
          </label>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-zinc-200">Eğitmen UID<input value={form.instructorUid} onChange={(event) => updateField("instructorUid", event.target.value)} className="mt-2 h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-zinc-50 outline-none focus:border-[#b21f35]" /></label>
            <label className="text-sm text-zinc-200">Eğitmen email<input value={form.instructorEmail} onChange={(event) => updateField("instructorEmail", event.target.value)} className="mt-2 h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-zinc-50 outline-none focus:border-[#b21f35]" /></label>
          </div>
        </div>

        <label className="mt-5 flex items-center gap-3 text-sm text-zinc-200">
          <input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} className="h-4 w-4 accent-[#b21f35]" />
          Aktif sınıf olarak oluştur
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-white/15 px-4 text-sm font-semibold text-zinc-100 hover:bg-white/5">Vazgeç</button>
          <button type="submit" disabled={isSubmitting} className="h-10 rounded-md bg-[#b21f35] px-4 text-sm font-semibold text-white transition hover:bg-[#c62940] disabled:opacity-60">
            {isSubmitting ? "Oluşturuluyor..." : "Sınıf Oluştur"}
          </button>
        </div>
      </form>
    </div>
  );
}
