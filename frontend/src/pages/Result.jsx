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
        <section className="panel rounded-lg p-8 text-center">
          <h1 className="text-2xl font-black">Result belum tersedia</h1>
          <p className="mt-2 text-ink/60">Match mungkin belum selesai atau session result sudah hilang.</p>
          <Link to="/dashboard"><Button className="mt-5">Back to Dashboard</Button></Link>
        </section>
      </main>
    );
  }

  const standings = [...result.players].sort((a, b) => b.hp - a.hp);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="panel rounded-lg p-6 text-center">
        <Crown className="mx-auto text-gold" size={54} fill="currentColor" />
        <p className="mt-2 text-sm font-black uppercase text-ink/45">Winner</p>
        <h1 className="text-4xl font-black">{result.winner?.username}</h1>
        <p className="mt-3 text-sm font-semibold text-ink/60">
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

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="panel rounded-lg p-5">
          <h2 className="flex items-center gap-2 text-xl font-black"><Trophy size={20} /> Final Standings</h2>
          <div className="mt-4 space-y-3">
            {standings.map((player, index) => (
              <div key={player.userId || player.guestId || player.socketId} className="flex items-center justify-between rounded-lg border border-ink/10 bg-white p-3">
                <div>
                  <div className="font-black">#{index + 1} {player.username}</div>
                  <div className="text-xs font-bold uppercase text-ink/45">{player.isGuest ? "Guest" : "User"}</div>
                </div>
                <span className="rounded-lg bg-ink/5 px-3 py-1 text-sm font-black">{player.hp} HP</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-lg p-5">
          <h2 className="text-xl font-black">Word Chain</h2>
          <div className="mt-4 text-sm font-bold leading-9 text-ink/75">
            {result.wordsUsed.length ? result.wordsUsed.map((word, index) => (
              <span key={`${word}_${index}`}>
                <span className="rounded-lg bg-white px-3 py-2 shadow-sm">{word}</span>
                {index < result.wordsUsed.length - 1 && <span className="mx-2 text-mint">→</span>}
              </span>
            )) : <p className="text-ink/50">Tidak ada kata valid.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
