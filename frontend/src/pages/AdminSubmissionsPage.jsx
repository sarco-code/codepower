import { useEffect, useState } from "react";
import api from "../services/api";
import Loader from "../components/Loader";
import SubmissionTable from "../components/SubmissionTable";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState(null);
  const [contests, setContests] = useState([]);
  const [problems, setProblems] = useState([]);
  const [filters, setFilters] = useState({
    contestId: "",
    problemId: ""
  });

  async function loadLookups() {
    const [contestResponse, problemResponse] = await Promise.all([
      api.get("/contests"),
      api.get("/problems")
    ]);
    setContests(contestResponse.data.contests);
    setProblems(problemResponse.data.problems);
  }

  async function loadSubmissions(currentFilters = filters) {
    const params = new URLSearchParams();
    if (currentFilters.contestId) params.set("contestId", currentFilters.contestId);
    if (currentFilters.problemId) params.set("problemId", currentFilters.problemId);
    const response = await api.get(`/submissions/admin/all?${params.toString()}`);
    setSubmissions(response.data.submissions);
  }

  useEffect(() => {
    loadLookups();
    loadSubmissions({ contestId: "", problemId: "" });
  }, []);

  async function applyFilters(nextFilters) {
    setFilters(nextFilters);
    await loadSubmissions(nextFilters);
  }

  if (!submissions) {
    return <Loader label="Loading submissions..." />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-6 shadow-glow">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">All Submissions</h1>
        <p className="mt-3 text-sm text-slate-400">
          Admin can review every attempt. Regular users still only see their own submissions.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Contest Filter</span>
            <select
              value={filters.contestId}
              onChange={(event) => applyFilters({ ...filters, contestId: event.target.value })}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
            >
              <option value="">All contests</option>
              {contests.map((contest) => (
                <option key={contest.id} value={contest.id}>
                  {contest.title}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Problem Filter</span>
            <select
              value={filters.problemId}
              onChange={(event) => applyFilters({ ...filters, problemId: event.target.value })}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
            >
              <option value="">All problems</option>
              {problems.map((problem) => (
                <option key={problem.id} value={problem.id}>
                  {problem.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <SubmissionTable submissions={submissions} showUser />
    </div>
  );
}
