import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Gamepad2, LogIn, Trophy, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button.jsx";
import { KbbiBadge } from "../components/KbbiBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Landing() {
  const { enterGuest } = useAuth();
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState("");

  const playGuest = () => {
    enterGuest(guestName);
    navigate("/dashboard");
  };

  return (
    <main className="soft-grid">
      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <KbbiBadge />
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight text-ink sm:text-6xl">
            SambungKata
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">
            Game multiplayer realtime berbasis giliran. Sambung kata sesuai huruf terakhir, hindari timeout, dan bertahan sampai menjadi pemenang.
          </p>

          <div className="mt-7 max-w-md rounded-lg border border-ink/10 bg-white/85 p-4 shadow-sm">
            <label className="text-sm font-black text-ink/70">Nama guest</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                className="min-h-11 flex-1 rounded-lg border border-ink/15 px-3 outline-none transition focus:border-mint"
                placeholder="Guest_1234"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
              />
              <Button variant="accent" onClick={playGuest}>
                <Gamepad2 size={18} /> Main Guest
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/login"><Button variant="secondary"><LogIn size={18} /> Login</Button></Link>
            <Link to="/register"><Button variant="secondary"><UserPlus size={18} /> Register</Button></Link>
            <Link to="/leaderboard"><Button variant="ghost"><Trophy size={18} /> Leaderboard</Button></Link>
          </div>
        </div>

        <div className="panel rounded-lg p-6">
          <div className="rounded-lg bg-ink p-5 text-white">
            <p className="text-sm font-black uppercase text-cyan-200">Classic Room</p>
            <div className="mt-6 flex items-center justify-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-white text-7xl font-black text-ink">N</div>
            </div>
            <p className="mt-6 text-center text-2xl font-black">N A S _</p>
            <p className="mt-2 text-center text-white/65">Giliran kamu, 12 detik tersisa</p>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-black">Cara bermain</h2>
            <div className="mt-4 grid gap-3">
              {["Masuk lobby", "Tunggu giliran", "Sambung kata sesuai huruf", "Bertahan sampai jadi pemenang"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-ink/10 bg-white p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-sm font-black text-white">{index + 1}</span>
                  <span className="font-bold">{item}</span>
                  {index === 3 && <ArrowRight className="ml-auto text-mint" size={18} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
