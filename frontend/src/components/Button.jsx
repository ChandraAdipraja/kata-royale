export const Button = ({ className = "", variant = "primary", ...props }) => {
  const variants = {
    primary: "bg-ink text-white shadow-sm hover:bg-black",
    secondary: "border border-ink/15 bg-white text-ink hover:border-ink/35 hover:bg-ink/5",
    accent: "bg-mint text-white shadow-sm hover:bg-emerald-600",
    cyan: "bg-cyan-600 text-white shadow-sm hover:bg-cyan-700",
    danger: "bg-coral text-white shadow-sm hover:bg-red-500",
    ghost: "bg-transparent text-ink hover:bg-ink/5"
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
};
