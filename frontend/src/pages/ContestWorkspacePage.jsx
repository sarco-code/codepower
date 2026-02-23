import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";
import SubmissionTable from "../components/SubmissionTable";
import { formatDate } from "../utils/format";

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

export default function ContestWorkspacePage() {
  const { id } = useParams();
  const [contest, setContest] = useState(null);
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [problem, setProblem] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [language, setLanguage] = useState("cpp");
  const [sourceCode, setSourceCode] = useState(templates.cpp);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/contests/${id}`).then((response) => {
      setContest(response.data.contest);
      if (response.data.contest.problems[0]) {
        setSelectedProblemId(response.data.contest.problems[0].id);
      }
    });
  }, [id]);

  useEffect(() => {
    if (!selectedProblemId) return;
    Promise.all([
      api.get(`/problems/${selectedProblemId}`),
      api.get(`/submissions?problemId=${selectedProblemId}`)
    ]).then(([problemResponse, submissionsResponse]) => {
      setProblem(problemResponse.data.problem);
      setSubmissions(submissionsResponse.data.submissions);
    });
  }, [selectedProblemId]);

  useEffect(() => {
    setSourceCode(templates[language]);
  }, [language]);

  const selectedContestProblem = useMemo(
    () => contest?.problems.find((entry) => entry.id === selectedProblemId),
    [contest, selectedProblemId]
  );

  async function handleSubmit() {
    if (!selectedProblemId) return;
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
        problemId: selectedProblemId,
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

  if (!contest) {
    return <Loader label="Loading contest..." />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-8 shadow-glow">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Contest Workspace</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">{contest.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{contest.description}</p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>Starts: {formatDate(contest.startsAt)}</span>
          <span>Ends: {formatDate(contest.endsAt)}</span>
          <span>{contest.problemCount} problems</span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <section className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-5 shadow-glow">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Problems</p>
          <div className="mt-4 space-y-3">
            {contest.problems.map((entry, index) => (
              <button
                key={entry.id}
                onClick={() => setSelectedProblemId(entry.id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  entry.id === selectedProblemId
                    ? "border-sky-500/40 bg-sky-500/10"
                    : "border-slate-800 bg-slate-900/70 hover:bg-slate-900"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Problem {String.fromCharCode(65 + index)}</p>
                <p className="mt-2 text-sm font-medium text-slate-100">{entry.title}</p>
                <p className="mt-1 text-xs text-slate-500">{entry.difficulty}</p>
              </button>
            ))}
          </div>
        </section>

        {!problem ? (
          <Loader label="Loading contest problem..." />
        ) : (
          <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <div className="space-y-6">
              <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-8 shadow-glow">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-400">
                    {selectedContestProblem ? selectedContestProblem.title : problem.title}
                  </span>
                  <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs text-sky-300">
                    {problem.difficulty}
                  </span>
                </div>
                <h2 className="mt-5 text-3xl font-semibold text-slate-50">{problem.title}</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{problem.description}</p>
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <InfoCard title="Constraints" body={problem.constraints} />
                  <InfoCard title="Input" body={problem.inputFormat} />
                  <InfoCard title="Output" body={problem.outputFormat} />
                  <InfoCard title="Explanation" body={problem.explanation || "No explanation provided."} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">History</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-100">Your submissions</h3>
                </div>
                <SubmissionTable submissions={submissions} />
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-4 shadow-glow">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-2 pb-4">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Contest Editor</p>
                    <p className="text-xs text-slate-500">Solve and submit directly inside the contest.</p>
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

                {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="mt-4 w-full rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                >
                  {submitting ? "Judging..." : "Submit Solution"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
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
