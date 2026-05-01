import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Crown, Trophy } from "lucide-react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Leaderboard() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(authUser);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/users/leaderboard")
      .then(({ data }) => setUsers(data.users))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!authUser) return;
    api.get("/users/profile").then(({ data }) => setUser(data.user));
  }, [authUser]);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="panel rounded-2xl p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex items-start gap-4">
            <Link
              to={user ? "/dashboard" : "/"}
              className="rounded-xl bg-slate-800 p-3 text-white transition hover:bg-slate-700"
            >
              <ArrowRight className="rotate-180" size={24} />
            </Link>
            <div>
              <p className="text-sm font-black uppercase text-yellow-300">
                Ranking
              </p>
              <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-white">
                <Trophy size={30} className="text-yellow-400" /> Leaderboard
              </h1>
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-400">
            Diurutkan berdasarkan winrate, lalu total win.
          </p>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/70">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-slate-950 text-slate-300">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Total Win</th>
                <th className="px-4 py-3">Total Match</th>
                <th className="px-4 py-3">Winrate</th>
                <th className="px-4 py-3">Total Valid Words</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    className="px-4 py-5 text-center font-semibold text-slate-500"
                    colSpan="6"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-5 text-center font-semibold text-slate-500"
                    colSpan="6"
                  >
                    Belum ada data leaderboard.
                  </td>
                </tr>
              )}
              {users.map((user, index) => (
                <tr
                  key={user._id}
                  className="border-t border-slate-700 text-slate-300 transition hover:bg-white/5"
                >
                  <td className="px-4 py-3 font-black text-yellow-300">
                    {index < 3 ? (
                      <Crown size={18} className="inline" />
                    ) : (
                      `#${index + 1}`
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">
                    {user.username}
                  </td>
                  <td className="px-4 py-3">{user.win}</td>
                  <td className="px-4 py-3">{user.totalMatch}</td>
                  <td className="px-4 py-3">{user.winrate}%</td>
                  <td className="px-4 py-3">{user.totalValidWords}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
