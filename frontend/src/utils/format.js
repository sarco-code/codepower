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
  if (verdict === "Running") return "text-sky-400 bg-sky-500/10 border-sky-500/20";
  return "text-orange-300 bg-orange-500/10 border-orange-500/20";
}
