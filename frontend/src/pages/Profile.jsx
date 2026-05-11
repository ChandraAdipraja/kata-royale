import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Pencil, Settings, X } from "lucide-react";
import { AvatarSelector } from "../components/AvatarSelector.jsx";
import { Button } from "../components/Button.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";

export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, updateUser } = useAuth();
  const { showToast } = useToast();
  const [user, setUser] = useState(authUser);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editMode, setEditMode] = useState("all");
  const [usernameInput, setUsernameInput] = useState(authUser?.username || "");

  const openProfileEditor = (mode = "all") => {
    setUsernameInput(user?.username || authUser?.username || "");
    setEditMode(mode);
    setEditingProfile(true);
  };
  const closeAvatarEditor = () => setEditingProfile(false);
  const toggleProfileEditor = () => {
    if (editingProfile) {
      setEditingProfile(false);
      return;
    }

    openProfileEditor("all");
  };

  useEffect(() => {
    if (!authUser) return;
    api.get("/users/profile").then(({ data }) => {
      setUser(data.user);
      setUsernameInput(data.user.username);
    });
  }, [authUser]);

  useEffect(() => {
    if (!location.state?.openAvatarEditor) return;
    openProfileEditor("avatar");
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  if (!authUser) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/dashboard" className="mb-6 inline-flex rounded-xl bg-slate-800 p-3 text-white transition hover:bg-slate-700">
          <ArrowRight className="rotate-180" size={24} />
        </Link>
        <section className="panel rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-black text-white">Profile permanen butuh akun</h1>
          <p className="mt-3 text-slate-400">Guest tetap bisa bermain, tetapi statistik match, winrate, dan kata valid hanya disimpan untuk user login.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/login"><Button variant="secondary">Login</Button></Link>
            <Link to="/register"><Button>Buat Akun</Button></Link>
          </div>
        </section>
      </main>
    );
  }

  if (!user) return <main className="mx-auto max-w-4xl px-4 py-10 text-slate-300">Loading profile...</main>;

  const changeAvatar = async (avatar) => {
    if (avatar === user.avatar || savingAvatar) return;

    setSavingAvatar(true);
    try {
      const { data } = await api.patch("/users/avatar", { avatar });
      setUser(data.user);
      updateUser(data.user);
      closeAvatarEditor();
    } finally {
      setSavingAvatar(false);
    }
  };

  const saveUsername = async (event) => {
    event.preventDefault();
    const nextUsername = usernameInput.trim();
    if (nextUsername === user.username || savingName) return;

    setSavingName(true);
    try {
      const { data } = await api.patch("/users/profile", { username: nextUsername });
      setUser(data.user);
      updateUser(data.user);
      setUsernameInput(data.user.username);
      closeAvatarEditor();
      showToast("Nama profile diperbarui", "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Gagal update nama", "error");
    } finally {
      setSavingName(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <Link to="/dashboard" className="rounded-xl bg-slate-800 p-3 text-white transition hover:bg-slate-700">
          <ArrowRight className="rotate-180" size={24} />
        </Link>
        <h1 className="text-2xl font-black text-white">Profil Pemain</h1>
        <button
          aria-label="Edit Profile"
          className="rounded-xl bg-slate-800 p-3 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          onClick={toggleProfileEditor}
          type="button"
        >
          <Settings size={24} />
        </button>
      </div>
      <section className="panel rounded-2xl p-6">
        <p className="text-sm font-black uppercase text-yellow-300">Player Profile</p>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0">
            <img
              alt={`${user.username} avatar`}
              className="h-24 w-24 rounded-full border-4 border-slate-800 bg-slate-900 object-cover shadow-xl"
              src={`/avatars/${user.avatar || "Avatar1.png"}`}
            />
            <button
              aria-label="Edit avatar"
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 bg-yellow-400 text-slate-950 shadow-lg transition hover:bg-yellow-300"
              onClick={() => openProfileEditor("avatar")}
              type="button"
            >
              <Pencil size={16} />
            </button>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="break-words text-4xl font-black text-white">{user.username}</h1>
              <Button variant="ghost" className="!min-h-9 !px-3 !py-1.5" onClick={() => openProfileEditor("name")} type="button">
                <Pencil size={15} /> Edit
              </Button>
            </div>
            <p className="mt-1 text-slate-400">{user.email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Match" value={user.totalMatch} tone="mint" />
          <StatCard label="Win" value={user.win} tone="cyan" />
          <StatCard label="Lose" value={user.lose} tone="purple" />
          <StatCard label="Winrate" value={`${user.winrate}%`} tone="amber" />
          <StatCard label="Kata Valid" value={user.totalValidWords} />
        </div>
      </section>

      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
          <section className="panel max-h-full w-full max-w-3xl overflow-y-auto rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase text-yellow-300">Edit Profile</p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  {editMode === "name" ? "Edit Nama" : editMode === "avatar" ? "Pilih Avatar" : "Nama dan Avatar"}
                </h2>
              </div>
              <button
                aria-label="Tutup edit profile"
                className="rounded-xl bg-slate-800 p-3 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                onClick={closeAvatarEditor}
                type="button"
              >
                <X size={22} />
              </button>
            </div>

            {(editMode === "name" || editMode === "all") && (
              <form onSubmit={saveUsername} className={editMode === "all" ? "mb-6" : ""}>
                <label className="block">
                  <span className="text-sm font-black text-slate-300">Nama pemain</span>
                  <input
                    className="game-input mt-2 px-4 py-3 font-bold"
                    maxLength={24}
                    minLength={3}
                    onChange={(event) => setUsernameInput(event.target.value)}
                    placeholder="Username"
                    value={usernameInput}
                  />
                </label>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-slate-500">3-24 karakter, huruf, angka, spasi, dan underscore.</p>
                  <Button disabled={savingName || usernameInput.trim() === user.username} type="submit">
                    {savingName ? "Menyimpan..." : "Simpan Nama"}
                  </Button>
                </div>
              </form>
            )}

            {(editMode === "avatar" || editMode === "all") && (
              <>
                <AvatarSelector disabled={savingAvatar} onChange={changeAvatar} value={user.avatar || "Avatar1.png"} />
                {savingAvatar && <p className="mt-3 text-sm font-semibold text-slate-400">Menyimpan avatar...</p>}
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
