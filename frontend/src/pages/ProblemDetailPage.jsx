import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";
import SubmissionTable from "../components/SubmissionTable";

const templates = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}
`,
  python: `import sys

def solve():
    pass

if __name__ == "__main__":
    solve()
`
};

export default function ProblemDetailPage() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [language, setLanguage] = useState("cpp");
  const [sourceCode, setSourceCode] = useState(templates.cpp);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadProblem() {
    const [problemResponse, submissionsResponse] = await Promise.all([
      api.get(`/problems/${id}`),
      api.get(`/submissions?problemId=${id}`)
    ]);
    setProblem(problemResponse.data.problem);
    setSubmissions(submissionsResponse.data.submissions);
  }

  useEffect(() => {
    loadProblem();
  }, [id]);

  useEffect(() => {
    if (!submissions.some((submission) => submission.verdict === "Running")) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      api
        .get(`/submissions?problemId=${id}`)
        .then((response) => setSubmissions(response.data.submissions))
        .catch(() => {});
    }, 3000);

    return () => clearInterval(intervalId);
  }, [id, submissions]);

  useEffect(() => {
    setSourceCode(templates[language]);
  }, [language]);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    const optimisticSubmission = {
      id: `pending-${Date.now()}`,
      problem_title: problem.title,
      verdict: "Running",
      execution_time_ms: 0,
      memory_kb: 0,
      created_at: new Date().toISOString()
    };
    setSubmissions((current) => [optimisticSubmission, ...current]);
    try {
      const response = await api.post("/submissions", {
        problemId: Number(id),
        language,
        sourceCode
      });
      setSubmissions((current) => [
        response.data.submission,
        ...current.filter((item) => item.id !== optimisticSubmission.id)
      ]);
    } catch (requestError) {
      setSubmissions((current) => current.filter((item) => item.id !== optimisticSubmission.id));
      setError(requestError.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!problem) {
    return <Loader label="Loading problem..." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-6">
        <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-8 shadow-glow">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-400">
              #{problem.id}
            </span>
            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs text-sky-300">
              {problem.difficulty}
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-slate-50">{problem.title}</h1>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{problem.description}</p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <InfoCard title="Constraints" body={problem.constraints} />
            <InfoCard title="Input" body={problem.inputFormat} />
            <InfoCard title="Output" body={problem.outputFormat} />
            <InfoCard title="Explanation" body={problem.explanation || "No editorial note provided."} />
          </div>

          {problem.testCases?.some((testCase) => testCase.isSample) ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {problem.testCases
                .filter((testCase) => testCase.isSample)
                .map((testCase, index) => (
                  <div key={testCase.id} className="space-y-5">
                    <SampleBlock
                      label={`${testCase.sampleType === "failed" ? "Failed" : "Worked"} Input #${index + 1}`}
                      value={testCase.input}
                    />
                    <SampleBlock
                      label={`${testCase.sampleType === "failed" ? "Failed" : "Worked"} Output #${index + 1}`}
                      value={testCase.expectedOutput}
                    />
                  </div>
                ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <SampleBlock label="Sample Input" value={problem.sampleInput} />
              <SampleBlock label="Sample Output" value={problem.sampleOutput} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">History</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-100">Your submissions</h2>
          </div>
          <SubmissionTable submissions={submissions} />
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-4 shadow-glow">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-2 pb-4">
            <div>
              <p className="text-sm font-medium text-slate-200">Code Editor</p>
              <p className="text-xs text-slate-500">Monaco with C++ and Python templates.</p>
            </div>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 outline-none"
            >
              <option value="cpp">C++17</option>
              <option value="python">Python 3</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-800">
            <Editor
              height="540px"
              theme="vs-dark"
              language={language === "cpp" ? "cpp" : "python"}
              value={sourceCode}
              onChange={(value) => setSourceCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                scrollBeyondLastLine: false
              }}
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {submitting ? "Judging..." : "Submit Solution"}
          </button>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ title, body }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{title}</p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{body}</p>
    </div>
  );
}

function SampleBlock({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-900 p-4 text-sm text-slate-200">
        {value}
      </pre>
    </div>
  );
}
