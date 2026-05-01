import { Link, useNavigate } from "react-router-dom";
import { Gamepad2, LogIn, Swords, Trophy, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button.jsx";
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
    <main className="flex min-h-screen items-center justify-center py-10">
      <section className="mx-auto flex w-full max-w-md flex-col items-center text-center">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-yellow-400/20 blur-xl" />
          <Swords size={80} className="relative z-10 mx-auto text-yellow-400 drop-shadow-lg" />
        </div>

        <h1 className="mt-8 text-5xl font-black tracking-normal text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 drop-shadow-sm sm:text-6xl">
          KATA ROYALE
        </h1>
        <p className="mt-3 text-lg text-slate-400">Bertahan hidup dengan kata-kata!</p>

        <div className="mt-8 w-full space-y-4">
          <div className="panel rounded-2xl p-4 text-left">
            <label className="text-sm font-black text-slate-300">Nama Guest</label>
            <input
              className="game-input mt-2 min-h-12 px-4"
              placeholder="Guest_1234"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              autoFocus
            />
          </div>

          <Button className="w-full" onClick={playGuest}>
            <Gamepad2 size={20} /> Main Cepat (Guest)
          </Button>
          <Link to="/login" className="block">
            <Button className="w-full" variant="accent">
              <LogIn size={20} /> Login Akun
            </Button>
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <Link to="/register">
              <Button className="w-full !px-3" variant="ghost"><UserPlus size={18} /> Daftar</Button>
            </Link>
            <Link to="/leaderboard">
              <Button className="w-full !px-3" variant="ghost"><Trophy size={18} /> Ranking</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
