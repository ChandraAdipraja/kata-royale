import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar.jsx";
import CreateLobby from "./pages/CreateLobby.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Game from "./pages/Game.jsx";
import JoinLobby from "./pages/JoinLobby.jsx";
import Landing from "./pages/Landing.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Register from "./pages/Register.jsx";
import Result from "./pages/Result.jsx";
import WaitingRoom from "./pages/WaitingRoom.jsx";

export default function App() {
  return (
    <div className="page-shell">
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
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
  );
}
