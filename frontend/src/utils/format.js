export function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function getVerdictTone(verdict) {
  if (verdict === "Accepted") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (verdict === "Wrong Answer") return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  if (verdict === "Time Limit Exceeded") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (verdict === "Compilation Error") return "text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/20";
  if (verdict === "Memory Limit Exceeded") return "text-yellow-300 bg-yellow-500/10 border-yellow-500/20";
  if (verdict === "Output Limit Exceeded") return "text-orange-300 bg-orange-500/10 border-orange-500/20";
  if (verdict === "Judge Error") return "text-red-300 bg-red-500/10 border-red-500/20";
  if (verdict === "Running") return "text-sky-400 bg-sky-500/10 border-sky-500/20";
  if (verdict === "Pending" || verdict === "Queued") return "text-cyan-300 bg-cyan-500/10 border-cyan-500/20";
  return "text-orange-300 bg-orange-500/10 border-orange-500/20";
}
