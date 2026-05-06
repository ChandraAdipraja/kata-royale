import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Heart, Send, Timer, WifiOff } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useSocket } from "../hooks/useSocket.js";

const playerId = (player) => player?.userId || player?.guestId || player?.socketId;

export default function Game() {
  const { roomCode } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  const { showToast } = useToast();
  const cachedState = sessionStorage.getItem(`game:${roomCode}`);
  const [game, setGame] = useState(state?.gameState || (cachedState ? JSON.parse(cachedState) : null));
  const [word, setWord] = useState("");
  const [remotePreview, setRemotePreview] = useState("");
  const [activity, setActivity] = useState([]);
  const [shakingId, setShakingId] = useState("");
  const [disconnected, setDisconnected] = useState(false);

  const pushActivity = (message, type = "info") => {
    setActivity((items) => [{ id: `${Date.now()}_${Math.random()}`, message, type }, ...items].slice(0, 12));
  };

  useEffect(() => {
    if (!socket) return;

    socket.emit("game:sync", { roomCode }, (res) => {
      if (res?.ok) {
        setGame(res.state);
        sessionStorage.setItem(`game:${roomCode}`, JSON.stringify(res.state));
      }
    });

    const onState = (nextState) => {
      setGame(nextState);
      sessionStorage.setItem(`game:${roomCode}`, JSON.stringify(nextState));
    };
    const onPreview = (payload) => setRemotePreview(payload.preview);
    const onTurn = (nextState) => {
      setWord("");
      setRemotePreview("");
      pushActivity(`Giliran ${nextState.currentTurnUsername}`);
    };
    const onValid = (payload) => {
      showToast(`${payload.word.toUpperCase()} valid`, "success");
      pushActivity(`${payload.username} menjawab ${payload.word.toUpperCase()}`, "success");
      pushActivity("Kata valid", "success");
      setWord("");
      setRemotePreview("");
    };
    const onInvalid = (payload) => {
      showToast(payload.reason || "Jawaban salah", payload.reason === "Timeout" ? "warning" : "error");
      pushActivity(`${payload.username}: ${payload.reason}, HP -1`, payload.reason === "Timeout" ? "warning" : "error");
      setShakingId(payload.playerId);
      window.setTimeout(() => setShakingId(""), 420);
    };
    const onEliminated = (payload) => {
      showToast(`${payload.username} tereliminasi`, "warning");
      pushActivity(`${payload.username} tereliminasi`, "warning");
    };
    const onFinished = (payload) => {
      sessionStorage.setItem(`result:${roomCode}`, JSON.stringify(payload));
      navigate(`/result/${roomCode}`, { state: { result: payload } });
    };
    const onDisconnect = () => {
      setDisconnected(true);
      showToast("Socket terputus. Mencoba menyambung ulang...", "warning");
    };
    const onConnect = () => setDisconnected(false);

    socket.on("game:state_updated", onState);
    socket.on("game:typing_preview", onPreview);
    socket.on("game:turn_changed", onTurn);
    socket.on("game:word_valid", onValid);
    socket.on("game:word_invalid", onInvalid);
    socket.on("game:player_eliminated", onEliminated);
    socket.on("game:finished", onFinished);
    socket.on("disconnect", onDisconnect);
    socket.on("connect", onConnect);

    return () => {
      socket.off("game:state_updated", onState);
      socket.off("game:typing_preview", onPreview);
      socket.off("game:turn_changed", onTurn);
      socket.off("game:word_valid", onValid);
      socket.off("game:word_invalid", onInvalid);
      socket.off("game:player_eliminated", onEliminated);
      socket.off("game:finished", onFinished);
      socket.off("disconnect", onDisconnect);
      socket.off("connect", onConnect);
    };
  }, [socket, navigate, roomCode, showToast]);

  const me = useMemo(() => game?.players?.find((player) => player.socketId === socket?.id), [game, socket?.id]);
  const activePlayer = useMemo(() => game?.players?.find((player) => playerId(player) === game?.currentTurnPlayerId), [game]);
  const isMyTurn = Boolean(me && game?.currentTurnPlayerId === playerId(me));

  const localPreview = useMemo(() => {
    const letters = word.trim().toUpperCase().split("");
    const slots = Math.max(4, letters.length || 1);
    return Array.from({ length: slots }, (_, index) => letters[index] || "_").join(" ");
  }, [word]);

  const submit = (event) => {
    event.preventDefault();
    if (!word.trim()) return showToast("Kata tidak boleh kosong", "warning");
    socket.emit("game:submit_word", { roomCode, word }, (res) => {
      if (!res?.ok) showToast(res?.message || "Kata ditolak", "error");
    });
  };

  const typeWord = (value) => {
    setWord(value);
    socket.emit("game:typing", { roomCode, text: value });
  };

  if (!game) {
    return (
      <main className="px-4 py-10">
        <EmptyState title="Game belum tersambung" description="Jika halaman direfresh saat game berjalan, tunggu socket sync. Jika tetap kosong, kembali ke dashboard." actionLabel="Back to Dashboard" actionTo="/dashboard" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5">
      <section className="panel rounded-2xl px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-white/10 px-3 py-2 font-mono text-sm font-black uppercase text-slate-300">Room {roomCode}</span>
            {disconnected && <span className="inline-flex items-center gap-1 rounded-xl bg-amber-400/10 px-3 py-2 text-sm font-black text-amber-300"><WifiOff size={15} /> Reconnecting</span>}
          </div>
          <Link to="/dashboard"><Button variant="ghost" className="!min-h-9 !px-3 !py-1.5">Dashboard</Button></Link>
        </div>
      </section>

      <section className="flex gap-3 overflow-x-auto px-1 py-3 no-scrollbar">
        {game.players.map((player) => {
          const isTurn = game.currentTurnPlayerId === playerId(player);
          const isYou = player.socketId === socket?.id;
          const eliminated = player.hp <= 0 || !player.alive;
          return (
            <div
              key={playerId(player)}
              className={`relative min-w-[150px] rounded-2xl border p-3 text-center transition duration-300 ${isTurn ? "z-10 scale-105 border-indigo-400 bg-indigo-600 shadow-[0_0_24px_rgba(79,70,229,0.45)]" : "border-slate-700 bg-slate-900/80"} ${eliminated ? "opacity-45 grayscale" : ""} ${shakingId === playerId(player) ? "shake" : ""}`}
            >
              {isTurn && <span className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-yellow-400 shadow-[0_0_14px_rgba(250,204,21,0.85)]" />}
              <img
                alt={`${player.username} avatar`}
                className="mx-auto h-11 w-11 rounded-full border border-slate-700 bg-slate-950 object-cover"
                src={`/avatars/${player.avatar || "Avatar1.png"}`}
              />
              <div className="mt-2 truncate text-sm font-black text-white">{player.username}</div>
              <div className="mt-2 flex justify-center gap-1 text-rose-400" aria-label={`${player.hp} HP`}>
                {Array.from({ length: game.maxHp || 3 }).map((_, index) => (
                  <Heart key={index} size={15} fill={index < player.hp ? "currentColor" : "none"} className={index < player.hp ? "text-rose-400" : "text-slate-600"} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {isYou && <Badge tone="cyan">YOU</Badge>}
                {isTurn && <Badge tone="gold">TURN</Badge>}
                {eliminated && <Badge tone="red">OUT</Badge>}
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.74fr]">
        <div className="panel rounded-2xl p-6 text-center">
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">{isMyTurn ? "Giliran kamu" : `Giliran ${activePlayer?.username || game.currentTurnUsername}`}</p>

          <div className="relative mx-auto mt-6 flex h-52 w-52 items-center justify-center">
            <div className={`absolute inset-0 rounded-full border-8 ${game.secondsLeft <= 5 ? "border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)]" : "border-yellow-400/80 shadow-[0_0_30px_rgba(250,204,21,0.18)]"}`} />
            <div className="absolute inset-4 rounded-full border-4 border-slate-800 bg-slate-950/75 backdrop-blur" />
            <div className="relative">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Awalan</div>
              <div className="text-8xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">{game.currentLetter}</div>
            </div>
            <div className={`absolute -bottom-2 rounded-full border-2 px-4 py-1 text-lg font-black ${game.secondsLeft <= 5 ? "border-rose-300 bg-rose-500 text-white" : "border-slate-600 bg-slate-900 text-yellow-300"}`}>
              <Timer size={16} className="mr-1 inline" />
              {game.secondsLeft}s
            </div>
          </div>

          <div className="text-center justify-center mx-auto mt-8 flex max-w-xl items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4 text-left">
            <div className="text-center items-center min-w-0">
              <div className="text-center mt-1 break-words text-3xl font-black tracking-wide text-cyan-100">{remotePreview || localPreview}</div>
            </div>
          </div>

          <form onSubmit={submit} className="mx-auto mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <input
              className="game-input min-h-14 flex-1 px-5 text-lg font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isMyTurn}
              placeholder={isMyTurn ? `Mulai dengan ${game.currentLetter.toUpperCase()}` : "Menunggu giliran pemain lain..."}
              value={word}
              onChange={(event) => typeWord(event.target.value)}
            />
            <Button disabled={!isMyTurn} type="submit"><Send size={18} /> Submit</Button>
          </form>
        </div>
      </section>
    </main>
  );
}

const Badge = ({ children, tone }) => {
  const tones = {
    cyan: "bg-cyan-400/15 text-cyan-200",
    gold: "bg-yellow-400/15 text-yellow-200",
    red: "bg-rose-400/15 text-rose-200"
  };

  return <span className={`rounded-lg px-2 py-1 text-[11px] font-black ${tones[tone]}`}>{children}</span>;
};
