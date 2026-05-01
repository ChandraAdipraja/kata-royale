import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Settings } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

export default function Profile() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(authUser);

  useEffect(() => {
    if (!authUser) return;
    api.get("/users/profile").then(({ data }) => setUser(data.user));
  }, [authUser]);

  if (!authUser) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/dashboard" className="mb-6 inline-flex rounded-xl bg-slate-800 p-3 text-white transition hover:bg-slate-700">
          <ArrowRight className="rotate-180" size={24} />
        </Link>
        <section className="panel rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-black text-white">Profile permanen butuh akun</h1>
          <p className="mt-3 text-slate-400">Guest tetap bisa bermain, tetapi statistik match, winrate, dan kata valid hanya disimpan untuk user login.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/login"><Button variant="secondary">Login</Button></Link>
            <Link to="/register"><Button>Buat Akun</Button></Link>
          </div>
        </section>
      </main>
    );
  }

  if (!user) return <main className="mx-auto max-w-4xl px-4 py-10 text-slate-300">Loading profile...</main>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <Link to="/dashboard" className="rounded-xl bg-slate-800 p-3 text-white transition hover:bg-slate-700">
          <ArrowRight className="rotate-180" size={24} />
        </Link>
        <h1 className="text-2xl font-black text-white">Profil Pemain</h1>
        <button className="rounded-xl bg-slate-800 p-3 text-slate-400 transition hover:bg-slate-700 hover:text-white" type="button">
          <Settings size={24} />
        </button>
      </div>
      <section className="panel rounded-2xl p-6">
        <p className="text-sm font-black uppercase text-yellow-300">Player Profile</p>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-slate-800 bg-gradient-to-br from-indigo-500 to-purple-600 text-4xl font-black text-white shadow-xl">
            {user.username?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-4xl font-black text-white">{user.username}</h1>
            <p className="mt-1 text-slate-400">{user.email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Match" value={user.totalMatch} tone="mint" />
          <StatCard label="Win" value={user.win} tone="cyan" />
          <StatCard label="Lose" value={user.lose} tone="purple" />
          <StatCard label="Winrate" value={`${user.winrate}%`} tone="amber" />
          <StatCard label="Kata Valid" value={user.totalValidWords} />
        </div>
      </section>

      <section className="panel mt-6 rounded-2xl p-6">
        <h2 className="text-xl font-black text-white">Recent Matches</h2>
        <p className="mt-3 rounded-xl border border-dashed border-slate-600 bg-slate-900/70 p-4 text-sm font-semibold text-slate-400">
          Backend saat ini belum menyediakan endpoint recent matches. Statistik utama sudah aktif dan tersimpan setelah match selesai.
        </p>
      </section>
    </main>
  );
}
