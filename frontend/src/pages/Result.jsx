import { Link, useLocation, useParams } from "react-router-dom";
import { Crown, Home, Plus, Trophy } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Result() {
  const { matchId } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const result = state?.result || JSON.parse(sessionStorage.getItem(`result:${matchId}`) || "null");

  if (!result) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <section className="panel rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-black text-white">Result belum tersedia</h1>
          <p className="mt-2 text-slate-400">Match mungkin belum selesai atau session result sudah hilang.</p>
          <Link to="/dashboard"><Button className="mt-5">Back to Dashboard</Button></Link>
        </section>
      </main>
    );
  }

  const standings = [...result.players].sort((a, b) => b.hp - a.hp);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl">
        <section className="panel rounded-2xl p-6 text-center">
        <Crown className="mx-auto text-gold drop-shadow-[0_0_24px_rgba(244,183,64,0.45)]" size={64} fill="currentColor" />
        <p className="mt-2 text-sm font-black uppercase tracking-widest text-slate-500">Winner</p>
        <h1 className="mt-2 text-5xl font-black text-white">{result.winner?.username}</h1>
        <p className="mt-3 text-sm font-semibold text-slate-400">
          {user ? "Statistik akunmu sudah disimpan." : "Login untuk menyimpan statistik permainanmu."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/dashboard"><Button variant="secondary"><Home size={18} /> Back to Dashboard</Button></Link>
          <Link to="/lobby/create"><Button><Plus size={18} /> Create New Lobby</Button></Link>
        </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Kata Valid" value={result.wordsUsed.length} tone="mint" />
          <StatCard label="Total Turn" value={result.wordsUsed.length} tone="cyan" />
          <StatCard label="Durasi Match" value="-" tone="purple" />
        </section>

        <section className="mt-6 grid gap-6">
          <div className="panel rounded-2xl p-5">
            <h2 className="flex items-center justify-center gap-2 text-xl font-black text-white"><Trophy size={20} className="text-yellow-400" /> Final Standings</h2>
            <div className="mt-4 space-y-3">
              {standings.map((player, index) => (
                <div key={player.userId || player.guestId || player.socketId} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <div>
                    <div className="font-black text-white">#{index + 1} {player.username}</div>
                    <div className="text-xs font-bold uppercase text-slate-500">{player.isGuest ? "Guest" : "User"}</div>
                  </div>
                  <span className="rounded-lg bg-white/10 px-3 py-1 text-sm font-black text-rose-300">{player.hp} HP</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
