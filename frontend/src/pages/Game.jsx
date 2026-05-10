import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Crown, Heart, Send, Sparkles, Tag, Timer, WifiOff } from "lucide-react";
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

  const categoryLabel = game.currentCategory
    ? game.currentCategory.charAt(0).toUpperCase() + game.currentCategory.slice(1)
    : null;

  const inputPlaceholder = isMyTurn
    ? game.currentCategory
      ? `Huruf ${game.currentLetter.toUpperCase()} - kategori ${categoryLabel}`
      : `Mulai dengan ${game.currentLetter.toUpperCase()}`
    : "Menunggu giliran pemain lain...";

  const timerTotal = Number(game.timer || 15);
  const timerPercent = Math.max(0, Math.min(100, (Number(game.secondsLeft || 0) / timerTotal) * 100));
  const dangerTime = game.secondsLeft <= 5;
  const previewText = remotePreview || localPreview;
  const recentWords = [...(game.wordsUsed || [])].slice(-8).reverse();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-5">
      <section className="panel rounded-2xl px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="rounded-xl bg-slate-950 px-3 py-2 font-mono text-sm font-black uppercase text-slate-200">Room {roomCode}</span>
            <StatusPill tone="gold" icon={Sparkles}>{game.status}</StatusPill>
            {categoryLabel && <StatusPill tone="violet" icon={Tag}>{categoryLabel}</StatusPill>}
            {disconnected && <StatusPill tone="amber" icon={WifiOff}>Reconnecting</StatusPill>}
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" className="!min-h-9 !px-3 !py-1.5">Dashboard</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {game.players.map((player) => (
            <PlayerCard
              game={game}
              isTurn={game.currentTurnPlayerId === playerId(player)}
              isYou={player.socketId === socket?.id}
              key={playerId(player)}
              player={player}
              shaking={shakingId === playerId(player)}
            />
          ))}
        </section>

        <section className="grid items-start gap-4">
          <section className="arena-stage relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/70 p-5 text-center shadow-2xl shadow-slate-950/30 sm:p-7">
            <div className="mx-auto flex max-w-3xl flex-col items-center">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                {isMyTurn ? "Giliran kamu" : `Giliran ${activePlayer?.username || game.currentTurnUsername}`}
              </p>

              <div
                className="relative mt-5 flex h-64 w-64 items-center justify-center rounded-full p-3 sm:h-72 sm:w-72"
                style={{
                  background: `conic-gradient(${dangerTime ? "#fb7185" : "#facc15"} ${timerPercent}%, rgba(51,65,85,0.9) 0)`
                }}
              >
                <div className="absolute inset-3 rounded-full bg-slate-950 shadow-inner" />
                <div className="absolute inset-7 rounded-full border border-slate-800 bg-slate-900/85" />
                <div className="relative flex flex-col items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Awalan</span>
                  <span className="mt-1 text-8xl font-black uppercase leading-none text-white drop-shadow sm:text-9xl">{game.currentLetter}</span>
                  <span className={`mt-4 inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-lg font-black ${dangerTime ? "bg-rose-500 text-white" : "bg-yellow-400 text-slate-950"}`}>
                    <Timer size={17} />
                    {game.secondsLeft}s
                  </span>
                </div>
              </div>

              {categoryLabel && (
                <div className="mt-7 inline-flex max-w-full items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/15 px-6 py-2.5">
                  <Tag size={14} className="shrink-0 text-violet-300" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Kategori</span>
                  <span className="truncate text-lg font-black capitalize text-violet-100">{categoryLabel}</span>
                </div>
              )}

              <div className={`w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-5 ${categoryLabel ? "mt-4" : "mt-8"}`}>
                <div className="text-xs font-black uppercase tracking-widest text-cyan-300/80">
                  {remotePreview ? "Typing preview" : "Word preview"}
                </div>
                <div className="mt-3 min-h-[48px] break-words text-3xl font-black tracking-wide text-cyan-50 sm:text-4xl">
                  {previewText}
                </div>
              </div>

              <form onSubmit={submit} className="mt-5 w-full max-w-2xl">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    className="game-input min-h-14 flex-1 px-5 text-center text-lg font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50 sm:text-left"
                    disabled={!isMyTurn || game.isValidating}
                    placeholder={game.isValidating ? "Sedang validasi..." : inputPlaceholder}
                    value={word}
                    onChange={(event) => typeWord(event.target.value)}
                  />
                  <Button disabled={!isMyTurn || game.isValidating} type="submit">
                    <Send size={18} />
                    {game.isValidating ? "Check" : "Submit"}
                  </Button>
                </div>
              </form>

              <div className="mt-5 grid w-full gap-3 sm:grid-cols-3">
                <MiniStat label="Pemain Hidup" value={game.players.filter((player) => player.alive && player.hp > 0).length} />
                <MiniStat label="Kata Valid" value={game.wordsUsed?.length || 0} tone="cyan" />
                <MiniStat label="Mode" value={categoryLabel ? "Kategori" : "Classic"} tone={categoryLabel ? "violet" : "gold"} />
              </div>
            </div>
          </section>
        </section>

        <aside className="grid min-h-0 gap-4 sm:grid-cols-2">
          <section className="panel rounded-2xl p-4">
            <h2 className="flex items-center gap-2 text-lg font-black text-white">
              <Sparkles size={19} className="text-yellow-300" />
              Timeline
            </h2>
            <div className="luxury-scroll mt-4 h-56 space-y-2 overflow-y-auto pr-2">
              {activity.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm font-semibold text-slate-500">
                  Menunggu aksi pertama.
                </div>
              )}
              {activity.map((item) => (
                <ActivityItem item={item} key={item.id} />
              ))}
            </div>
          </section>

          <section className="panel rounded-2xl p-4">
            <h2 className="flex items-center gap-2 text-lg font-black text-white">
              <CheckCircle2 size={19} className="text-emerald-300" />
              Kata Terakhir
            </h2>
            <div className="luxury-scroll mt-4 flex h-56 flex-wrap content-start gap-2 overflow-y-auto pr-2">
              {recentWords.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm font-semibold text-slate-500">
                  Belum ada kata valid.
                </div>
              )}
              {recentWords.map((item) => (
                <span key={item} className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-black uppercase text-emerald-100">
                  {item}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

const StatusPill = ({ children, icon: Icon, tone = "slate" }) => {
  const tones = {
    slate: "border-slate-600 bg-white/10 text-slate-200",
    gold: "border-yellow-400/25 bg-yellow-400/10 text-yellow-200",
    violet: "border-violet-400/25 bg-violet-400/10 text-violet-200",
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-200"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black uppercase ${tones[tone] || tones.slate}`}>
      {Icon && <Icon size={14} />}
      {children}
    </span>
  );
};

const PlayerCard = ({ game, player, isTurn, isYou, shaking }) => {
  const eliminated = player.hp <= 0 || !player.alive;

  return (
    <article
      className={`relative min-h-[148px] overflow-hidden rounded-2xl border p-4 transition duration-300 ${
        isTurn
          ? "border-yellow-300 bg-gradient-to-br from-indigo-600 to-slate-900 shadow-[0_0_28px_rgba(250,204,21,0.22)]"
          : "border-slate-700 bg-slate-900/80"
      } ${eliminated ? "opacity-50 grayscale" : ""} ${shaking ? "shake" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            alt={`${player.username} avatar`}
            className="h-12 w-12 shrink-0 rounded-full border border-slate-700 bg-slate-950 object-cover"
            src={`/avatars/${player.avatar || "Avatar1.png"}`}
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-white">{player.username}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {isYou && <Badge tone="cyan">YOU</Badge>}
              {isTurn && <Badge tone="gold">TURN</Badge>}
              {eliminated && <Badge tone="red">OUT</Badge>}
            </div>
          </div>
        </div>
        {isTurn && <Crown size={21} className="shrink-0 text-yellow-300" fill="currentColor" />}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1 text-rose-400" aria-label={`${player.hp} HP`}>
          {Array.from({ length: game.maxHp || 3 }).map((_, index) => (
            <Heart key={index} size={16} fill={index < player.hp ? "currentColor" : "none"} className={index < player.hp ? "text-rose-400" : "text-slate-600"} />
          ))}
        </div>
        <span className="rounded-lg bg-slate-950/70 px-2 py-1 text-xs font-black text-slate-300">{Math.max(player.hp, 0)} HP</span>
      </div>
    </article>
  );
};

const MiniStat = ({ label, value, tone = "slate" }) => {
  const tones = {
    slate: "border-slate-700 bg-slate-950/60 text-slate-100",
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
    gold: "border-yellow-400/20 bg-yellow-400/10 text-yellow-100",
    violet: "border-violet-400/20 bg-violet-400/10 text-violet-100"
  };

  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${tones[tone] || tones.slate}`}>
      <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
    </div>
  );
};

const ActivityItem = ({ item }) => {
  const styles = {
    success: {
      icon: CheckCircle2,
      className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
    },
    error: {
      icon: AlertTriangle,
      className: "border-rose-400/20 bg-rose-400/10 text-rose-100"
    },
    warning: {
      icon: AlertTriangle,
      className: "border-amber-400/20 bg-amber-400/10 text-amber-100"
    },
    info: {
      icon: Timer,
      className: "border-slate-700 bg-slate-950/50 text-slate-200"
    }
  };

  const style = styles[item.type] || styles.info;
  const Icon = style.icon;

  return (
    <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${style.className}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{item.message}</span>
    </div>
  );
};

const Badge = ({ children, tone }) => {
  const tones = {
    cyan: "bg-cyan-400/15 text-cyan-200",
    gold: "bg-yellow-400/15 text-yellow-200",
    red: "bg-rose-400/15 text-rose-200"
  };

  return <span className={`rounded-lg px-2 py-1 text-[11px] font-black ${tones[tone]}`}>{children}</span>;
};
