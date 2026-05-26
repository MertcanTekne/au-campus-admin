"use client";

import { useEffect, useState } from "react";
import { fetchPendingAcademicUsers, formatDate, getFirestoreErrorMessage, getFirestoreWriteErrorMessage, updateUserRole } from "@/lib/adminData";
import { AdminUser, UserRole } from "@/types/admin";

export function AcademicApprovalsPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadPendingUsers() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      setUsers(await fetchPendingAcademicUsers());
    } catch {
      setErrorMessage(getFirestoreErrorMessage());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function loadInitialPendingUsers() {
      try {
        const pendingUsers = await fetchPendingAcademicUsers();
        if (isMounted) setUsers(pendingUsers);
      } catch {
        if (isMounted) setErrorMessage(getFirestoreErrorMessage());
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadInitialPendingUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDecision(uid: string, role: Extract<UserRole, "academic" | "student">) {
    setUpdatingUid(uid);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await updateUserRole(uid, role);
      setUsers((currentUsers) => currentUsers.filter((user) => user.uid !== uid));
      setSuccessMessage(role === "academic" ? "Kullanıcı akademik olarak onaylandı." : "Kullanıcı öğrenci rolüne çevrildi.");
    } catch {
      setErrorMessage(getFirestoreWriteErrorMessage());
    } finally {
      setUpdatingUid("");
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#e15b6a]">Akademik Onaylar</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Onay Bekleyenler</h2>
          <p className="mt-2 text-sm text-zinc-400">academic_pending rolündeki kullanıcıları değerlendirin.</p>
        </div>
        <button type="button" onClick={loadPendingUsers} disabled={isLoading} className="h-10 rounded-md border border-white/15 px-4 text-sm font-semibold text-zinc-100 transition hover:border-[#b21f35] hover:bg-[#b21f35]/10 disabled:opacity-60">Yenile</button>
      </div>
      {errorMessage ? <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{errorMessage}</p> : null}
      {successMessage ? <p className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{successMessage}</p> : null}
      {isLoading ? <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-sm text-zinc-300">Onay listesi yükleniyor...</div> : users.length === 0 ? <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-sm text-zinc-300">Onay bekleyen akademik kullanıcı yok.</div> : (
        <div className="grid gap-4 xl:grid-cols-2">
          {users.map((user) => (
            <article key={user.uid} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <p className="text-lg font-semibold text-white">{user.displayName || user.name || "İsim bilgisi yok"}</p>
              <p className="mt-1 break-all text-sm text-zinc-300">{user.email || "-"}</p>
              <p className="mt-4 text-sm text-zinc-400">Kayıt tarihi: {formatDate(user.createdAt)}</p>
              <p className="mt-2 break-all font-mono text-xs text-zinc-500">{user.uid}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => handleDecision(user.uid, "academic")} disabled={updatingUid === user.uid} className="h-10 rounded-md bg-[#b21f35] px-4 text-sm font-semibold text-white transition hover:bg-[#c62940] disabled:opacity-60">Akademik olarak onayla</button>
                <button type="button" onClick={() => handleDecision(user.uid, "student")} disabled={updatingUid === user.uid} className="h-10 rounded-md border border-white/15 px-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/5 disabled:opacity-60">Öğrenciye çevir</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
