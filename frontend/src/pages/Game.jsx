import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { BookOpenText, CheckCircle2, Clock3, Heart, History, Loader2, LogOut, Send, ShieldCheck, Tag, Timer, WifiOff, X, XCircle } from "lucide-react";
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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const leavingRef = useRef(false);
  const wordInputRef = useRef(null);

  const pushActivity = (entry) => {
    const time = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    setActivity((items) => [{ id: `${Date.now()}_${Math.random()}`, time, ...entry }, ...items]);
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
      pushActivity({
        playerName: nextState.currentTurnUsername,
        status: "Giliran baru",
        detail: `Mulai dengan huruf ${nextState.currentLetter?.toUpperCase() || "-"}`,
        type: "info"
      });
    };
    const onValid = (payload) => {
      showToast(`${payload.word.toUpperCase()} valid`, "success");
      pushActivity({
        playerName: payload.username,
        status: "Menjawab",
        detail: payload.word.toUpperCase(),
        type: "success"
      });
      setWord("");
      setRemotePreview("");
    };
    const onInvalid = (payload) => {
      showToast(payload.reason || "Jawaban salah", payload.reason === "Timeout" ? "warning" : "error");
      pushActivity({
        playerName: payload.username,
        status: payload.reason === "Timeout" ? "Tidak menjawab" : "Jawaban ditolak",
        detail: `${payload.reason || "Jawaban salah"} - HP -1`,
        type: payload.reason === "Timeout" ? "warning" : "error"
      });
      setShakingId(payload.playerId);
      window.setTimeout(() => setShakingId(""), 420);
    };
    const onEliminated = (payload) => {
      showToast(`${payload.username} tereliminasi`, "warning");
      pushActivity({
        playerName: payload.username,
        status: "Tereliminasi",
        detail: "HP habis",
        type: "warning"
      });
    };
    const onPlayerLeft = (payload) => {
      showToast(`${payload.username} keluar dari match`, "warning");
      pushActivity({
        playerName: payload.username,
        status: "Keluar match",
        detail: "Pemain meninggalkan room",
        type: "warning"
      });
    };
    const onFinished = (payload) => {
      sessionStorage.setItem(`result:${roomCode}`, JSON.stringify(payload));
      navigate(`/result/${roomCode}`, { state: { result: payload } });
    };
    const onDisconnect = () => {
      if (leavingRef.current) return;
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
    socket.on("game:player_left", onPlayerLeft);
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
      socket.off("game:player_left", onPlayerLeft);
      socket.off("game:finished", onFinished);
      socket.off("disconnect", onDisconnect);
      socket.off("connect", onConnect);
    };
  }, [socket, navigate, roomCode, showToast]);

  const me = useMemo(() => game?.players?.find((player) => player.socketId === socket?.id), [game, socket?.id]);
  const activePlayer = useMemo(() => game?.players?.find((player) => playerId(player) === game?.currentTurnPlayerId), [game]);
  const isMyTurn = Boolean(me && game?.currentTurnPlayerId === playerId(me));

  useEffect(() => {
    if (!isMyTurn || game?.isValidating || showLeaveConfirm) return;
    const focusTimer = window.setTimeout(() => {
      wordInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [isMyTurn, game?.isValidating, game?.currentTurnPlayerId, showLeaveConfirm]);

  const localPreview = useMemo(() => {
    const letters = word.trim().toUpperCase().split("");
    const slots = Math.max(4, letters.length || 1);
    return Array.from({ length: slots }, (_, index) => letters[index] || "_").join(" ");
  }, [word]);

  const submit = (event) => {
    event.preventDefault();
    if (!word.trim()) return showToast("Kata tidak boleh kosong", "warning");
    if (game?.isValidating) return showToast("Tunggu, kata masih dicek", "warning");

    socket.emit("game:submit_word", { roomCode, word }, (res) => {
      if (!res?.ok) showToast(res?.message || "Kata ditolak", "error");
    });
  };

  const typeWord = (value) => {
    if (game?.isValidating) return;

    setWord(value);
    socket.emit("game:typing", { roomCode, text: value });
  };

  const leaveMatch = () => {
    setShowLeaveConfirm(false);
    leavingRef.current = true;
    sessionStorage.removeItem(`game:${roomCode}`);

    if (!socket?.connected) {
      navigate("/dashboard");
      return;
    }

    socket.emit("game:leave", { roomCode }, (res) => {
      if (!res?.ok) {
        leavingRef.current = false;
        showToast(res?.message || "Gagal keluar dari match", "error");
        return;
      }

      socket.disconnect();
      navigate("/dashboard");
    });
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
      ? `Huruf ${game.currentLetter.toUpperCase()} · kategori ${categoryLabel}`
      : `Mulai dengan ${game.currentLetter.toUpperCase()}`
    : "Menunggu giliran pemain lain...";

  const validationTitle = game.currentCategory ? "AI sedang cek kategori" : "KBBI sedang cek kata";
  const validationDescription = game.currentCategory
    ? `Memastikan jawaban cocok dengan kategori ${categoryLabel}.`
    : "Memastikan kata terdaftar dan sesuai huruf awal.";
  const validationWord = game.validatingWord || (isMyTurn ? word : remotePreview.replace(/[\s_]/g, ""));

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-5">
      {game.isValidating && (
        <ValidationModal
          categoryLabel={categoryLabel}
          currentLetter={game.currentLetter}
          description={validationDescription}
          playerName={activePlayer?.username || game.currentTurnUsername}
          title={validationTitle}
          word={validationWord}
        />
      )}

      {showLeaveConfirm && (
        <LeaveMatchModal
          onCancel={() => setShowLeaveConfirm(false)}
          onConfirm={leaveMatch}
        />
      )}

      <section className="panel rounded-2xl px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-white/10 px-3 py-2 font-mono text-sm font-black uppercase text-slate-300">Room {roomCode}</span>
            {disconnected && <span className="inline-flex items-center gap-1 rounded-xl bg-amber-400/10 px-3 py-2 text-sm font-black text-amber-300"><WifiOff size={15} /> Reconnecting</span>}
          </div>
          <Button variant="ghost" className="!min-h-9 !px-3 !py-1.5" onClick={() => setShowLeaveConfirm(true)} type="button">
            <LogOut size={16} /> Keluar Match
          </Button>
        </div>
      </section>

      <section className="flex justify-center gap-3 overflow-x-auto px-1 py-3 no-scrollbar">
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

      <section className="panel rounded-2xl p-6 text-center">
        <p className="text-sm font-black uppercase tracking-widest text-slate-400">
          {game.isValidating ? "Validasi jawaban" : isMyTurn ? "Giliran kamu" : `Giliran ${activePlayer?.username || game.currentTurnUsername}`}
        </p>

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

        {categoryLabel && (
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/15 px-6 py-2.5">
              <Tag size={14} className="text-violet-400 shrink-0" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Kategori</span>
              <span className="text-lg font-black capitalize text-violet-200">{categoryLabel}</span>
            </div>
          </div>
        )}

        {game.isValidating && (
          <div className="mx-auto mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-sm font-black text-yellow-100">
            <Loader2 size={16} className="shrink-0 animate-spin" />
            <span className="truncate">{validationTitle}</span>
          </div>
        )}

        <div className={`text-center justify-center mx-auto flex max-w-xl items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4 ${categoryLabel ? "mt-4" : "mt-8"}`}>
          <div className="text-center items-center min-w-0 w-full">
            <div className="text-center mt-1 break-words text-3xl font-black tracking-wide text-cyan-100">{remotePreview || localPreview}</div>
          </div>
        </div>

        <form onSubmit={submit} className="mx-auto mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <input
            ref={wordInputRef}
            className="game-input min-h-14 flex-1 px-5 text-lg font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!isMyTurn || game.isValidating}
            placeholder={inputPlaceholder}
            value={word}
            onChange={(event) => typeWord(event.target.value)}
          />
          <Button disabled={!isMyTurn || game.isValidating} type="submit">
            {game.isValidating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {game.isValidating ? "Mengecek" : "Submit"}
          </Button>
        </form>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <TimelineCard items={activity} />
        <UsedWordsCard words={game.wordsUsed || []} />
      </section>
    </main>
  );
}

const ValidationModal = ({ categoryLabel, currentLetter, description, playerName, title, word }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 px-4 backdrop-blur-sm" role="status" aria-live="polite">
    <div className="w-full max-w-md rounded-2xl border border-yellow-300/30 bg-slate-950/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-yellow-300/35 bg-yellow-300/10 text-yellow-200">
        <Loader2 size={34} className="animate-spin" />
      </div>
      <h2 className="mt-5 text-2xl font-black text-white">{title}</h2>
      <p className="mt-2 text-sm font-semibold text-slate-300">{description}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 text-left">
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">Pemain</div>
          <div className="mt-1 truncate font-black text-white">{playerName || "Player"}</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">Awalan</div>
          <div className="mt-1 font-black uppercase text-yellow-200">{currentLetter}</div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3">
        <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wide text-cyan-200">
          <ShieldCheck size={14} />
          Jawaban
        </div>
        <div className="mt-1 break-words text-2xl font-black uppercase text-white">{word?.trim() || "..."}</div>
      </div>

      {categoryLabel && (
        <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/15 px-4 py-2">
          <Tag size={14} className="shrink-0 text-violet-300" />
          <span className="truncate text-sm font-black capitalize text-violet-100">{categoryLabel}</span>
        </div>
      )}
    </div>
  </div>
);

const LeaveMatchModal = ({ onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="leave-match-title">
    <div className="panel w-full max-w-md rounded-2xl p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 id="leave-match-title" className="text-xl font-black text-white">Keluar dari match?</h2>
        <button className="text-slate-400 transition hover:text-white" onClick={onCancel} type="button" aria-label="Tutup modal">
          <X size={20} />
        </button>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-400">
        Kamu akan keluar dari room ini, dianggap gugur dari match, dan koneksi socket untuk match akan diputus.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" className="w-full" onClick={onCancel} type="button">
          Batal
        </Button>
        <Button variant="danger" className="w-full" onClick={onConfirm} type="button">
          Keluar
        </Button>
      </div>
    </div>
  </div>
);

const TimelineCard = ({ items }) => (
  <section className="panel rounded-2xl p-5">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <History size={18} className="text-yellow-300" />
        <h2 className="text-lg font-black text-white">Timeline</h2>
      </div>
      <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-black text-slate-300">{items.length}</span>
    </div>

    <div className="custom-scrollbar mt-4 h-72 overflow-y-auto pr-2">
      {items.length === 0 ? (
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/35 px-4 text-center text-sm font-semibold text-slate-400">
          Aktivitas jawaban akan muncul di sini.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <TimelineItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  </section>
);

const TimelineItem = ({ item }) => {
  const typeStyle = {
    success: {
      icon: CheckCircle2,
      ring: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
      badge: "bg-emerald-400/10 text-emerald-200"
    },
    warning: {
      icon: Clock3,
      ring: "border-amber-300/30 bg-amber-300/10 text-amber-200",
      badge: "bg-amber-300/10 text-amber-200"
    },
    error: {
      icon: XCircle,
      ring: "border-rose-400/30 bg-rose-400/10 text-rose-200",
      badge: "bg-rose-400/10 text-rose-200"
    },
    info: {
      icon: Timer,
      ring: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
      badge: "bg-cyan-400/10 text-cyan-200"
    }
  };
  const style = typeStyle[item.type] || typeStyle.info;
  const Icon = style.icon;

  return (
    <article className="rounded-xl border border-slate-700 bg-slate-950/55 p-3">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${style.ring}`}>
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-black text-white">{item.playerName || "Player"}</span>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-black uppercase ${style.badge}`}>{item.status}</span>
          </div>
          <p className="mt-1 break-words text-sm font-semibold text-slate-300">{item.detail}</p>
        </div>
        <time className="shrink-0 text-[11px] font-bold text-slate-500">{item.time}</time>
      </div>
    </article>
  );
};

const UsedWordsCard = ({ words }) => (
  <section className="panel rounded-2xl p-5">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <BookOpenText size={18} className="text-cyan-300" />
        <h2 className="text-lg font-black text-white">Kata Dipakai</h2>
      </div>
      <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-black text-slate-300">{words.length}</span>
    </div>

    <div className="custom-scrollbar mt-4 h-72 overflow-y-auto pr-2">
      {words.length === 0 ? (
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/35 px-4 text-center text-sm font-semibold text-slate-400">
          Belum ada kata valid yang digunakan.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
          {words.map((usedWord, index) => (
            <div key={`${usedWord}_${index}`} className="min-w-0 rounded-xl border border-cyan-400/15 bg-cyan-400/10 px-3 py-2">
              <div className="text-[10px] font-black uppercase text-cyan-300/70">#{index + 1}</div>
              <div className="mt-0.5 truncate text-sm font-black uppercase text-cyan-50" title={usedWord}>{usedWord}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
);

const Badge = ({ children, tone }) => {
  const tones = {
    cyan: "bg-cyan-400/15 text-cyan-200",
    gold: "bg-yellow-400/15 text-yellow-200",
    red: "bg-rose-400/15 text-rose-200"
  };

  return <span className={`rounded-lg px-2 py-1 text-[11px] font-black ${tones[tone]}`}>{children}</span>;
};
