const AVATARS = Array.from({ length: 12 }, (_, index) => `Avatar${index + 1}.png`);

export const AvatarSelector = ({ value = "Avatar1.png", onChange, disabled = false }) => {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Pilih Avatar</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">Avatar ini tampil di profil, lobby, dan arena game.</p>
        </div>
        <img
          alt="Avatar terpilih"
          className="h-16 w-16 rounded-full border-2 border-yellow-300 bg-slate-900 object-cover"
          src={`/avatars/${value || "Avatar1.png"}`}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {AVATARS.map((avatar) => {
          const selected = avatar === value;

          return (
            <button
              aria-label={`Pilih ${avatar}`}
              className={`group rounded-xl border p-2 transition ${
                selected
                  ? "border-yellow-300 bg-yellow-300/15 shadow-[0_0_18px_rgba(250,204,21,0.24)]"
                  : "border-slate-700 bg-slate-900/70 hover:border-cyan-300/70"
              }`}
              disabled={disabled}
              key={avatar}
              onClick={() => onChange?.(avatar)}
              type="button"
            >
              <img
                alt=""
                className="aspect-square w-full rounded-lg bg-slate-950 object-cover transition group-hover:scale-105"
                src={`/avatars/${avatar}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { AVATARS };
