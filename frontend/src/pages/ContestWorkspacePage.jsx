import Editor from "@monaco-editor/react";
import { ClipboardList, FileCode2, Info, Medal, Swords, Trophy, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";
import SubmissionTable from "../components/SubmissionTable";
import { formatDate } from "../utils/format";
import { useAuth } from "../hooks/useAuth";

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

const tabs = [
  { id: "about", label: "Olimpiada haqida", icon: Info },
  { id: "problems", label: "Masalalar", icon: ClipboardList },
  { id: "submit", label: "Yuborish", icon: FileCode2 },
  { id: "results", label: "Natijalar", icon: Trophy },
  { id: "attempts", label: "Urinishlar", icon: Swords },
  { id: "participants", label: "Qatnashuvchilar", icon: Users }
];

export default function ContestWorkspacePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [contest, setContest] = useState(null);
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [problem, setProblem] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [language, setLanguage] = useState("cpp");
  const [sourceCode, setSourceCode] = useState(templates.cpp);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("problems");

  async function loadContest() {
    const response = await api.get(`/contests/${id}`);
    setContest(response.data.contest);
    if (!selectedProblemId && response.data.contest.problems[0]) {
      setSelectedProblemId(response.data.contest.problems[0].id);
    }
  }

  useEffect(() => {
    loadContest();
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
    if (!selectedProblemId || !submissions.some((submission) => submission.verdict === "Running")) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      Promise.all([
        api.get(`/submissions?problemId=${selectedProblemId}`),
        api.get(`/contests/${id}`)
      ])
        .then(([submissionsResponse, contestResponse]) => {
          setSubmissions(submissionsResponse.data.submissions);
          setContest(contestResponse.data.contest);
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(intervalId);
  }, [id, selectedProblemId, submissions]);

  useEffect(() => {
    setSourceCode(templates[language]);
  }, [language]);

  const selectedContestProblem = useMemo(
    () => contest?.problems.find((entry) => entry.id === selectedProblemId),
    [contest, selectedProblemId]
  );

  const myStanding = useMemo(
    () => contest?.standings?.find((entry) => entry.userId === user?.id),
    [contest, user]
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
      setActiveTab("attempts");
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
      <section className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-6 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Contest Workspace</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-50">{contest.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{contest.description}</p>
          </div>
          <div className="grid gap-2 rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-sm text-slate-300">
            <p>Start: {formatDate(contest.startsAt)}</p>
            <p>End: {formatDate(contest.endsAt)}</p>
            <p>Masalalar: {contest.problemCount}</p>
            {myStanding && <p>Reyting: #{myStanding.rank} • {myStanding.score} ball</p>}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-sky-400 text-slate-950"
                    : "border border-slate-800 bg-slate-900/70 text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[120px_1fr]">
        <section className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-3 shadow-glow">
          <div className="space-y-2">
            {contest.problems.map((entry, index) => (
              <button
                key={entry.id}
                onClick={() => {
                  setSelectedProblemId(entry.id);
                  setActiveTab("problems");
                }}
                className={`w-full rounded-2xl border px-3 py-4 text-center transition ${
                  entry.id === selectedProblemId
                    ? "border-sky-400 bg-sky-400/15 text-sky-200"
                    : "border-slate-800 bg-slate-900/70 text-slate-200 hover:bg-slate-900"
                }`}
              >
                <p className="text-2xl font-semibold">{String.fromCharCode(65 + index)}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-sm">
                  <Medal className="h-4 w-4" />
                  {entry.points}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-800 bg-slate-950/80 shadow-glow">
          {activeTab === "about" && (
            <div className="p-8">
              <h2 className="text-3xl font-semibold text-slate-50">{contest.title}</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <MetricCard label="Masalalar" value={contest.problemCount} />
                <MetricCard label="Cheaterlar" value={contest.cheaterCount || 0} />
                <MetricCard label="Qatnashuvchilar" value={contest.standings?.length || 0} />
              </div>
              <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-300">{contest.description}</p>
            </div>
          )}

          {activeTab === "problems" && problem && selectedContestProblem && (
            <div>
              <div className="border-b border-slate-800 bg-slate-900/60 px-8 py-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-3xl font-semibold text-slate-50">
                    Masala {String.fromCharCode(64 + selectedContestProblem.problemOrder + 1)}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge>{selectedContestProblem.points} ball</Badge>
                    <Badge>{problem.difficulty}</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-8 p-8">
                <section>
                  <h3 className="text-3xl font-semibold text-slate-100">{problem.title}</h3>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-300">{problem.description}</p>
                </section>
                <div className="grid gap-5 md:grid-cols-2">
                  <InfoCard title="Kiruvchi ma'lumotlar" body={problem.inputFormat} />
                  <InfoCard title="Chiquvchi ma'lumotlar" body={problem.outputFormat} />
                  <InfoCard title="Cheklovlar" body={problem.constraints} />
                  <InfoCard title="Izoh" body={problem.explanation || "Izoh berilmagan."} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "submit" && (
            <div className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-2 pb-4">
                <div>
                  <p className="text-sm font-medium text-slate-200">Contest Editor</p>
                  <p className="text-xs text-slate-500">Tanlangan masala uchun yechim yuboring.</p>
                </div>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 outline-none"
                >
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
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
                {submitting ? "Tekshirilmoqda..." : "Yechimni yuborish"}
              </button>
            </div>
          )}

          {activeTab === "results" && (
            <div className="p-6">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Scoreboard</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-100">Natijalar</h3>
              </div>
              <StandingsTable standings={contest.standings || []} problems={contest.problems || []} />
            </div>
          )}

          {activeTab === "attempts" && (
            <div className="p-6">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">History</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-100">Urinishlar</h3>
              </div>
              <SubmissionTable submissions={submissions} />
            </div>
          )}

          {activeTab === "participants" && (
            <div className="p-6">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">People</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-100">Qatnashuvchilar</h3>
              </div>
              <div className="space-y-3">
                {(contest.participants || []).length === 0 && (
                  <p className="text-sm text-slate-500">Hali qatnashuvchilar yo‘q.</p>
                )}
                {(contest.participants || []).map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-200">{participant.display_name}</p>
                      <p className="mt-1 text-xs text-slate-500">@{participant.username}</p>
                    </div>
                    <Badge tone={participant.status === "cheater" ? "danger" : "info"}>
                      {participant.status === "cheater" ? "Cheater" : "Active"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
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

function MetricCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function Badge({ children, tone = "default" }) {
  const styles = {
    default: "border-slate-700 bg-slate-900/80 text-slate-300",
    info: "border-sky-500/20 bg-sky-500/10 text-sky-300",
    danger: "border-rose-500/20 bg-rose-500/10 text-rose-300"
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[tone]}`}>
      {children}
    </span>
  );
}

function StandingsTable({ standings, problems }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-glow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-[0.24em] text-slate-500">
            <tr>
              <th className="px-6 py-4">#</th>
              <th className="px-6 py-4">Ism familiya</th>
              <th className="px-6 py-4">Ball</th>
              <th className="px-6 py-4">Yechdi</th>
              <th className="px-6 py-4">Jarima</th>
              {problems.map((problem, index) => (
                <th key={problem.id} className="px-6 py-4 text-center">
                  <div className="text-sky-300">{String.fromCharCode(65 + index)}</div>
                  <div className="mt-1 text-[11px] normal-case text-slate-400">{problem.points}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {standings.map((row) => (
              <tr key={row.userId} className="hover:bg-slate-800/35">
                <td className="px-6 py-4 text-slate-100">{row.rank}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-cyan-300">{row.displayName}</div>
                  <div className="mt-1 text-xs text-slate-500">@{row.username}</div>
                </td>
                <td className="px-6 py-4 text-lg font-semibold text-slate-100">{row.score}</td>
                <td className="px-6 py-4 text-slate-100">{row.acceptedCount}</td>
                <td className="px-6 py-4 text-slate-100">{row.penaltyMinutes}</td>
                {row.perProblem.map((cell) => (
                  <td key={cell.letter} className="px-4 py-4">
                    <div
                      className={`min-w-[88px] rounded-2xl border px-3 py-2 text-center ${
                        cell.solved
                          ? "border-cyan-500/20 bg-cyan-500/10"
                          : cell.attempts > 0
                            ? "border-rose-500/20 bg-slate-950/70"
                            : "border-slate-800 bg-slate-950/70"
                      }`}
                    >
                      <div
                        className={`text-lg font-semibold ${
                          cell.solved ? "text-emerald-300" : cell.attempts > 0 ? "text-rose-300" : "text-slate-500"
                        }`}
                      >
                        {cell.solved ? `+${Math.max(0, cell.attempts - 1) || ""}` : cell.attempts > 0 ? `-${cell.attempts}` : "-"}
                      </div>
                      <div className="mt-1 text-xs text-slate-200">
                        {cell.solvedAt ? formatDate(cell.solvedAt).split(", ")[1] : ""}
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
