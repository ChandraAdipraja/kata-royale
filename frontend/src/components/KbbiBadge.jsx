import { ShieldCheck } from "lucide-react";

export const KbbiBadge = ({ className = "" }) => (
  <span className={`inline-flex items-center gap-1 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-300 ${className}`}>
    <ShieldCheck size={14} />
    KBBI Validated
  </span>
);
