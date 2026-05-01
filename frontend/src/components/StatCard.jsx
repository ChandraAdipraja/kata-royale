export const StatCard = ({ label, value, tone = "white" }) => {
  const tones = {
    white: "bg-white",
    mint: "bg-emerald-50",
    cyan: "bg-cyan-50",
    purple: "bg-violet-50",
    amber: "bg-amber-50"
  };

  return (
    <div className={`rounded-lg border border-ink/10 p-4 ${tones[tone] || tones.white}`}>
      <div className="text-xs font-black uppercase tracking-wide text-ink/45">{label}</div>
      <div className="mt-2 text-2xl font-black text-ink">{value}</div>
    </div>
  );
};
