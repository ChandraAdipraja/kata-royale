import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LogIn, RefreshCcw, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";
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

  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-8">
      <section className="w-full max-w-6xl">
        <Link to="/dashboard" className="inline-flex rounded-xl bg-slate-800 p-3 text-white transition hover:bg-slate-700">
          <ArrowRight className="rotate-180" size={20} />
        </Link>
        <div className="panel mt-4 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-black text-white">Lobby</h1>
              <p className="mt-2 text-sm text-slate-400">Pilih lobby publik atau masuk dengan kode untuk lobby privat.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={fetchLobbies}><RefreshCcw size={16} /> Refresh</Button>
              <Button variant="ghost" onClick={() => setShowJoinCode(true)}>Join with Code</Button>
              <Link to="/lobby/create"><Button>Create Lobby</Button></Link>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {loadingList && (
            <div className="panel rounded-2xl p-6 text-sm font-semibold text-slate-400">Loading lobby...</div>
          )}

          {!loadingList && lobbies.length === 0 && (
            <div className="panel rounded-2xl p-6 text-sm font-semibold text-slate-400">Belum ada lobby publik.</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lobbies.map((lobby) => {
              const full = lobby.playerCount >= lobby.maxPlayers;
              return (
                <div key={lobby.roomCode} className="panel rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-500">Lobby</div>
                      <div className="mt-1 text-lg font-black text-white">{lobby.name}</div>
                      <div className="mt-2 text-xs font-bold text-slate-400">Host: {lobby.hostName}</div>
                    </div>
                    <span className="rounded-xl bg-white/10 px-3 py-1 text-xs font-black text-slate-200">
                      {lobby.playerCount}/{lobby.maxPlayers}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-black text-slate-300 sm:grid-cols-4">
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-2">
                      <div className="text-[10px] uppercase text-slate-500">Max</div>
                      {lobby.maxPlayers}
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-2">
                      <div className="text-[10px] uppercase text-slate-500">Time</div>
                      {lobby.timer || "-"}
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
          <div className="panel w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Join with Code</h2>
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
                <LogIn size={18} /> {loading ? "Joining..." : "Join Lobby"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
