import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const completeOAuthLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        showToast("Token OAuth tidak ditemukan", "error");
        navigate("/login", { replace: true });
        return;
      }

      try {
        await loginWithToken(token);
        showToast("Login OAuth berhasil", "success");
        navigate("/dashboard", { replace: true });
      } catch (_error) {
        showToast("Login OAuth gagal", "error");
        navigate("/login", { replace: true });
      }
    };

    completeOAuthLogin();
  }, [loginWithToken, navigate, showToast]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm font-bold text-slate-300">Memproses login...</p>
    </main>
  );
}
