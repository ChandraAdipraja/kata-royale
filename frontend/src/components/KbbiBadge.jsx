import { ShieldCheck } from "lucide-react";

export const KbbiBadge = ({ className = "" }) => (
  <span className={`inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700 ${className}`}>
    <ShieldCheck size={14} />
    KBBI Validated
  </span>
);
