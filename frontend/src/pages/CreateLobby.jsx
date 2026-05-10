import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Plus, Tag, Unlock } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { useSocket } from "../hooks/useSocket.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function CreateLobby() {
  const socket = useSocket();
  const navigate = useNavigate();
  const { guestName, guestId, enterGuest, user } = useAuth();
  const { showToast } = useToast();
  const [guestInput, setGuestInput] = useState(guestName);
  const [form, setForm] = useState({ name: "Classic Room", maxPlayers: 4, hp: 3, timer: 15, isPublic: true, categoryChallenge: false });
  const [loading, setLoading] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    const guest = !user && !guestName ? enterGuest(guestInput) : { guestName, guestId };
    if (!socket?.connected) return showToast("Socket belum terhubung. Coba lagi sebentar.", "warning");

    setLoading(true);
    socket.emit("lobby:create", { ...form, guestName: guest.guestName || guestInput, guestId: guest.guestId }, (res) => {
      setLoading(false);
      if (!res?.ok) return showToast(res?.message || "Gagal membuat lobby", "error");
      showToast("Lobby berhasil dibuat", "success");
      navigate(`/lobby/${res.lobby.roomCode}`, { state: { lobby: res.lobby } });
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <Link to="/dashboard" className="inline-flex rounded-xl bg-slate-800 p-3 text-white transition hover:bg-slate-700">
          <ArrowRight className="rotate-180" size={20} />
        </Link>
        <form onSubmit={submit} className="panel mt-4 rounded-2xl p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-3xl font-black text-white">Create Lobby</h1>
              <p className="mt-2 text-slate-400">Atur room classic dan bagikan room code ke pemain lain.</p>
            </div>
            <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-200">
              {form.isPublic ? <Unlock size={16} className="inline" /> : <Lock size={16} className="inline" />} {form.isPublic ? "Public" : "Private"}
            </div>
          </div>

        {!user && !guestName && (
          <div className="mt-6">
            <label className="text-sm font-black text-slate-300">Nama guest</label>
            <input className="game-input mt-2 px-4 py-3" value={guestInput} onChange={(event) => setGuestInput(event.target.value)} placeholder="Guest_1234" />
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Nama lobby" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <SelectField
            label="Max player"
            value={form.maxPlayers}
            onChange={(value) => setForm({ ...form, maxPlayers: value })}
            options={[2, 3, 4, 5, 6, 7, 8]}
          />
          <SelectField
            label="HP"
            value={form.hp}
            onChange={(value) => setForm({ ...form, hp: value })}
            options={[1, 2, 3]}
          />
          <SelectField
            label="Timer detik"
            value={form.timer}
            onChange={(value) => setForm({ ...form, timer: value })}
            options={[5, 10, 15, 20]}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm font-black text-slate-200 cursor-pointer hover:border-slate-500 transition">
            <input type="checkbox" checked={form.isPublic} onChange={(event) => setForm({ ...form, isPublic: event.target.checked })} />
            <Unlock size={15} className="text-cyan-400 shrink-0" />
            Lobby public
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm font-black text-slate-200 cursor-pointer hover:border-slate-500 transition">
            <input type="checkbox" checked={form.categoryChallenge} onChange={(event) => setForm({ ...form, categoryChallenge: event.target.checked })} />
            <Tag size={15} className="text-violet-400 shrink-0" />
            <span>
              Challenge kategori
              <span className="ml-2 font-normal text-slate-400 text-xs">tiap kata harus sesuai kategori acak</span>
            </span>
          </label>
        </div>

          <Button className="mt-6 w-full sm:w-auto" variant="accent" disabled={loading} type="submit">
            <Plus size={18} /> {loading ? "Membuat..." : "Create Lobby"}
          </Button>
        </form>
      </div>
    </main>
  );
}

const Field = ({ label, value, onChange, ...props }) => (
  <label className="block">
    <span className="text-sm font-black text-slate-300">{label}</span>
    <input className="game-input mt-2 px-4 py-3" value={value} onChange={(event) => onChange(event.target.value)} {...props} />
  </label>
);

const SelectField = ({ label, value, onChange, options }) => (
  <label className="block">
    <span className="text-sm font-black text-slate-300">{label}</span>
    <div className="relative mt-2">
      <select
        className="game-input w-full appearance-none px-4 py-3 pr-10"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
    </div>
  </label>
);
