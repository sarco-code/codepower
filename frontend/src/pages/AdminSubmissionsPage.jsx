import { useEffect, useState } from "react";
import api from "../services/api";
import Loader from "../components/Loader";
import SubmissionTable from "../components/SubmissionTable";
import VerdictBadge from "../components/VerdictBadge";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState(null);
  const [contests, setContests] = useState([]);
  const [problems, setProblems] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
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
    setSelectedSubmission(null);
    await loadSubmissions(nextFilters);
  }

  async function handleSelectSubmission(submission) {
    setDetailsLoading(true);
    try {
      const response = await api.get(`/submissions/${submission.id}`);
      setSelectedSubmission(response.data.submission);
    } finally {
      setDetailsLoading(false);
    }
  }

  if (!submissions) {
    return <Loader label="Yuborishlar yuklanmoqda..." />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-6 shadow-glow">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Barcha yuborishlar</h1>
        <p className="mt-3 text-sm text-slate-400">
          Admin barcha urinishlarni ko'ra oladi. Oddiy foydalanuvchilar esa faqat o'z yuborishlarini ko'radi.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Kontest filtri</span>
            <select
              value={filters.contestId}
              onChange={(event) => applyFilters({ ...filters, contestId: event.target.value })}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
            >
              <option value="">Barcha kontestlar</option>
              {contests.map((contest) => (
                <option key={contest.id} value={contest.id}>
                  {contest.title}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Masala filtri</span>
            <select
              value={filters.problemId}
              onChange={(event) => applyFilters({ ...filters, problemId: event.target.value })}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
            >
              <option value="">Barcha masalalar</option>
              {problems.map((problem) => (
                <option key={problem.id} value={problem.id}>
                  {problem.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <SubmissionTable
        submissions={submissions}
        showUser
        selectedSubmissionId={selectedSubmission?.id}
        onSelectSubmission={handleSelectSubmission}
      />

      <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-6 shadow-glow">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Yuborishni ko'rish</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-100">
              {selectedSubmission ? `Run #${selectedSubmission.id}` : "Yuborishni tanlang"}
            </h2>
          </div>
          {selectedSubmission && <VerdictBadge verdict={selectedSubmission.verdict} />}
        </div>

        {detailsLoading ? (
          <Loader label="Yuborish tafsilotlari yuklanmoqda..." />
        ) : !selectedSubmission ? (
          <p className="text-sm text-slate-400">Yuqoridan biror qatorni tanlab, yuborilgan kod va test natijalarini ko'ring.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <InfoCard label="Masala" value={selectedSubmission.problem_title} />
              <InfoCard label="Til" value={selectedSubmission.language} />
              <InfoCard label="Vaqt" value={`${selectedSubmission.execution_time_ms} ms`} />
              <InfoCard label="Xotira" value={`${selectedSubmission.memory_kb} KB`} />
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-slate-200">Kod</p>
              <pre className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-200">
                {selectedSubmission.source_code}
              </pre>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-slate-200">Test natijalari</p>
              <div className="space-y-4">
                {selectedSubmission.testResults.map((result) => (
                  <div key={result.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-100">Test #{result.test_case_id}</p>
                      <VerdictBadge verdict={result.verdict} />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <OutputBlock label="Amaldagi chiqish" value={result.actual_output} />
                      <OutputBlock label="Kutilgan chiqish" value={result.expected_output} />
                    </div>
                    <div className="mt-4 flex gap-6 text-xs text-slate-500">
                      <span>Vaqt: {result.time_ms} ms</span>
                      <span>Xotira: {result.memory_kb} KB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}

function OutputBlock({ label, value }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs text-slate-200">
        {value || "(bo'sh)"}
      </pre>
    </div>
  );
}
