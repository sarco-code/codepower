import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";
import { formatDate } from "../utils/format";

export default function ContestsPage() {
  const [contests, setContests] = useState(null);

  useEffect(() => {
    api.get("/contests").then((response) => setContests(response.data.contests));
  }, []);

  if (!contests) {
    return <Loader label="Loading contests..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Schedule</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Contests</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          A simple contest overview layer with timing and problem counts.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {contests.map((contest) => (
          <article key={contest.id} className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-6 shadow-glow">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Contest #{contest.id}</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-100">{contest.title}</h2>
            <div className="mt-5 grid gap-3 text-sm text-slate-400">
              <p>Starts: {formatDate(contest.startsAt)}</p>
              <p>Ends: {formatDate(contest.endsAt)}</p>
              <p>Problems: {contest.problemCount}</p>
            </div>
            <Link
              to={`/contests/${contest.id}`}
              className="mt-5 inline-flex rounded-2xl bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Open Contest
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
