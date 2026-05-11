import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Clock3, Heart, Lock, Plus, Tag, Unlock, UsersRound } from "lucide-react";
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
      <div className="w-full max-w-6xl">
        <Link to="/dashboard" className="inline-flex rounded-xl bg-slate-800 p-3 text-white transition hover:bg-slate-700">
          <ArrowRight className="rotate-180" size={20} />
        </Link>
        <form onSubmit={submit} className="mt-4 grid gap-5 lg:grid-cols-[1fr_0.72fr]">
          <section className="game-surface rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="section-kicker">Room setup</p>
                <h1 className="mt-2 text-3xl font-black text-white">Buat Lobby</h1>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">Atur format permainan, lalu bagikan room code ke pemain lain.</p>
              </div>
              <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-200">
                {form.isPublic ? <Unlock size={16} className="inline" /> : <Lock size={16} className="inline" />} {form.isPublic ? "Publik" : "Privat"}
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
                icon={UsersRound}
                label="Max player"
                value={form.maxPlayers}
                onChange={(value) => setForm({ ...form, maxPlayers: value })}
                options={[2, 3, 4, 5, 6, 7, 8]}
              />
              <SelectField
                icon={Heart}
                label="HP"
                value={form.hp}
                onChange={(value) => setForm({ ...form, hp: value })}
                options={[1, 2, 3]}
              />
              <SelectField
                icon={Clock3}
                label="Timer detik"
                value={form.timer}
                onChange={(value) => setForm({ ...form, timer: value })}
                options={[5, 10, 15, 20]}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ToggleCard
                checked={form.isPublic}
                icon={form.isPublic ? Unlock : Lock}
                label="Lobby publik"
                note="Muncul di daftar lobby"
                onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
                tone="cyan"
              />
              <ToggleCard
                checked={form.categoryChallenge}
                icon={Tag}
                label="Challenge kategori"
                note="Kata harus cocok kategori acak"
                onClick={() => setForm({ ...form, categoryChallenge: !form.categoryChallenge })}
                tone="violet"
              />
            </div>

            <Button className="mt-6 w-full sm:w-auto" variant="accent" disabled={loading} type="submit">
              <Plus size={18} /> {loading ? "Membuat..." : "Buat Lobby"}
            </Button>
          </section>

          <aside className="game-surface tile-grid rounded-2xl p-5">
            <p className="section-kicker">Preview</p>
            <h2 className="mt-2 break-words text-2xl font-black text-white">{form.name || "Room Baru"}</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <PreviewItem icon={UsersRound} label="Pemain" value={form.maxPlayers} />
              <PreviewItem icon={Heart} label="HP" value={form.hp} tone="rose" />
              <PreviewItem icon={Clock3} label="Timer" value={`${form.timer}s`} tone="cyan" />
              <PreviewItem icon={Tag} label="Mode" value={form.categoryChallenge ? "Kategori" : "Classic"} tone={form.categoryChallenge ? "violet" : "gold"} />
            </div>
            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/55 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-emerald-200">
                <Check size={16} /> Siap dibuat
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">Host otomatis ready. Pemain lain perlu ready sebelum match dimulai.</p>
            </div>
          </aside>
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

const SelectField = ({ label, value, onChange, options, icon: Icon }) => (
  <label className="block">
    <span className="flex items-center gap-2 text-sm font-black text-slate-300">{Icon && <Icon size={15} className="text-yellow-300" />}{label}</span>
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

const ToggleCard = ({ checked, icon: Icon, label, note, onClick, tone }) => {
  const toneClass = tone === "violet" ? "border-violet-400/35 bg-violet-500/15 text-violet-100" : "border-cyan-400/35 bg-cyan-400/10 text-cyan-100";
  return (
    <button
      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${checked ? toneClass : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"}`}
      onClick={onClick}
      type="button"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className="block font-black">{label}</span>
        <span className="mt-1 block text-xs font-semibold text-slate-400">{note}</span>
      </span>
    </button>
  );
};

const PreviewItem = ({ icon: Icon, label, value, tone = "slate" }) => {
  const tones = {
    slate: "text-slate-100",
    rose: "text-rose-200",
    cyan: "text-cyan-200",
    violet: "text-violet-200",
    gold: "text-yellow-200"
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/55 p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
        <Icon size={14} /> {label}
      </div>
      <div className={`mt-2 text-xl font-black ${tones[tone] || tones.slate}`}>{value}</div>
    </div>
  );
};
