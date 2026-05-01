import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
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
        <section className="panel rounded-lg p-8 text-center">
          <h1 className="text-3xl font-black">Profile permanen butuh akun</h1>
          <p className="mt-3 text-ink/65">Guest tetap bisa bermain, tetapi statistik match, winrate, dan kata valid hanya disimpan untuk user login.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/login"><Button variant="secondary">Login</Button></Link>
            <Link to="/register"><Button>Buat Akun</Button></Link>
          </div>
        </section>
      </main>
    );
  }

  if (!user) return <main className="mx-auto max-w-4xl px-4 py-10">Loading profile...</main>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="panel rounded-lg p-6">
        <p className="text-sm font-black uppercase text-mint">Player Profile</p>
        <h1 className="mt-2 text-4xl font-black">{user.username}</h1>
        <p className="mt-1 text-ink/60">{user.email}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Match" value={user.totalMatch} tone="mint" />
          <StatCard label="Win" value={user.win} tone="cyan" />
          <StatCard label="Lose" value={user.lose} tone="purple" />
          <StatCard label="Winrate" value={`${user.winrate}%`} tone="amber" />
          <StatCard label="Kata Valid" value={user.totalValidWords} />
        </div>
      </section>

      <section className="panel mt-6 rounded-lg p-6">
        <h2 className="text-xl font-black">Recent Matches</h2>
        <p className="mt-3 rounded-lg border border-dashed border-ink/15 bg-white p-4 text-sm font-semibold text-ink/55">
          Backend saat ini belum menyediakan endpoint recent matches. Statistik utama sudah aktif dan tersimpan setelah match selesai.
        </p>
      </section>
    </main>
  );
}
