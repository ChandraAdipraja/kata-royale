import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

const ToastContext = createContext(null);

const styles = {
  success: "border-emerald-400/25 bg-emerald-950/95 text-emerald-100",
  error: "border-rose-400/25 bg-rose-950/95 text-rose-100",
  warning: "border-amber-400/25 bg-amber-950/95 text-amber-100",
  info: "border-cyan-400/25 bg-cyan-950/95 text-cyan-100"
};

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = crypto.randomUUID?.() || `${Date.now()}_${Math.random()}`;
    setToasts((items) => [...items, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-20 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info;
          return (
            <div key={toast.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur transition ${styles[toast.type] || styles.info}`}>
              <Icon size={18} className="mt-0.5 shrink-0" />
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
