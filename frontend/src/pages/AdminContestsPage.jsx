import { useEffect, useState } from "react";
import api from "../services/api";
import Loader from "../components/Loader";
import ContestForm from "../components/ContestForm";
import { formatDate } from "../utils/format";

export default function AdminContestsPage() {
  const [contests, setContests] = useState(null);
  const [problems, setProblems] = useState([]);
  const [editingContest, setEditingContest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    const [contestResponse, problemResponse] = await Promise.all([
      api.get("/contests"),
      api.get("/problems")
    ]);
    setContests(contestResponse.data.contests);
    setProblems(problemResponse.data.problems);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleEdit(contestId) {
    const response = await api.get(`/contests/${contestId}`);
    setEditingContest(response.data.contest);
  }

  async function handleSave(payload) {
    setSaving(true);
    setError("");
    try {
      if (editingContest?.id) {
        await api.put(`/contests/${editingContest.id}`, payload);
      } else {
        await api.post("/contests", payload);
      }
      setEditingContest(null);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save contest.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(contestId) {
    await api.delete(`/contests/${contestId}`);
    await loadData();
    if (editingContest?.id === contestId) {
      setEditingContest(null);
    }
  }

  if (!contests) {
    return <Loader label="Loading contests admin..." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-6 shadow-glow">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Contest Management</h1>
        <div className="mt-6 space-y-3">
          {contests.map((contest) => (
            <div
              key={contest.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">{contest.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(contest.startsAt)} • {contest.problemCount} problems
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(contest.id)}
                    className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(contest.id)}
                    className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-6 shadow-glow">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Editor</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-100">
              {editingContest ? `Editing ${editingContest.title}` : "Create Contest"}
            </h2>
          </div>
          {editingContest && (
            <button
              onClick={() => setEditingContest(null)}
              className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
            >
              New Contest
            </button>
          )}
        </div>
        {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}
        <ContestForm
          problems={problems}
          initialValue={editingContest}
          onSubmit={handleSave}
          submitting={saving}
          onCancel={() => setEditingContest(null)}
        />
      </section>
    </div>
  );
}
