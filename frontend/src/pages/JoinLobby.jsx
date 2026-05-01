import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useSocket } from "../hooks/useSocket.js";

export default function JoinLobby() {
  const socket = useSocket();
  const navigate = useNavigate();
  const { user, guestName, guestId, enterGuest } = useAuth();
  const { showToast } = useToast();
  const [guestInput, setGuestInput] = useState(guestName);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (event) => {
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
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8">
      <form onSubmit={submit} className="panel w-full rounded-2xl p-6">
        <h1 className="text-3xl font-black text-white">Join Lobby</h1>
        <p className="mt-2 text-slate-400">Masukkan room code dari host untuk masuk waiting room.</p>

        {!user && !guestName && (
          <label className="mt-6 block">
            <span className="text-sm font-black text-slate-300">Nama guest</span>
            <input className="game-input mt-2 px-4 py-3" value={guestInput} onChange={(event) => setGuestInput(event.target.value)} placeholder="Guest_1234" />
          </label>
        )}

        <label className="mt-6 block">
          <span className="text-sm font-black text-slate-300">Room code</span>
          <input className="game-input mt-2 px-4 py-4 text-2xl font-black uppercase tracking-wide" value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} placeholder="ABC123" />
        </label>

        <Button className="mt-6 w-full" disabled={loading} type="submit">
          <LogIn size={18} /> {loading ? "Joining..." : "Join Lobby"}
        </Button>
      </form>
    </main>
  );
}
