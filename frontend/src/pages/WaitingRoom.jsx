import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Copy, Crown, LogOut, Pencil, Play, Tag, Timer, UsersRound, X } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useSocket } from "../hooks/useSocket.js";

export default function WaitingRoom() {
  const { roomCode } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  const { guestName, guestId } = useAuth();
  const { showToast } = useToast();
  const [lobby, setLobby] = useState(state?.lobby || null);
  const [joining, setJoining] = useState(!state?.lobby);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showSettingsEditor, setShowSettingsEditor] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ maxPlayers: 4, hp: 3, timer: 15, categoryChallenge: false });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.emit("lobby:join", { roomCode, guestName, guestId }, (res) => {
      setJoining(false);
      if (res?.ok) {
        if (res.gameState) navigate(`/game/${roomCode}`, { state: { gameState: res.gameState } });
        else setLobby(res.lobby);
      } else {
        showToast(res?.message || "Tidak bisa join lobby", "error");
      }
    });

    const onLobby = (nextLobby) => setLobby(nextLobby);
    const onStarted = (gameState) => {
      sessionStorage.setItem(`game:${roomCode}`, JSON.stringify(gameState));
      navigate(`/game/${roomCode}`, { state: { gameState } });
    };
    const onClosed = () => {
      showToast("Room dibubarkan oleh host", "warning");
      navigate("/lobby/public");
    };
    socket.on("lobby:updated", onLobby);
    socket.on("game:started", onStarted);
    socket.on("lobby:closed", onClosed);

    return () => {
      socket.off("lobby:updated", onLobby);
      socket.off("game:started", onStarted);
      socket.off("lobby:closed", onClosed);
    };
  }, [socket, roomCode, guestName, guestId, navigate, showToast]);

  const me = useMemo(() => lobby?.players?.find((player) => player.socketId === socket?.id), [lobby, socket?.id]);
  const host = lobby?.players?.find((player) => player.isHost);
  const enoughPlayers = (lobby?.players?.length || 0) >= 2;
  const everyoneReady = enoughPlayers && lobby.players.every((player) => player.ready || player.isHost);

  const copyCode = async () => {
    await navigator.clipboard?.writeText(lobby.roomCode);
    showToast("Room code disalin", "success");
  };

  const toggleReady = () => {
    socket.emit("lobby:ready", { roomCode, ready: !me?.ready }, (res) => {
      if (!res?.ok) showToast(res?.message || "Gagal update ready", "error");
    });
  };

  const startGame = () => {
    socket.emit("lobby:start", { roomCode }, (res) => {
      if (!res?.ok) showToast(res?.message || "Belum bisa mulai", "warning");
    });
  };

  const openSettingsEditor = () => {
    setSettingsForm({
      maxPlayers: lobby.settings.maxPlayers,
      hp: lobby.settings.hp,
      timer: lobby.settings.timer,
      categoryChallenge: Boolean(lobby.settings.categoryChallenge)
    });
    setShowSettingsEditor(true);
  };

  const saveSettings = () => {
    setSavingSettings(true);
    socket.emit("lobby:update_settings", { roomCode, settings: settingsForm }, (res) => {
      setSavingSettings(false);
      if (!res?.ok) return showToast(res?.message || "Gagal update setting room", "error");
      setLobby(res.lobby);
      setShowSettingsEditor(false);
      showToast("Setting room diperbarui", "success");
    });
  };

  const leaveRoom = () => {
    setShowLeaveConfirm(false);
    if (me?.isHost) {
      socket.emit("lobby:close", { roomCode }, (res) => {
        if (!res?.ok) {
          showToast(res?.message || "Gagal membubarkan", "error");
          return;
        }
        socket?.disconnect();
        navigate("/dashboard");
      });
      return;
    }
    socket?.disconnect();
    navigate("/dashboard");
  };

  if (!lobby) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <section className="panel w-full max-w-4xl rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-black text-white">{joining ? "Masuk ke waiting room..." : "Lobby tidak tersedia"}</h1>
          <p className="mt-2 text-slate-400">Pastikan room code benar dan game belum selesai.</p>
        </section>
      </main>
    );
  }

  return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <section className="panel w-full max-w-6xl rounded-2xl border-t-4 border-t-yellow-400 p-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="mt-4 text-3xl font-black text-white">{lobby.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-400"><Crown size={16} className="text-yellow-400" /> Host: {host?.username || "-"}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex rounded-2xl bg-slate-950 px-5 py-3 font-mono text-4xl font-black tracking-widest text-white shadow-inner">{lobby.roomCode}</div>
              <Button variant="secondary" onClick={copyCode}><Copy size={18} /> Copy</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Setting label="Max Player" value={lobby.settings.maxPlayers} />
            <Setting label="HP" value={lobby.settings.hp} />
            <Setting label="Timer" value={`${lobby.settings.timer}s`} />
            <Setting label="Kategori" value={lobby.settings.categoryChallenge ? "Aktif" : "Off"} tone={lobby.settings.categoryChallenge ? "violet" : "slate"} />
            {me?.isHost && (
              <button
                className="col-span-2 flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm font-black text-yellow-100 transition hover:border-yellow-300 hover:bg-yellow-400/15 sm:col-span-4"
                onClick={openSettingsEditor}
                type="button"
              >
                <Pencil size={16} /> Edit Room
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.72fr]">
          <section>
            <h2 className="flex items-center gap-2 text-xl font-black text-white"><UsersRound size={20} /> Player List</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {lobby.players.map((player) => (
                <div key={player.userId || player.guestId || player.socketId} className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 transition hover:border-yellow-400/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        alt={`${player.username} avatar`}
                        className="h-12 w-12 rounded-full border border-slate-700 bg-slate-950 object-cover"
                        src={`/avatars/${player.avatar || "Avatar1.png"}`}
                      />
                      <div className="min-w-0">
                        <div className="font-black text-white">{player.username}</div>
                        <div className="mt-1 flex gap-2 text-xs font-black uppercase">
                          <span className={player.isHost ? "text-yellow-300" : "text-slate-500"}>{player.isHost ? "Host" : "Player"}</span>
                          {player.socketId === socket?.id && <span className="text-cyan-300">You</span>}
                        </div>
                      </div>
                    </div>
                    <span className={`rounded-lg px-3 py-1 text-sm font-black ${player.ready || player.isHost ? "bg-emerald-400/10 text-emerald-300" : "bg-white/10 text-slate-400"}`}>
                      {player.ready || player.isHost ? "Ready" : "Waiting"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-700 bg-slate-950/60 p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-white"><Timer size={20} /> Start Check</h2>
            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-400">
              <Check ok={enoughPlayers} text="Minimal 2 pemain" />
              <Check ok={everyoneReady} text="Semua player ready" />
              <Check ok={Boolean(me?.isHost)} text={me?.isHost ? "Kamu host" : "Menunggu host"} />
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {!me?.isHost && (
                <Button variant={me?.ready ? "secondary" : "accent"} onClick={toggleReady}>
                  <CheckCircle2 size={18} /> {me?.ready ? "Unready" : "Ready"}
                </Button>
              )}
              {me?.isHost && (
                <Button disabled={!everyoneReady} onClick={startGame}>
                  <Play size={18} /> Start Game
                </Button>
              )}
              <Button variant="ghost" onClick={() => setShowLeaveConfirm(true)}>
                <LogOut size={18} /> {me?.isHost ? "Bubarkan Room" : "Keluar"}
              </Button>
            </div>
          </aside>
        </div>
      </section>

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="panel w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Konfirmasi</h2>
              <button className="text-slate-400 transition hover:text-white" onClick={() => setShowLeaveConfirm(false)} type="button">
                <X size={20} />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {me?.isHost ? "Yakin ingin bubarkan room ini?" : "Yakin ingin keluar dari room?"}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" className="w-full" onClick={() => setShowLeaveConfirm(false)}>
                Batal
              </Button>
              <Button variant="danger" className="w-full" onClick={leaveRoom}>
                {me?.isHost ? "Bubarkan" : "Keluar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSettingsEditor && (
        <SettingsEditorModal
          currentPlayerCount={lobby.players.length}
          form={settingsForm}
          onCancel={() => setShowSettingsEditor(false)}
          onChange={setSettingsForm}
          onSave={saveSettings}
          saving={savingSettings}
        />
      )}
    </main>
  );
}

const SETTING_TONES = {
  violet: "text-violet-300",
  slate: "text-slate-500"
};

const Setting = ({ label, value, tone }) => (
  <div className="flex min-h-[96px] flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-center">
    <div className="text-xs font-black uppercase text-slate-500">{label}</div>
    <div className={`mt-2 text-2xl font-black ${tone ? (SETTING_TONES[tone] || "text-white") : "text-white"}`}>{value}</div>
  </div>
);

const Check = ({ ok, text }) => (
  <div className="flex items-center gap-2">
    <span className={`h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
    {text}
  </div>
);

const SettingsEditorModal = ({ currentPlayerCount, form, onCancel, onChange, onSave, saving }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
    <div className="panel w-full max-w-xl rounded-2xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Edit Room</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">Pemain yang sudah ready akan diminta ready ulang.</p>
        </div>
        <button className="text-slate-400 transition hover:text-white" onClick={onCancel} type="button" aria-label="Tutup modal">
          <X size={20} />
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Max Player"
          value={form.maxPlayers}
          onChange={(value) => onChange({ ...form, maxPlayers: value })}
          options={[2, 3, 4, 5, 6, 7, 8].filter((value) => value >= currentPlayerCount)}
        />
        <SelectField
          label="HP"
          value={form.hp}
          onChange={(value) => onChange({ ...form, hp: value })}
          options={[1, 2, 3]}
        />
        <SelectField
          label="Timer"
          value={form.timer}
          onChange={(value) => onChange({ ...form, timer: value })}
          options={[5, 10, 15, 20]}
          suffix="s"
        />
      </div>

      <button
        className={`mt-5 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${form.categoryChallenge ? "border-violet-400/35 bg-violet-500/15" : "border-slate-700 bg-slate-900/70 hover:border-slate-500"}`}
        onClick={() => onChange({ ...form, categoryChallenge: !form.categoryChallenge })}
        type="button"
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${form.categoryChallenge ? "bg-violet-400/20 text-violet-200" : "bg-white/10 text-slate-300"}`}>
          <Tag size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-black text-white">Challenge kategori</span>
          <span className="mt-1 block text-sm font-semibold text-slate-400">Setiap kata harus sesuai kategori acak.</span>
        </span>
        <span className={`rounded-lg px-3 py-1 text-xs font-black uppercase ${form.categoryChallenge ? "bg-violet-400/20 text-violet-100" : "bg-white/10 text-slate-400"}`}>
          {form.categoryChallenge ? "On" : "Off"}
        </span>
      </button>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" className="w-full" onClick={onCancel} type="button" disabled={saving}>
          Batal
        </Button>
        <Button variant="accent" className="w-full" onClick={onSave} type="button" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, options, suffix = "" }) => (
  <label className="block">
    <span className="text-sm font-black text-slate-300">{label}</span>
    <div className="relative mt-2">
      <select
        className="game-input w-full appearance-none px-4 py-3 pr-10"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}{suffix}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
    </div>
  </label>
);
