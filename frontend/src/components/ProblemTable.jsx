import { Link } from "react-router-dom";

export default function ProblemTable({ problems }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-glow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-[0.24em] text-slate-500">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Difficulty</th>
              <th className="px-6 py-4">Tags</th>
              <th className="px-6 py-4">Solved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {problems.map((problem) => (
              <tr key={problem.id} className="hover:bg-slate-800/35">
                <td className="px-6 py-4 text-slate-500">{problem.id}</td>
                <td className="px-6 py-4">
                  <Link
                    to={`/problems/${problem.id}`}
                    className="font-medium text-sky-300 transition hover:text-sky-200"
                  >
                    {problem.title}
                  </Link>
                </td>
                <td className="px-6 py-4">{problem.difficulty}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {problem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">{problem.acceptedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
