import { useEffect, useState } from "react";
import api from "../services/api";
import Loader from "../components/Loader";
import ProblemForm from "../components/ProblemForm";

export default function AdminProblemsPage() {
  const [problems, setProblems] = useState(null);
  const [editingProblem, setEditingProblem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadProblems() {
    const response = await api.get("/problems");
    setProblems(response.data.problems);
  }

  useEffect(() => {
    loadProblems();
  }, []);

  async function handleSave(payload) {
    setSaving(true);
    setError("");
    try {
      if (editingProblem?.id) {
        await api.put(`/problems/${editingProblem.id}`, payload);
      } else {
        await api.post("/problems", payload);
      }
      setEditingProblem(null);
      await loadProblems();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save problem.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(problemId) {
    const response = await api.get(`/problems/${problemId}`);
    setEditingProblem(response.data.problem);
  }

  async function handleDelete(problemId) {
    await api.delete(`/problems/${problemId}`);
    await loadProblems();
    if (editingProblem?.id === problemId) {
      setEditingProblem(null);
    }
  }

  if (!problems) {
    return <Loader label="Loading admin panel..." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-6 shadow-glow">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Problems & Test Cases</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Create, edit, and remove platform problems. Private tests stay server-side.
        </p>

        <div className="mt-6 space-y-3">
          {problems.map((problem, index) => (
            <div
              key={problem.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4"
            >
              <div>
                <p className="text-sm font-medium text-slate-200">{problem.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  #{index + 1} • {problem.difficulty}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(problem.id)}
                  className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(problem.id)}
                  className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"
                >
                  Delete
                </button>
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
              {editingProblem ? `Editing ${editingProblem.title}` : "Create Problem"}
            </h2>
          </div>
          {editingProblem && (
            <button
              onClick={() => setEditingProblem(null)}
              className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
            >
              New Problem
            </button>
          )}
        </div>

        {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}

        <ProblemForm
          initialValue={editingProblem}
          onSubmit={handleSave}
          submitting={saving}
          onCancel={() => setEditingProblem(null)}
        />
      </section>
    </div>
  );
}
