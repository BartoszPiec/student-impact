"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

type ProfileRow = {
  user_id: string;
  role: string | null;
  public_name: string | null;
  imie: string | null;
  nazwisko: string | null;
  created_at: string;
};

type RoleFilter = "all" | "student" | "company" | "admin";
type SortOption = "created_desc" | "created_asc";

function getDisplayName(profile: ProfileRow) {
  const fallbackName = [profile.imie, profile.nazwisko].filter(Boolean).join(" ").trim();
  return profile.public_name || fallbackName || `Uzytkownik ${profile.user_id.slice(0, 8)}`;
}

function getRoleBadge(role: string | null) {
  if (role === "admin") {
    return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
  }

  if (role === "company") {
    return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
  }

  if (role === "student") {
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  }

  return "bg-slate-500/10 text-slate-400 border border-white/10";
}

export function UsersTable({ users }: { users: ProfileRow[] }) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("created_desc");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filteredUsers = users
    .filter((profile) => {
      if (roleFilter !== "all" && profile.role !== roleFilter) {
        return false;
      }

      if (!deferredSearch) {
        return true;
      }

      const searchable = [
        getDisplayName(profile),
        profile.imie || "",
        profile.nazwisko || "",
        profile.role || "",
        profile.user_id,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(deferredSearch);
    })
    .sort((left, right) => {
      const leftTs = new Date(left.created_at).getTime();
      const rightTs = new Date(right.created_at).getTime();
      return sortBy === "created_asc" ? leftTs - rightTs : rightTs - leftTs;
    });

  return (
    <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl overflow-hidden backdrop-blur-sm">
      <div className="border-b border-white/5 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-400">
              Widoczne profile ({filteredUsers.length} / {users.length})
            </span>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Szukaj po nazwie, roli lub ID"
              className="h-10 min-w-[240px] border-white/10 bg-slate-900/60 text-white placeholder:text-slate-500"
            />

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              className="h-10 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm font-bold text-slate-200 outline-none"
            >
              <option value="all">Wszystkie role</option>
              <option value="student">Studenci</option>
              <option value="company">Firmy</option>
              <option value="admin">Admini</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-10 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm font-bold text-slate-200 outline-none"
            >
              <option value="created_desc">Najnowsze</option>
              <option value="created_asc">Najstarsze</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 bg-slate-950/20">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Data
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Uzytkownik
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Rola
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Imie
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Nazwisko
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                ID
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                Szczegoly
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                      <Users className="h-8 w-8 text-slate-700" />
                    </div>
                    <p className="font-bold text-slate-500">
                      Brak profili pasujacych do wybranych filtrow.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((profile) => (
                <tr key={profile.user_id} className="transition-colors hover:bg-white/5">
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm font-bold text-slate-300">
                      {format(new Date(profile.created_at), "d MMM yyyy", { locale: pl })}
                    </span>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      {format(new Date(profile.created_at), "HH:mm")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-white">{getDisplayName(profile)}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      profiles.public_name fallback
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getRoleBadge(profile.role)}`}
                    >
                      {profile.role || "brak"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{profile.imie || "-"}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {profile.nazwisko || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-[10px] text-slate-500">
                      {profile.user_id}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/app/admin/users/${profile.user_id}`}
                      className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition-all hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white"
                    >
                      Otworz profil
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
