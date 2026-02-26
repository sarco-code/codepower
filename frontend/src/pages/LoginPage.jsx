import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(form);
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Kirish muvaffaqiyatsiz tugadi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/90 shadow-glow">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden border-r border-slate-800 bg-gradient-to-br from-sky-500/15 via-slate-950 to-slate-950 p-10 lg:block">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Sarcstar Judge</p>
            <h1 className="mt-6 max-w-md text-5xl font-semibold leading-tight text-slate-100">
              Haqiqiy natijalar, kontestlar va jiddiy qorong'i rejim ish muhiti bilan shug'ullaning.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
              React, Tailwind, Monaco, PostgreSQL va bulutli tekshiruvchi yagona platformada. Adminlar masala yaratishi
              va testlarni boshqarishi mumkin.
            </p>
          </div>

          <div className="p-8 sm:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Qaytganingiz bilan</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-50">Kirish</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Akkauntingiz bilan yoki backendda belgilangan admin ma'lumotlari bilan kiring.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Field
                label="Foydalanuvchi nomi"
                value={form.username}
                onChange={(value) => setForm((current) => ({ ...current, username: value }))}
              />
              <Field
                label="Parol"
                type="password"
                value={form.password}
                onChange={(value) => setForm((current) => ({ ...current, password: value }))}
              />

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-60"
              >
                {submitting ? "Kirilmoqda..." : "Kirish"}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-400">
              Akkauntingiz yo'qmi?{" "}
              <Link to="/register" className="font-medium text-sky-300">
                Ro'yxatdan o'ting
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="space-y-2 text-sm text-slate-300">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-500"
      />
    </label>
  );
}
