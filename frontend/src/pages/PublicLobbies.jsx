import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, Filter, LogIn, RefreshCcw, Search, Tag, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../hooks/useSocket.js";
import { useToast } from "../context/ToastContext.jsx";
import { api } from "../services/api.js";

export default function PublicLobbies() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { showToast } = useToast();
  const { user, guestName, guestId, enterGuest } = useAuth();
  const [guestInput, setGuestInput] = useState(guestName);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [lobbies, setLobbies] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [modeFilter, setModeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLobbies = async () => {
    setLoadingList(true);
    try {
      const { data } = await api.get("/lobbies/public");
      setLobbies(data.lobbies || []);
    } catch (_error) {
      showToast("Gagal memuat lobby publik", "error");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchLobbies();
  }, []);

  const joinLobby = (code) => {
    const guest = !user && !guestName ? enterGuest(guestInput) : { guestName, guestId };
    if (!socket?.connected) return showToast("Socket belum terhubung. Coba lagi sebentar.", "warning");

    setLoading(true);
    socket.auth = { ...socket.auth, guestName: guest.guestName || guestInput, guestId: guest.guestId };
    socket.emit("lobby:join", { roomCode: code, guestName: guest.guestName || guestInput, guestId: guest.guestId }, (res) => {
      setLoading(false);
      if (!res?.ok) return showToast(res?.message || "Gagal join lobby", "error");
      showToast("Berhasil join lobby", "success");
      if (res.gameState) {
        navigate(`/game/${code}`, { state: { gameState: res.gameState } });
      } else {
        navigate(`/lobby/${code}`, { state: { lobby: res.lobby } });
      }
    });
  };

  const joinByCode = (event) => {
    event.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (!code) return showToast("Room code wajib diisi", "warning");
    const guest = !user && !guestName ? enterGuest(guestInput) : { guestName, guestId };
    if (!socket?.connected) return showToast("Socket belum terhubung. Coba lagi sebentar.", "warning");

    setLoading(true);
    socket.auth = { ...socket.auth, guestName: guest.guestName || guestInput, guestId: guest.guestId };
    socket.emit("lobby:join", { roomCode: code, guestName: guest.guestName || guestInput, guestId: guest.guestId }, (res) => {
      setLoading(false);
      if (!res?.ok) return showToast(res?.message || "Gagal join lobby", "error");
      showToast("Berhasil join lobby", "success");
      if (res.gameState) {
        navigate(`/game/${code}`, { state: { gameState: res.gameState } });
      } else {
        navigate(`/lobby/${code}`, { state: { lobby: res.lobby } });
      }
    });
  };

  const filteredLobbies = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return lobbies.filter((lobby) => {
      const matchesMode =
        modeFilter === "all" ||
        (modeFilter === "category" && lobby.categoryChallenge) ||
        (modeFilter === "classic" && !lobby.categoryChallenge) ||
        (modeFilter === "open" && lobby.playerCount < lobby.maxPlayers);

      const matchesSearch =
        !query ||
        lobby.name?.toLowerCase().includes(query) ||
        lobby.hostName?.toLowerCase().includes(query) ||
        lobby.roomCode?.toLowerCase().includes(query);

      return matchesMode && matchesSearch;
    });
  }, [lobbies, modeFilter, searchTerm]);

  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-8">
      <section className="w-full max-w-6xl">
        <Link to="/dashboard" className="inline-flex rounded-xl bg-slate-800 p-3 text-white transition hover:bg-slate-700">
          <ArrowRight className="rotate-180" size={20} />
        </Link>
        <div className="game-surface mt-4 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="section-kicker"><UsersRound size={15} /> Matchmaking</p>
              <h1 className="mt-2 text-3xl font-black text-white">Lobby Publik</h1>
              <p className="mt-2 text-sm font-semibold text-slate-400">Pilih room yang masih kosong atau masuk dengan kode untuk lobby privat.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={fetchLobbies}><RefreshCcw size={16} /> Refresh</Button>
              <Button variant="ghost" onClick={() => setShowJoinCode(true)}>Join Kode</Button>
              <Link to="/lobby/create"><Button>Buat Lobby</Button></Link>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              className="game-input min-h-12 pl-11 pr-4"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari lobby, host, atau kode..."
              value={searchTerm}
            />
          </label>
          <div className="flex flex-wrap gap-2 rounded-xl border border-slate-700 bg-slate-950/35 p-1">
            <FilterButton active={modeFilter === "all"} onClick={() => setModeFilter("all")}>Semua</FilterButton>
            <FilterButton active={modeFilter === "open"} onClick={() => setModeFilter("open")}>Tersedia</FilterButton>
            <FilterButton active={modeFilter === "classic"} onClick={() => setModeFilter("classic")}>Classic</FilterButton>
            <FilterButton active={modeFilter === "category"} onClick={() => setModeFilter("category")}>Kategori</FilterButton>
          </div>
        </div>

        <div className="mt-6">
          {loadingList && (
            <div className="game-surface rounded-2xl p-6 text-sm font-semibold text-slate-400">Memuat lobby...</div>
          )}

          {!loadingList && filteredLobbies.length === 0 && (
            <div className="game-surface rounded-2xl p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/60 text-slate-300">
                <Filter size={24} />
              </div>
              <h2 className="mt-4 text-xl font-black text-white">Lobby belum ketemu</h2>
              <p className="mt-2 text-sm font-semibold text-slate-400">Coba refresh, ubah filter, atau buat lobby baru.</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLobbies.map((lobby) => {
              const full = lobby.playerCount >= lobby.maxPlayers;
              return (
                <div key={lobby.roomCode} className={`game-surface rounded-2xl p-5 transition hover:border-yellow-400/35 ${full ? "opacity-65" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-500">Lobby</div>
                      <div className="mt-1 text-lg font-black text-white">{lobby.name}</div>
                      <div className="mt-2 text-xs font-bold text-slate-400">Host: {lobby.hostName}</div>
                    </div>
                    <span className={`rounded-xl px-3 py-1 text-xs font-black ${full ? "bg-rose-400/10 text-rose-200" : "bg-emerald-400/10 text-emerald-200"}`}>
                      {lobby.playerCount}/{lobby.maxPlayers}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-black text-slate-300 sm:grid-cols-4">
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-2">
                      <div className="text-[10px] uppercase text-slate-500">Max</div>
                      {lobby.maxPlayers}
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-2">
                      <div className="text-[10px] uppercase text-slate-500">Timer</div>
                      <span className="inline-flex items-center justify-center gap-1"><Clock3 size={11} /> {lobby.timer || "-"}</span>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-2">
                      <div className="text-[10px] uppercase text-slate-500">HP</div>
                      {lobby.hp || "-"}
                    </div>
                    <div className={`rounded-lg border px-2 py-2 ${lobby.categoryChallenge ? "border-violet-400/30 bg-violet-500/15 text-violet-100" : "border-slate-700 bg-slate-900/70 text-slate-400"}`}>
                      <div className="text-[10px] uppercase text-slate-500">Kategori</div>
                      <span className="inline-flex items-center justify-center gap-1">
                        <Tag size={11} /> {lobby.categoryChallenge ? "On" : "Off"}
                      </span>
                    </div>
                  </div>

                  <Button className="mt-4 w-full" disabled={full || loading} onClick={() => joinLobby(lobby.roomCode)}>
                    {full ? "Penuh" : "Join"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {showJoinCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="game-surface w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Join dengan Kode</h2>
              <button className="text-slate-400 transition hover:text-white" onClick={() => setShowJoinCode(false)} type="button">
                <X size={20} />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-400">Masukkan kode lobby privat untuk bergabung.</p>

            <form onSubmit={joinByCode} className="mt-4 space-y-3">
              {!user && !guestName && (
                <label className="block">
                  <span className="text-sm font-black text-slate-300">Nama guest</span>
                  <input className="game-input mt-2 px-4 py-3" value={guestInput} onChange={(event) => setGuestInput(event.target.value)} placeholder="Guest_1234" />
                </label>
              )}

              <label className="block">
                <span className="text-sm font-black text-slate-300">Room code</span>
                <input className="game-input mt-2 px-4 py-3 font-black uppercase tracking-wide" value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} placeholder="ABC123" />
              </label>

              <Button className="w-full" disabled={loading} type="submit">
                <LogIn size={18} /> {loading ? "Bergabung..." : "Join Lobby"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

const FilterButton = ({ active, children, onClick }) => (
  <button
    className={`min-h-10 rounded-lg px-3 text-xs font-black uppercase transition ${active ? "bg-yellow-400 text-yellow-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
);
