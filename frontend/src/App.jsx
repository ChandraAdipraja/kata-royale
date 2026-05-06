import { Route, Routes } from "react-router-dom";
import CreateLobby from "./pages/CreateLobby.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Game from "./pages/Game.jsx";
import JoinLobby from "./pages/JoinLobby.jsx";
import Landing from "./pages/Landing.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Login from "./pages/Login.jsx";
import OAuthCallback from "./pages/OAuthCallback.jsx";
import Profile from "./pages/Profile.jsx";
import Register from "./pages/Register.jsx";
import Result from "./pages/Result.jsx";
import WaitingRoom from "./pages/WaitingRoom.jsx";

export default function App() {
  return (
    <div className="page-shell min-h-screen overflow-hidden selection:bg-yellow-400 selection:text-black">
      <div className="relative z-10 h-screen overflow-y-auto px-4 sm:px-6">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lobby/create" element={<CreateLobby />} />
          <Route path="/lobby/join" element={<JoinLobby />} />
          <Route path="/lobby/:roomCode" element={<WaitingRoom />} />
          <Route path="/game/:roomCode" element={<Game />} />
          <Route path="/result/:matchId" element={<Result />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
}
