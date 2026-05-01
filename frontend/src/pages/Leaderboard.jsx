import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { api } from "../services/api.js";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/users/leaderboard")
      .then(({ data }) => setUsers(data.users))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="panel rounded-lg p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase text-mint">Ranking</p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-black"><Trophy size={30} /> Leaderboard</h1>
          </div>
          <p className="text-sm font-semibold text-ink/55">Diurutkan berdasarkan winrate, lalu total win.</p>
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-ink/10 bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-ink text-white">
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
                <tr><td className="px-4 py-5 text-center font-semibold text-ink/50" colSpan="6">Loading...</td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td className="px-4 py-5 text-center font-semibold text-ink/50" colSpan="6">Belum ada data leaderboard.</td></tr>
              )}
              {users.map((user, index) => (
                <tr key={user._id} className="border-t border-ink/10">
                  <td className="px-4 py-3 font-black">#{index + 1}</td>
                  <td className="px-4 py-3 font-bold">{user.username}</td>
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
