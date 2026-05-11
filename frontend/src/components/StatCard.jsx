export const StatCard = ({ label, value, tone = "white", icon: Icon, caption = "" }) => {
  const tones = {
    white: "border-slate-700 bg-slate-900/65 text-slate-200",
    mint: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    cyan: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
    purple: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200",
    amber: "border-yellow-400/25 bg-yellow-400/10 text-yellow-200",
    rose: "border-rose-400/25 bg-rose-400/10 text-rose-200"
  };

  return (
    <div className={`rounded-xl border p-4 shadow-lg shadow-slate-950/20 ${tones[tone] || tones.white}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <Icon size={17} />
          </span>
        )}
      </div>
      <div className="mt-2 break-words text-2xl font-black text-white">{value}</div>
      {caption && <div className="mt-1 text-xs font-semibold text-slate-500">{caption}</div>}
    </div>
  );
};
