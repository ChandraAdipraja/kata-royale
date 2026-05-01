import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogIn } from "lucide-react";
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
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-[1fr_0.9fr]">
      <section className="flex flex-col justify-center">
        <p className="text-sm font-black uppercase text-mint">Welcome back</p>
        <h1 className="mt-3 text-4xl font-black">Masuk dan lanjutkan statistikmu.</h1>
        <p className="mt-3 text-ink/65">Akun login menyimpan total match, winrate, dan jumlah kata valid.</p>
      </section>

      <form onSubmit={submit} className="panel space-y-4 rounded-lg p-6">
        <h2 className="text-2xl font-black">Login</h2>
        <input className="w-full rounded-lg border border-ink/15 px-3 py-3 outline-none focus:border-mint" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="w-full rounded-lg border border-ink/15 px-3 py-3 outline-none focus:border-mint" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <Button className="w-full" disabled={loading} type="submit"><LogIn size={18} /> {loading ? "Masuk..." : "Login"}</Button>
        <p className="text-sm text-ink/65">Belum punya akun? <Link className="font-black text-mint" to="/register">Register</Link></p>
      </form>
    </main>
  );
}
