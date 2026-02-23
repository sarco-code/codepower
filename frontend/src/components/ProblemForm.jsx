import { useState } from "react";

const blankTest = { input: "", expectedOutput: "", isSample: false };

const initialState = {
  slug: "",
  title: "",
  description: "",
  constraints: "",
  inputFormat: "",
  outputFormat: "",
  sampleInput: "",
  sampleOutput: "",
  explanation: "",
  difficulty: 800,
  tags: "",
  testCases: [{ ...blankTest }]
};

export default function ProblemForm({ initialValue, onSubmit, submitting, onCancel }) {
  const [form, setForm] = useState(
    initialValue
      ? {
          ...initialValue,
          tags: (initialValue.tags || []).join(", "),
          testCases:
            initialValue.testCases?.map((item) => ({
              input: item.input,
              expectedOutput: item.expectedOutput,
              isSample: item.isSample
            })) || [{ ...blankTest }]
        }
      : initialState
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateTestCase(index, field, value) {
    setForm((current) => ({
      ...current,
      testCases: current.testCases.map((testCase, currentIndex) =>
        currentIndex === index ? { ...testCase, [field]: value } : testCase
      )
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({
      ...form,
      difficulty: Number(form.difficulty),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Slug" value={form.slug} onChange={(value) => updateField("slug", value)} />
        <Input label="Title" value={form.title} onChange={(value) => updateField("title", value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Difficulty"
          type="number"
          value={form.difficulty}
          onChange={(value) => updateField("difficulty", value)}
        />
        <Input
          label="Tags"
          value={form.tags}
          onChange={(value) => updateField("tags", value)}
          placeholder="math, dp, graphs"
        />
      </div>
      <TextArea label="Description" value={form.description} onChange={(value) => updateField("description", value)} />
      <TextArea label="Constraints" value={form.constraints} onChange={(value) => updateField("constraints", value)} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextArea label="Input Format" value={form.inputFormat} onChange={(value) => updateField("inputFormat", value)} />
        <TextArea label="Output Format" value={form.outputFormat} onChange={(value) => updateField("outputFormat", value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextArea label="Sample Input" value={form.sampleInput} onChange={(value) => updateField("sampleInput", value)} />
        <TextArea label="Sample Output" value={form.sampleOutput} onChange={(value) => updateField("sampleOutput", value)} />
      </div>
      <TextArea label="Explanation" value={form.explanation} onChange={(value) => updateField("explanation", value)} />

      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Test Cases</h3>
            <p className="text-sm text-slate-400">Admin-only private tests used for verdict generation.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((current) => ({ ...current, testCases: [...current.testCases, { ...blankTest }] }))
            }
            className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200"
          >
            Add Test
          </button>
        </div>

        <div className="space-y-4">
          {form.testCases.map((testCase, index) => (
            <div key={index} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TextArea
                  label={`Input #${index + 1}`}
                  value={testCase.input}
                  onChange={(value) => updateTestCase(index, "input", value)}
                />
                <TextArea
                  label={`Expected Output #${index + 1}`}
                  value={testCase.expectedOutput}
                  onChange={(value) => updateTestCase(index, "expectedOutput", value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={testCase.isSample}
                  onChange={(event) => updateTestCase(index, "isSample", event.target.checked)}
                />
                Mark as sample test
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Problem"}
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

function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="space-y-2 text-sm text-slate-300">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none ring-0 transition focus:border-sky-500"
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
