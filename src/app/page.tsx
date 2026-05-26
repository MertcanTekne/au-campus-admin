"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { AcademicApprovalsPanel } from "@/components/AcademicApprovalsPanel";
import { AdminLayout } from "@/components/AdminLayout";
import { ClassesPanel } from "@/components/ClassesPanel";
import { DashboardOverview } from "@/components/DashboardOverview";
import { UsersPanel } from "@/components/UsersPanel";
import { auth, db } from "@/lib/firebase";
import { AdminSection } from "@/types/admin";

type AuthStatus = "checking" | "signed-out" | "checking-role" | "admin" | "unauthorized";

function getTurkishAuthError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  if (code === "auth/invalid-email") return "Lütfen geçerli bir e-posta adresi girin.";
  if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") return "E-posta veya şifre hatalı.";
  if (code === "auth/too-many-requests") return "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.";

  return "Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.";
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBusy = useMemo(
    () => status === "checking" || status === "checking-role" || isSubmitting,
    [isSubmitting, status],
  );

  async function checkAdminRole(user: User) {
    setStatus("checking-role");
    setErrorMessage("");

    try {
      const userSnapshot = await getDoc(doc(db, "users", user.uid));
      const role = userSnapshot.exists() ? userSnapshot.data().role : null;

      if (role === "admin") {
        setStatus("admin");
        return;
      }

      setStatus("unauthorized");
      setErrorMessage("Bu panele erişim yetkiniz yok.");
    } catch {
      setStatus("unauthorized");
      setErrorMessage("Yetki bilgisi okunamadı. Lütfen daha sonra tekrar deneyin.");
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (!user) {
        setStatus("signed-out");
        setErrorMessage("");
        return;
      }

      void checkAdminRole(user);
    });

    return unsubscribe;
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      setCurrentUser(credential.user);
      await checkAdminRole(credential.user);
    } catch (error) {
      setStatus("signed-out");
      setErrorMessage(getTurkishAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await signOut(auth);
      setEmail("");
      setPassword("");
      setCurrentUser(null);
      setStatus("signed-out");
      setActiveSection("dashboard");
    } catch {
      setErrorMessage("Çıkış yapılırken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "admin" && currentUser) {
    return (
      <AdminLayout activeSection={activeSection} adminEmail={currentUser.email} isBusy={isBusy} onLogout={handleLogout} onSectionChange={setActiveSection}>
        {activeSection === "dashboard" ? <DashboardOverview /> : null}
        {activeSection === "users" ? <UsersPanel currentUid={currentUser.uid} /> : null}
        {activeSection === "approvals" ? <AcademicApprovalsPanel /> : null}
        {activeSection === "classes" ? <ClassesPanel authorUid={currentUser.uid} authorEmail={currentUser.email || ""} /> : null}
      </AdminLayout>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b21f35]">AÜ Campus</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Admin Panel</h1>
          </div>
          {currentUser ? (
            <button type="button" onClick={handleLogout} disabled={isBusy} className="rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-[#b21f35] hover:bg-[#b21f35]/10 disabled:cursor-not-allowed disabled:opacity-60">
              Çıkış Yap
            </button>
          ) : null}
        </header>

        <section className="flex flex-1 items-center justify-center py-10">
          {status === "checking" || status === "checking-role" ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] px-6 py-5 text-sm text-zinc-300">
              {status === "checking" ? "Oturum kontrol ediliyor..." : "Yetki kontrol ediliyor..."}
            </div>
          ) : null}

          {status === "signed-out" ? (
            <form onSubmit={handleLogin} className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/30">
              <div className="mb-7">
                <p className="text-sm font-medium text-[#e15b6a]">Yönetici girişi</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">AÜ Campus Admin</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">Devam etmek için Firebase hesabınızla giriş yapın.</p>
              </div>
              <label className="block text-sm font-medium text-zinc-200" htmlFor="email">E-posta</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-md border border-white/10 bg-zinc-900 px-4 text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-[#b21f35] focus:ring-2 focus:ring-[#b21f35]/30" placeholder="admin@ornek.edu.tr" />
              <label className="mt-5 block text-sm font-medium text-zinc-200" htmlFor="password">Şifre</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-md border border-white/10 bg-zinc-900 px-4 text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-[#b21f35] focus:ring-2 focus:ring-[#b21f35]/30" placeholder="Şifreniz" />
              {errorMessage ? <p className="mt-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{errorMessage}</p> : null}
              <button type="submit" disabled={isBusy} className="mt-6 h-12 w-full rounded-md bg-[#b21f35] px-5 text-sm font-semibold text-white transition hover:bg-[#c62940] disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </form>
          ) : null}

          {status === "unauthorized" ? (
            <div className="w-full max-w-lg rounded-lg border border-red-500/25 bg-red-500/10 p-6 text-center">
              <h2 className="text-2xl font-semibold text-white">Erişim reddedildi</h2>
              <p className="mt-3 text-sm leading-6 text-red-100">{errorMessage || "Bu panele erişim yetkiniz yok."}</p>
              <button type="button" onClick={handleLogout} disabled={isBusy} className="mt-6 rounded-md bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60">
                Çıkış Yap
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
