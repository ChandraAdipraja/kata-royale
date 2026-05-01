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
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[0.78fr_1.3fr_0.85fr]">
      <section className="panel order-2 rounded-lg p-5 lg:order-1">
        <h2 className="text-xl font-black">Players</h2>
        <div className="mt-4 space-y-3">
          {game.players.map((player) => {
            const isTurn = game.currentTurnPlayerId === playerId(player);
            const isYou = player.socketId === socket?.id;
            const eliminated = player.hp <= 0 || !player.alive;
            return (
              <div key={playerId(player)} className={`rounded-lg border p-3 transition ${isTurn ? "border-gold bg-amber-50" : "border-ink/10 bg-white"} ${shakingId === playerId(player) ? "shake" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-black">{player.username}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {isYou && <Badge tone="cyan">YOU</Badge>}
                      {isTurn && <Badge tone="gold">TURN</Badge>}
                      {eliminated && <Badge tone="red">ELIMINATED</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-coral" aria-label={`${player.hp} HP`}>
                    {Array.from({ length: game.maxHp || 3 }).map((_, index) => (
                      <Heart key={index} size={18} fill={index < player.hp ? "currentColor" : "none"} className={index < player.hp ? "text-coral" : "text-ink/20"} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel order-1 rounded-lg p-6 text-center lg:order-2">
        <div className="flex items-center justify-between gap-3 text-left">
          <span className="rounded-lg bg-ink/5 px-3 py-1 text-sm font-black uppercase text-ink/60">{roomCode}</span>
          {disconnected && <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1 text-sm font-black text-amber-700"><WifiOff size={15} /> Reconnecting</span>}
        </div>

        <p className="mt-7 text-sm font-black uppercase text-ink/45">{isMyTurn ? "Giliran kamu" : `Giliran ${activePlayer?.username || game.currentTurnUsername}`}</p>
        <div className="mx-auto mt-4 flex h-32 w-32 items-center justify-center rounded-lg bg-ink text-7xl font-black uppercase text-white shadow-lg">
          {game.currentLetter}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-4xl font-black text-ink">
          <Timer size={34} className={game.secondsLeft <= 5 ? "text-coral" : "text-mint"} />
          {game.secondsLeft}s
        </div>

        <div className="mx-auto mt-6 max-w-xl rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-4 text-3xl font-black tracking-wide text-cyan-900">
          {remotePreview || localPreview}
        </div>

        <form onSubmit={submit} className="mx-auto mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <input
            className="min-h-12 flex-1 rounded-lg border border-ink/15 px-4 text-lg outline-none transition focus:border-mint disabled:bg-ink/5"
            disabled={!isMyTurn}
            placeholder={isMyTurn ? `Mulai dengan ${game.currentLetter.toUpperCase()}` : "Menunggu giliran pemain lain..."}
            value={word}
            onChange={(event) => typeWord(event.target.value)}
          />
          <Button disabled={!isMyTurn} type="submit"><Send size={18} /> Submit</Button>
        </form>
      </section>

      <section className="panel order-3 rounded-lg p-5">
        <h2 className="text-xl font-black">Word Chain</h2>
        <div className="mt-4 text-sm font-bold leading-8 text-ink/75">
          {game.wordsUsed.length ? game.wordsUsed.map((item, index) => (
            <span key={`${item}_${index}`}>
              <span className="rounded-lg bg-white px-2 py-1 shadow-sm">{item}</span>
              {index < game.wordsUsed.length - 1 && <span className="mx-2 text-mint">→</span>}
            </span>
          )) : <p className="text-ink/50">Belum ada kata valid.</p>}
        </div>

        <h2 className="mt-7 text-xl font-black">Activity Log</h2>
        <div className="mt-4 space-y-2">
          {activity.length ? activity.map((item) => (
            <div key={item.id} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${item.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-800" : item.type === "error" ? "border-red-100 bg-red-50 text-red-800" : item.type === "warning" ? "border-amber-100 bg-amber-50 text-amber-800" : "border-ink/10 bg-white text-ink/65"}`}>
              {item.type === "success" && <CheckCircle2 size={15} className="mr-1 inline" />}
              {(item.type === "error" || item.type === "warning") && <AlertTriangle size={15} className="mr-1 inline" />}
              {item.message}
            </div>
          )) : <p className="text-sm text-ink/50">Aktivitas akan muncul saat match berjalan.</p>}
        </div>

        <Link to="/dashboard"><Button className="mt-6 w-full" variant="secondary">Dashboard</Button></Link>
      </section>
    </main>
  );
}

const Badge = ({ children, tone }) => {
  const tones = {
    cyan: "bg-cyan-50 text-cyan-700",
    gold: "bg-amber-100 text-amber-800",
    red: "bg-red-50 text-red-700"
  };

  return <span className={`rounded-lg px-2 py-1 text-[11px] font-black ${tones[tone]}`}>{children}</span>;
};
