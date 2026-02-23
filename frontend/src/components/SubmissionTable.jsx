import VerdictBadge from "./VerdictBadge";
import { formatDate } from "../utils/format";

export default function SubmissionTable({ submissions }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-glow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-[0.24em] text-slate-500">
            <tr>
              <th className="px-6 py-4">Run ID</th>
              <th className="px-6 py-4">Problem</th>
              <th className="px-6 py-4">Verdict</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Memory</th>
              <th className="px-6 py-4">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {submissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-slate-800/35">
                <td className="px-6 py-4 text-slate-500">#{submission.id}</td>
                <td className="px-6 py-4">{submission.problem_title || submission.title}</td>
                <td className="px-6 py-4">
                  <VerdictBadge verdict={submission.verdict} />
                </td>
                <td className="px-6 py-4">{submission.execution_time_ms} ms</td>
                <td className="px-6 py-4">{submission.memory_kb} KB</td>
                <td className="px-6 py-4 text-slate-400">{formatDate(submission.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
