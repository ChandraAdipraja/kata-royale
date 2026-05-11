import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Crown, Medal, Trophy } from "lucide-react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const sortLeaderboardUsers = (leaderboardUsers) =>
  [...leaderboardUsers].sort((firstUser, secondUser) => {
    const winDiff = Number(secondUser.win || 0) - Number(firstUser.win || 0);
    if (winDiff !== 0) return winDiff;
    return Number(secondUser.totalValidWords || 0) - Number(firstUser.totalValidWords || 0);
  });

export default function Leaderboard() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(authUser);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/users/leaderboard")
      .then(({ data }) => setUsers(sortLeaderboardUsers(data.users || [])))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!authUser) return;
    api.get("/users/profile").then(({ data }) => setUser(data.user));
  }, [authUser]);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link
        to={user ? "/dashboard" : "/"}
        className="inline-flex rounded-xl bg-slate-800 p-3 text-white transition hover:bg-slate-700"
      >
        <ArrowRight className="rotate-180" size={24} />
      </Link>
      <section className="game-surface mt-4 rounded-2xl p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="section-kicker"><Medal size={15} /> Ranking</p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-white">
              <Trophy size={30} className="text-yellow-400" /> Leaderboard
            </h1>
          </div>
        </div>

        {!loading && users.length > 0 && (
          <section className="mt-6 grid gap-3 md:grid-cols-3">
            {users.slice(0, 3).map((leader, index) => (
              <article
                className={`rounded-2xl border p-5 text-center ${
                  index === 0
                    ? "border-yellow-300/40 bg-yellow-400/15"
                    : index === 1
                      ? "border-slate-300/30 bg-slate-300/10"
                      : "border-amber-600/35 bg-amber-600/10"
                }`}
                key={leader._id}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-950/70 text-yellow-300">
                  <Crown size={26} fill="currentColor" />
                </div>
                <div className="mt-3 truncate text-xl font-black text-white">{leader.username}</div>
                <div className="mt-2 text-sm font-bold text-slate-300">{leader.win || 0} win</div>
              </article>
            ))}
          </section>
        )}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/70">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead className="bg-slate-950 text-slate-300">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Total Win</th>
                <th className="px-4 py-3">Total Valid Words</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    className="px-4 py-5 text-center font-semibold text-slate-500"
                    colSpan="4"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-5 text-center font-semibold text-slate-500"
                    colSpan="4"
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
                    {index === 0 && <Crown size={18} className="inline text-yellow-400" />}
                    {index === 1 && <Crown size={18} className="inline text-slate-300" />}
                    {index === 2 && <Crown size={18} className="inline text-amber-600" />}
                    {index > 2 && `#${index + 1}`}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">
                    {user.username}
                  </td>
                  <td className="px-4 py-3">{user.win}</td>
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
