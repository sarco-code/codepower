import { useEffect, useState } from "react";
import api from "../services/api";
import Loader from "../components/Loader";
import ProblemTable from "../components/ProblemTable";

export default function ProblemsPage() {
  const [problems, setProblems] = useState(null);

  useEffect(() => {
    api.get("/problems").then((response) => setProblems(response.data.problems));
  }, []);

  if (!problems) {
    return <Loader label="Masalalar yuklanmoqda..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Arxiv</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Masalalar ro'yxati</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          To'liq testlar bilan tekshiriladigan va namuna kirish-chiqishga ega masalalarni Monaco muharririda yeching.
        </p>
      </div>
      <ProblemTable problems={problems} />
    </div>
  );
}
