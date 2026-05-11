import { Link, useLocation, useParams } from "react-router-dom";
import { BookOpenText, Crown, Home, Plus, RotateCcw, Sparkles, Trophy } from "lucide-react";
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

  const wordsUsed = result.wordsUsed || [];
  const totalTurns = result.totalTurns ?? wordsUsed.length;
  const standings = result.standings?.length
    ? result.standings
    : [...result.players].sort((a, b) => {
      if (b.hp !== a.hp) return b.hp - a.hp;
      return Number(b.alive) - Number(a.alive);
    });
  const longestWord = [...wordsUsed].sort((a, b) => b.length - a.length)[0] || "-";
  const aliveCount = result.players.filter((player) => player.alive && player.hp > 0).length;
  const winner = result.winner || standings[0];

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8">
      <div className="w-full">
        <section className="tile-grid relative overflow-hidden rounded-2xl border border-yellow-400/25 bg-slate-950/80 p-6 text-center shadow-2xl shadow-slate-950/40">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-yellow-300/40 bg-yellow-400/15 text-yellow-300 shadow-[0_0_34px_rgba(250,204,21,0.22)]">
            <Crown size={58} fill="currentColor" />
          </div>
          <p className="section-kicker mt-5 justify-center"><Sparkles size={15} /> Winner</p>
          <h1 className="mt-2 break-words text-5xl font-black text-white sm:text-6xl">{winner?.username || "-"}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm font-semibold text-slate-400">
            {user ? "Statistik akunmu sudah disimpan." : "Login untuk menyimpan statistik permainanmu."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/dashboard"><Button variant="secondary"><Home size={18} /> Dashboard</Button></Link>
            <Link to="/lobby/create"><Button><Plus size={18} /> New Lobby</Button></Link>
            <Link to="/lobby/public"><Button variant="ghost"><RotateCcw size={18} /> Lobby List</Button></Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Kata Valid" value={wordsUsed.length} tone="mint" />
          <StatCard label="Total Turn" value={totalTurns} tone="cyan" />
          <StatCard label="Kata Terpanjang" value={longestWord.toUpperCase?.() || longestWord} tone="amber" />
          <StatCard label="Survivor" value={aliveCount || 1} tone="purple" />
        </section>

        <Podium players={standings.slice(0, 3)} />

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.82fr]">
          <div className="game-surface rounded-2xl p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <Trophy size={22} className="text-yellow-400" />
              Final Standings
            </h2>
            <div className="mt-5 space-y-3">
              {standings.map((player, index) => (
                <StandingRow index={index} key={player.userId || player.guestId || player.socketId} player={player} />
              ))}
            </div>
          </div>

          <div className="game-surface rounded-2xl p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-white"><BookOpenText size={21} className="text-cyan-300" /> Word Recap</h2>
            <div className="luxury-scroll mt-5 flex max-h-[360px] flex-wrap gap-2 overflow-y-auto pr-2">
              {wordsUsed.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm font-semibold text-slate-500">
                  Belum ada kata valid.
                </div>
              )}
              {wordsUsed.map((word, index) => (
                <span key={`${word}_${index}`} className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-black uppercase text-cyan-100">
                  {word}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const Podium = ({ players }) => {
  if (!players.length) return null;

  return (
    <section className="mt-6 grid gap-3 md:grid-cols-3">
      {players.map((player, index) => {
        const tones = [
          "border-yellow-300/40 bg-yellow-400/15 text-yellow-200",
          "border-slate-300/30 bg-slate-300/10 text-slate-100",
          "border-amber-500/35 bg-amber-500/10 text-amber-200"
        ];

        return (
          <article className={`game-surface rounded-2xl p-5 text-center ${tones[index] || ""}`} key={player.userId || player.guestId || player.socketId}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950/70 text-lg font-black">#{index + 1}</div>
            <div className="mt-3 truncate text-xl font-black text-white">{player.username}</div>
            <div className="mt-1 text-xs font-bold uppercase text-slate-400">{player.isGuest ? "Guest" : "User"}</div>
          </article>
        );
      })}
    </section>
  );
};

const StandingRow = ({ player, index }) => {
  const rankTone = [
    "border-yellow-300/40 bg-yellow-400/15 text-yellow-200",
    "border-slate-300/30 bg-slate-300/10 text-slate-100",
    "border-amber-600/35 bg-amber-600/10 text-amber-200"
  ][index] || "border-slate-700 bg-slate-900/70 text-slate-300";

  return (
    <article className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${rankTone}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950/70 text-lg font-black">
          #{player.rank || index + 1}
        </div>
        <div className="min-w-0">
          <div className="truncate font-black text-white">{player.username}</div>
          <div className="mt-1 text-xs font-bold uppercase text-slate-400">{player.isGuest ? "Guest" : "User"}</div>
        </div>
      </div>
      <div className="shrink-0 rounded-xl bg-slate-950/70 px-3 py-2 text-sm font-black text-rose-300">{player.hp} HP</div>
    </article>
  );
};
