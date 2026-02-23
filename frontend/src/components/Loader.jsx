export default function Loader({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm text-slate-300 shadow-glow">
        {label}
      </div>
    </div>
  );
}
