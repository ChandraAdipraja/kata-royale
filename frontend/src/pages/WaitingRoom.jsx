import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Copy, Crown, Play, Timer, UsersRound } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { KbbiBadge } from "../components/KbbiBadge.jsx";
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
    socket.on("lobby:updated", onLobby);
    socket.on("game:started", onStarted);

    return () => {
      socket.off("lobby:updated", onLobby);
      socket.off("game:started", onStarted);
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

  if (!lobby) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <section className="panel rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-black text-white">{joining ? "Masuk ke waiting room..." : "Lobby tidak tersedia"}</h1>
          <p className="mt-2 text-slate-400">Pastikan room code benar dan game belum selesai.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="panel rounded-2xl border-t-4 border-t-yellow-400 p-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <KbbiBadge />
            <h1 className="mt-4 text-3xl font-black text-white">{lobby.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-400"><Crown size={16} className="text-yellow-400" /> Host: {host?.username || "-"}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex rounded-2xl bg-slate-950 px-5 py-3 font-mono text-4xl font-black tracking-widest text-white shadow-inner">{lobby.roomCode}</div>
              <Button variant="secondary" onClick={copyCode}><Copy size={18} /> Copy</Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Setting label="Max Player" value={lobby.settings.maxPlayers} />
            <Setting label="HP" value={lobby.settings.hp} />
            <Setting label="Timer" value={`${lobby.settings.timer}s`} />
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
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

const Setting = ({ label, value }) => (
  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-center">
    <div className="text-xs font-black uppercase text-slate-500">{label}</div>
    <div className="mt-2 text-2xl font-black text-white">{value}</div>
  </div>
);

const Check = ({ ok, text }) => (
  <div className="flex items-center gap-2">
    <span className={`h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
    {text}
  </div>
);
