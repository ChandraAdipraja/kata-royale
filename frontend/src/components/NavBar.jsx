import { Link, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Swords, Trophy, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "./Button.jsx";

export const NavBar = () => {
  const { user, guestName, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-700/70 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="inline-flex items-center gap-2 text-xl font-black tracking-normal text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-slate-950 shadow-[0_3px_0_rgb(161,98,7)]">
            <Swords size={20} />
          </span>
          Kata Royale
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white sm:inline-flex sm:items-center sm:gap-2" to="/dashboard">
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink className="rounded-xl px-3 py-2 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white" to="/leaderboard">
            <Trophy size={16} className="inline" /> <span className="hidden sm:inline">Leaderboard</span>
          </NavLink>
          {user ? (
            <>
              <NavLink className="rounded-xl px-3 py-2 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white" to="/profile">
                <UserRound size={16} className="inline" /> {user.username}
              </NavLink>
              <Button variant="secondary" onClick={onLogout} aria-label="Logout">
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            <>
              <NavLink className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white sm:inline-block" to="/login">
                Login
              </NavLink>
              <NavLink className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white sm:inline-block" to="/register">
                Register
              </NavLink>
              {guestName && <span className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-yellow-300">{guestName}</span>}
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
