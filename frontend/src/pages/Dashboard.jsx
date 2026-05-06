import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LogIn, LogOut, Play, Plus, Trophy, User, UserPlus, UsersRound } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, displayName, guestName, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col py-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              aria-label="Edit profile avatar"
              className="rounded-full transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              state={{ openAvatarEditor: true }}
              to="/profile"
            >
              <img
                alt={`${user.username} avatar`}
                className="h-12 w-12 rounded-full border-2 border-slate-800 bg-slate-900 object-cover"
                src={`/avatars/${user.avatar || "Avatar1.png"}`}
              />
            </Link>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-800 bg-gradient-to-br from-yellow-400 to-amber-600 text-xl font-black text-slate-950">
              {displayName?.charAt(0)?.toUpperCase() || "G"}
            </div>
          )}
          <div>
            <h1 className="text-lg font-black leading-tight text-white">{displayName}</h1>
            <p className="flex items-center gap-1 text-sm font-bold text-yellow-400"><Trophy size={14} /> {user ? `${user.winrate}% Winrate` : "Guest Mode"}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to="/leaderboard"><Button variant="ghost" className="!min-h-11 !px-3" aria-label="Leaderboard"><Trophy size={20} /></Button></Link>
          <Link to="/profile"><Button variant="ghost" className="!min-h-11 !px-3" aria-label="Profile"><User size={20} /></Button></Link>
          <Button variant="ghost" className="!min-h-11 !px-3 text-rose-300 hover:bg-rose-500/10" onClick={onLogout} aria-label="Logout"><LogOut size={20} /></Button>
        </div>
      </header>

      {!user && (
        <section className="panel mb-6 rounded-2xl p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="font-semibold text-slate-300">Kamu bermain sebagai {guestName || "Guest"}. Login untuk menyimpan statistik permanen.</p>
            <div className="flex gap-2">
              <Link to="/login"><Button variant="secondary"><LogIn size={16} /> Login</Button></Link>
              <Link to="/register"><Button variant="cyan"><UserPlus size={16} /> Register</Button></Link>
            </div>
          </div>
        </section>
      )}

      <section className="grid flex-1 items-center gap-6 md:grid-cols-2">
        <ActionCard
          icon={UsersRound}
          title="Buat Lobby"
          description="Jadi host, atur HP dan timer, lalu undang teman-temanmu untuk bermain bersama."
          to="/lobby/create"
          button="Buat Ruangan"
          buttonIcon={Play}
          tone="indigo"
        />
        <ActionCard
          icon={ArrowRight}
          title="Gabung Lobby"
          description="Lihat daftar lobby publik dan masuk via kode untuk lobby privat."
          to="/lobby/public"
          button="Lihat Lobby"
          buttonIcon={Plus}
          tone="cyan"
        />
      </section>
    </main>
  );
}

const ActionCard = ({ icon: Icon, title, description, to, button, buttonIcon: ButtonIcon, tone }) => {
  const iconTone = tone === "cyan" ? "bg-cyan-500/20 text-cyan-300" : "bg-indigo-500/20 text-indigo-300";

  return (
    <section className="panel group flex min-h-[320px] flex-col items-center justify-center rounded-2xl p-6 text-center transition hover:border-yellow-400/45">
      <div className={`rounded-full p-6 transition group-hover:scale-110 ${iconTone}`}>
        <Icon size={48} />
      </div>
      <h2 className="mt-6 text-2xl font-black text-white">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">{description}</p>
      <Link to={to} className="mt-6 w-full">
        <Button className="w-full">
          {ButtonIcon && <ButtonIcon size={18} />}
          {button}
        </Button>
      </Link>
    </section>
  );
};
