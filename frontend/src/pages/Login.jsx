import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogIn, X } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

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
        <p className="text-center text-sm text-slate-400">
          Belum punya akun? <Link className="font-black text-yellow-400 hover:underline" to="/register">Daftar</Link>
        </p>
      </form>
    </main>
  );
}
