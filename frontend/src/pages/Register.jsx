import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register(form);
      showToast("Akun berhasil dibuat", "success");
      navigate("/dashboard");
    } catch (err) {
      showToast(err.response?.data?.message || "Register gagal", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <form onSubmit={submit} className="panel space-y-4 rounded-lg p-6">
        <h1 className="text-2xl font-black">Register</h1>
        <input className="w-full rounded-lg border border-ink/15 px-3 py-3 outline-none focus:border-mint" placeholder="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        <input className="w-full rounded-lg border border-ink/15 px-3 py-3 outline-none focus:border-mint" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="w-full rounded-lg border border-ink/15 px-3 py-3 outline-none focus:border-mint" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <Button className="w-full" disabled={loading} type="submit"><UserPlus size={18} /> {loading ? "Membuat..." : "Buat akun"}</Button>
        <p className="text-sm text-ink/65">Sudah punya akun? <Link className="font-black text-mint" to="/login">Login</Link></p>
      </form>
    </main>
  );
}
