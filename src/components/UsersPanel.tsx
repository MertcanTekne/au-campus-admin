"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchUsers,
  formatDate,
  getFirestoreErrorMessage,
  getFirestoreWriteErrorMessage,
  updateUserRole,
} from "@/lib/adminData";
import { AdminUser, ROLE_LABELS, USER_ROLES, UserRole } from "@/types/admin";

type UsersPanelProps = {
  currentUid: string;
};

const roleFilterOptions = ["all", ...USER_ROLES] as const;
type RoleFilter = (typeof roleFilterOptions)[number];

function isKnownRole(role: string | undefined): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

function getDisplayName(user: AdminUser) {
  return user.displayName || user.name || "-";
}

export function UsersPanel({ currentUid }: UsersPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadUsers() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      setUsers(await fetchUsers());
    } catch {
      setErrorMessage(getFirestoreErrorMessage());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function loadInitialUsers() {
      try {
        const userList = await fetchUsers();
        if (isMounted) setUsers(userList);
      } catch {
        if (isMounted) setErrorMessage(getFirestoreErrorMessage());
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadInitialUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase("tr-TR");
    return users.filter((user) => {
      const roleMatches = roleFilter === "all" || user.role === roleFilter;
      const searchable = `${user.email} ${user.displayName || ""} ${user.name || ""}`.toLocaleLowerCase("tr-TR");
      return roleMatches && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [roleFilter, searchText, users]);

  async function handleRoleChange(uid: string, role: UserRole) {
    if (uid === currentUid) {
      setErrorMessage("Kendi hesabınızın rolünü değiştiremezsiniz.");
      return;
    }

    setUpdatingUid(uid);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await updateUserRole(uid, role);
      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.uid === uid ? { ...user, role } : user)),
      );
      setSuccessMessage("Kullanıcı rolü güncellendi.");
    } catch {
      setErrorMessage(getFirestoreWriteErrorMessage());
    } finally {
      setUpdatingUid("");
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium text-[#e15b6a]">Kullanıcı Yönetimi</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Kullanıcılar</h2>
          <p className="mt-2 text-sm text-zinc-400">
            İlk MVP için users koleksiyonundan en fazla 250 kayıt okunur.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="h-10 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-50 outline-none placeholder:text-zinc-500 focus:border-[#b21f35]"
            placeholder="E-posta veya isim ara"
          />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
            className="h-10 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-50 outline-none focus:border-[#b21f35]"
          >
            {roleFilterOptions.map((role) => (
              <option key={role} value={role}>
                {role === "all" ? "Tüm roller" : ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={loadUsers}
            disabled={isLoading}
            className="h-10 rounded-md border border-white/15 px-4 text-sm font-semibold text-zinc-100 transition hover:border-[#b21f35] hover:bg-[#b21f35]/10 disabled:opacity-60"
          >
            Yenile
          </button>
        </div>
      </div>

      {errorMessage ? (
        <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {successMessage}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
        {isLoading ? (
          <div className="p-6 text-sm text-zinc-300">Kullanıcılar yükleniyor...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 text-sm text-zinc-300">Kullanıcı bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-4 py-3">E-posta</th>
                  <th className="px-4 py-3">İsim</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Kayıt tarihi</th>
                  <th className="px-4 py-3">UID</th>
                  <th className="px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredUsers.map((user) => {
                  const isSelf = user.uid === currentUid;
                  return (
                    <tr key={user.uid}>
                      <td className="px-4 py-3 text-zinc-100">{user.email || "-"}</td>
                      <td className="px-4 py-3 text-zinc-300">{getDisplayName(user)}</td>
                      <td className="px-4 py-3 text-zinc-300">
                        {isKnownRole(user.role) ? ROLE_LABELS[user.role] : user.role || "-"}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                        {user.uid.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={isKnownRole(user.role) ? user.role : "student"}
                          disabled={isSelf || updatingUid === user.uid}
                          onChange={(event) =>
                            handleRoleChange(user.uid, event.target.value as UserRole)
                          }
                          className="h-9 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-50 outline-none disabled:opacity-50"
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
