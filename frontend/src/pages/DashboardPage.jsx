import { useEffect, useState } from "react";
import api from "../services/api";
import Loader from "../components/Loader";
import StatCard from "../components/StatCard";
import SubmissionTable from "../components/SubmissionTable";

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard").then((response) => setData(response.data));
  }, []);

  if (!data) {
    return <Loader label="Bosh sahifa yuklanmoqda..." />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-8 shadow-glow">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Bosh sahifa</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-50">Har kunlik mashq va kontestga tayyorgarlik.</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
              Yechilgan masalalarni kuzating, natijalarni ko'ring va C++ hamda Python uchun bitta muharrirdan foydalaning.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Yechilgan" value={data.stats.solved} hint="Qabul qilingan yuborishlar soni." />
        <StatCard label="Yuborishlar" value={data.stats.totalSubmissions} hint="Barcha urinishlar hisobga olingan." />
        <StatCard label="O'rin" value={`#${data.stats.rank}`} hint="Platformadagi joriy o'rin." />
        <StatCard label="Reyting" value={data.stats.rating} hint="Mashqlar asosidagi baho." />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">So'nggi faollik</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-100">So'nggi yuborishlar</h2>
        </div>
        <SubmissionTable submissions={data.recentSubmissions} />
      </section>
    </div>
  );
}
