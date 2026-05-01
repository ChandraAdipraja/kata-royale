export const StatCard = ({ label, value, tone = "white" }) => {
  const tones = {
    white: "border-slate-700 bg-slate-900/65 text-slate-200",
    mint: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    cyan: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
    purple: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200",
    amber: "border-yellow-400/25 bg-yellow-400/10 text-yellow-200"
  };

  return (
    <div className={`rounded-xl border p-4 shadow-lg shadow-slate-950/20 ${tones[tone] || tones.white}`}>
      <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  );
};
