import { useMemo, useState } from "react";

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function ContestForm({ problems, initialValue, onSubmit, submitting, onCancel }) {
  const [form, setForm] = useState(
    initialValue
      ? {
          title: initialValue.title,
          description: initialValue.description,
          startsAt: toDateTimeLocal(initialValue.startsAt),
          endsAt: toDateTimeLocal(initialValue.endsAt),
          problemEntries:
            initialValue.problems?.map((problem) => ({
              problemId: problem.id,
              points: problem.points || 10
            })) || []
        }
      : {
          title: "",
          description: "",
          startsAt: "",
          endsAt: "",
          problemEntries: []
        }
  );

  const selectedCount = useMemo(() => form.problemEntries.length, [form.problemEntries.length]);

  function toggleProblem(problemId) {
    setForm((current) => ({
      ...current,
      problemEntries: current.problemEntries.some((entry) => entry.problemId === problemId)
        ? current.problemEntries.filter((entry) => entry.problemId !== problemId)
        : [...current.problemEntries, { problemId, points: 10 }]
    }));
  }

  function updatePoints(problemId, points) {
    setForm((current) => ({
      ...current,
      problemEntries: current.problemEntries.map((entry) =>
        entry.problemId === problemId ? { ...entry, points: Number(points || 0) } : entry
      )
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        label="Title"
        value={form.title}
        onChange={(value) => setForm((current) => ({ ...current, title: value }))}
      />
      <TextArea
        label="Description"
        value={form.description}
        onChange={(value) => setForm((current) => ({ ...current, description: value }))}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Starts At"
          type="datetime-local"
          value={form.startsAt}
          onChange={(value) => setForm((current) => ({ ...current, startsAt: value }))}
        />
        <Field
          label="Ends At"
          type="datetime-local"
          value={form.endsAt}
          onChange={(value) => setForm((current) => ({ ...current, endsAt: value }))}
        />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Contest Problems</h3>
            <p className="text-sm text-slate-400">{selectedCount} selected</p>
          </div>
        </div>
        <div className="grid gap-3">
          {problems.map((problem, index) => {
            const selected = form.problemEntries.find((entry) => entry.problemId === problem.id);

            return (
              <div
                key={problem.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <label className="flex flex-1 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(selected)}
                      onChange={() => toggleProblem(problem.id)}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{problem.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        #{index + 1} • {problem.difficulty}
                      </p>
                    </div>
                  </label>
                  <div className="w-28">
                    <Field
                      label="Points"
                      type="number"
                      value={selected?.points ?? 10}
                      onChange={(value) => updatePoints(problem.id, value)}
                      disabled={!selected}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Contest"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", disabled = false }) {
  return (
    <label className="space-y-2 text-sm text-slate-300">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-500 disabled:opacity-50"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="space-y-2 text-sm text-slate-300">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-500"
      />
    </label>
  );
}
