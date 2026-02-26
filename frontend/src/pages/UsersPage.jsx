import { Search, Star, Trophy, Activity, Medal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Loader from "../components/Loader";
import { formatDate } from "../utils/format";

function formatActivity(value) {
  if (!value) return "Hali yuborish yo'q";
  return formatDate(value);
}

export default function UsersPage() {
  const [users, setUsers] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("/dashboard/users").then((response) => setUsers(response.data.users));
  }, []);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) =>
      [user.displayName, user.username]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized))
    );
  }, [users, query]);

  if (!users) {
    return <Loader label="Foydalanuvchilar yuklanmoqda..." />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-6 shadow-glow">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Reyting</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-50">Foydalanuvchilar</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Platformadagi foydalanuvchilar reyting, yechilgan masalalar va so'nggi faollik bo'yicha saralangan.
            </p>
          </div>

          <div className="flex w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="flex items-center border-r border-slate-800 px-4 text-sky-300">
              <Search className="h-5 w-5" />
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ism yoki username bo'yicha izlash..."
              className="w-full bg-transparent px-4 py-3 text-sm text-slate-100 outline-none"
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/80 shadow-glow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-[0.24em] text-slate-400">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Foydalanuvchi</th>
                <th className="px-6 py-4">Reyting</th>
                <th className="px-6 py-4">Tizimdagi o'rni</th>
                <th className="px-6 py-4">Yechilgan</th>
                <th className="px-6 py-4">Faolligi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-900/60">
                  <td className="px-6 py-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-sky-500/20 bg-sky-500/10 text-lg font-semibold text-slate-50">
                      {user.leaderboardRank}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-200">
                        <Medal className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-cyan-300">{user.displayName}</p>
                        <p className="mt-1 text-sm text-slate-400">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 text-lg font-semibold text-slate-50">
                        <Trophy className="h-5 w-5 text-amber-300" />
                        {user.rating}
                      </div>
                      <p className="text-sm text-slate-500">RoboRating</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center gap-2 text-lg font-semibold text-slate-50">
                      <Star className="h-5 w-5 text-amber-300" />
                      {user.platformRank}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center gap-2 text-lg font-semibold text-slate-50">
                      <Activity className="h-5 w-5 text-emerald-300" />
                      {user.solved}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{user.totalSubmissions} ta yuborish</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                      {formatActivity(user.lastSubmissionAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
