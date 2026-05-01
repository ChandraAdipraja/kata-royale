export const Button = ({ className = "", variant = "primary", ...props }) => {
  const variants = {
    primary: "bg-yellow-400 text-yellow-950 shadow-[0_4px_0_rgb(161,98,7)] hover:bg-yellow-300 hover:shadow-[0_2px_0_rgb(161,98,7)] hover:translate-y-[2px]",
    secondary: "border border-slate-600 bg-slate-800/80 text-white hover:border-slate-500 hover:bg-slate-700",
    accent: "bg-indigo-600 text-white shadow-[0_4px_0_rgb(67,56,202)] hover:bg-indigo-500 hover:shadow-[0_2px_0_rgb(67,56,202)] hover:translate-y-[2px]",
    cyan: "bg-cyan-600 text-white shadow-[0_4px_0_rgb(21,94,117)] hover:bg-cyan-500 hover:shadow-[0_2px_0_rgb(21,94,117)] hover:translate-y-[2px]",
    danger: "bg-rose-500 text-white shadow-[0_4px_0_rgb(190,18,60)] hover:bg-rose-400 hover:shadow-[0_2px_0_rgb(190,18,60)] hover:translate-y-[2px]",
    ghost: "bg-white/10 text-white backdrop-blur hover:bg-white/20"
  };

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition duration-200 active:scale-95 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
};
