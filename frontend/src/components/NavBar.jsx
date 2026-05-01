import { Link, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Trophy, UserRound } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-black tracking-normal text-ink">
          SambungKata
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink className="hidden rounded-lg px-3 py-2 text-sm font-semibold hover:bg-ink/5 sm:inline-flex sm:items-center sm:gap-2" to="/dashboard">
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-ink/5" to="/leaderboard">
            <Trophy size={16} className="inline" /> <span className="hidden sm:inline">Leaderboard</span>
          </NavLink>
          {user ? (
            <>
              <NavLink className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-ink/5" to="/profile">
                <UserRound size={16} className="inline" /> {user.username}
              </NavLink>
              <Button variant="secondary" onClick={onLogout} aria-label="Logout">
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            <>
              <NavLink className="hidden rounded-lg px-3 py-2 text-sm font-semibold hover:bg-ink/5 sm:inline-block" to="/login">
                Login
              </NavLink>
              <NavLink className="hidden rounded-lg px-3 py-2 text-sm font-semibold hover:bg-ink/5 sm:inline-block" to="/register">
                Register
              </NavLink>
              {guestName && <span className="rounded-lg bg-ink/5 px-3 py-2 text-sm font-black text-ink/70">{guestName}</span>}
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
