import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogIn, X } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { API_URL } from "../services/api.js";

const GoogleIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
  </svg>
);

const DiscordIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.32 4.37A19.8 19.8 0 0 0 15.36 2a13.8 13.8 0 0 0-.63 1.28 18.27 18.27 0 0 0-5.46 0A12.64 12.64 0 0 0 8.64 2a19.74 19.74 0 0 0-4.97 2.38C.53 9.06-.32 13.63.1 18.13A19.92 19.92 0 0 0 6.18 21.2a14.8 14.8 0 0 0 1.3-2.1 12.89 12.89 0 0 1-2.05-.98c.17-.12.34-.25.5-.38a14.18 14.18 0 0 0 12.14 0l.5.38c-.65.39-1.34.72-2.06.98.38.74.82 1.44 1.3 2.1a19.84 19.84 0 0 0 6.08-3.07c.5-5.22-.84-9.75-3.57-13.76ZM8.02 15.36c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.96 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.95-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" />
  </svg>
);

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const loginWithOAuth = (provider) => {
    window.location.href = `${API_URL}/api/auth/${provider}`;
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      showToast("Login berhasil", "success");
      navigate("/dashboard");
    } catch (err) {
      showToast(err.response?.data?.message || "Login gagal", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center py-10">
      <form onSubmit={submit} className="panel w-full max-w-md space-y-6 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-white">Masuk</h1>
          <Link to="/" className="text-slate-400 transition hover:text-white"><X size={24} /></Link>
        </div>

        <div className="space-y-4">
          <input className="game-input px-4 py-3" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input className="game-input px-4 py-3" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </div>

        <Button className="w-full" disabled={loading} type="submit"><LogIn size={18} /> {loading ? "Masuk..." : "Masuk"}</Button>
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="ghost" className="w-full" aria-label="Masuk dengan Google" title="Masuk dengan Google" onClick={() => loginWithOAuth("google")}>
            <GoogleIcon />
          </Button>
          <Button type="button" variant="ghost" className="w-full text-indigo-300" aria-label="Masuk dengan Discord" title="Masuk dengan Discord" onClick={() => loginWithOAuth("discord")}>
            <DiscordIcon />
          </Button>
        </div>
        <p className="text-center text-sm text-slate-400">
          Belum punya akun? <Link className="font-black text-yellow-400 hover:underline" to="/register">Daftar</Link>
        </p>
      </form>
    </main>
  );
}
