export const Button = ({ className = "", variant = "primary", ...props }) => {
  const variants = {
    primary: "border border-yellow-200/70 bg-yellow-400 text-yellow-950 shadow-[0_4px_0_rgb(161,98,7)] hover:bg-yellow-300 hover:shadow-[0_2px_0_rgb(161,98,7)] hover:translate-y-[2px]",
    secondary: "border border-slate-600 bg-slate-800/85 text-white hover:border-slate-400 hover:bg-slate-700",
    accent: "border border-indigo-300/40 bg-indigo-600 text-white shadow-[0_4px_0_rgb(67,56,202)] hover:bg-indigo-500 hover:shadow-[0_2px_0_rgb(67,56,202)] hover:translate-y-[2px]",
    cyan: "border border-cyan-300/40 bg-cyan-600 text-white shadow-[0_4px_0_rgb(21,94,117)] hover:bg-cyan-500 hover:shadow-[0_2px_0_rgb(21,94,117)] hover:translate-y-[2px]",
    danger: "border border-rose-300/40 bg-rose-500 text-white shadow-[0_4px_0_rgb(190,18,60)] hover:bg-rose-400 hover:shadow-[0_2px_0_rgb(190,18,60)] hover:translate-y-[2px]",
    ghost: "border border-white/10 bg-white/10 text-white backdrop-blur hover:border-white/20 hover:bg-white/20",
    quiet: "text-slate-300 hover:bg-white/10 hover:text-white"
  };

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-300/70 focus:ring-offset-2 focus:ring-offset-slate-950 active:scale-95 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 ${variants[variant] || variants.primary} ${className}`}
      {...props}
    />
  );
};
