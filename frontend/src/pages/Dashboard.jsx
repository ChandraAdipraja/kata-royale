import { Link } from "react-router-dom";
import { BookOpenCheck, LogIn, Plus, Trophy, UserPlus, UsersRound } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { KbbiBadge } from "../components/KbbiBadge.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, displayName, guestName } = useAuth();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="panel overflow-hidden rounded-lg">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <KbbiBadge />
            <h1 className="mt-4 text-4xl font-black">Halo, {displayName}</h1>
            <p className="mt-3 max-w-2xl text-ink/65">
              Pilih lobby, susun kata, dan jaga HP tetap hidup. Dashboard ini pusat kendali sebelum masuk arena.
            </p>
          </div>
          <div className="rounded-lg bg-ink p-5 text-white">
            <p className="text-sm font-black uppercase text-cyan-200">Status</p>
            {user ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Mini label="Match" value={user.totalMatch} />
                <Mini label="Winrate" value={`${user.winrate}%`} />
              </div>
            ) : (
              <div className="mt-4">
                <p className="font-semibold text-white/75">Guest bisa bermain, tetapi statistik permanen hanya untuk akun login.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/login"><Button variant="secondary"><LogIn size={16} /> Login</Button></Link>
                  <Link to="/register"><Button variant="cyan"><UserPlus size={16} /> Register</Button></Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <ActionCard
          icon={Plus}
          title="Create Lobby"
          description="Atur max player, HP, timer, dan privacy sebelum membagikan room code."
          to="/lobby/create"
          button="Buat Lobby"
        />
        <ActionCard
          icon={UsersRound}
          title="Join Lobby"
          description="Masukkan room code dari host dan langsung masuk waiting room realtime."
          to="/lobby/join"
          button="Join Room"
        />
        <ActionCard
          icon={Trophy}
          title="Leaderboard"
          description="Lihat ranking berdasarkan winrate, total win, dan kata valid."
          to="/leaderboard"
          button="Lihat Ranking"
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel rounded-lg p-5">
          <h2 className="flex items-center gap-2 text-xl font-black"><BookOpenCheck size={20} /> Quick Rules</h2>
          <div className="mt-4 grid gap-3">
            {["Kata harus dimulai dari huruf aktif.", "Kata tidak boleh pernah dipakai di match.", "Validasi utama memakai KBBI API lokal.", "Salah atau timeout mengurangi HP."].map((rule) => (
              <div key={rule} className="rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink/70">{rule}</div>
            ))}
          </div>
        </div>

        <div className="panel rounded-lg p-5">
          <h2 className="text-xl font-black">Profile Summary</h2>
          {user ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Match" value={user.totalMatch} tone="mint" />
              <StatCard label="Win" value={user.win} tone="cyan" />
              <StatCard label="Lose" value={user.lose} tone="purple" />
              <StatCard label="Kata Valid" value={user.totalValidWords} tone="amber" />
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-ink/15 bg-white p-5">
              <p className="font-semibold text-ink/65">Kamu bermain sebagai {guestName || "Guest"}. Statistik match tidak akan disimpan permanen.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/login"><Button variant="secondary">Login</Button></Link>
                <Link to="/register"><Button variant="accent">Buat Akun</Button></Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

const ActionCard = ({ icon: Icon, title, description, to, button }) => (
  <div className="panel rounded-lg p-5 transition hover:-translate-y-0.5 hover:shadow-xl">
    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-white">
      <Icon size={20} />
    </div>
    <h2 className="mt-4 text-xl font-black">{title}</h2>
    <p className="mt-2 min-h-12 text-sm leading-6 text-ink/65">{description}</p>
    <Link to={to}><Button className="mt-5 w-full">{button}</Button></Link>
  </div>
);

const Mini = ({ label, value }) => (
  <div className="rounded-lg bg-white/10 p-3">
    <div className="text-xs font-black uppercase text-white/50">{label}</div>
    <div className="text-2xl font-black">{value}</div>
  </div>
);
