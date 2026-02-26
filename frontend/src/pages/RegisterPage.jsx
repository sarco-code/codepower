import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    displayName: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await register(form);
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Ro'yxatdan o'tish muvaffaqiyatsiz tugadi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-[32px] border border-slate-800 bg-slate-950/90 p-8 shadow-glow sm:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Akkaunt yaratish</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-50">Ro'yxatdan o'tish</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field label="Foydalanuvchi nomi" value={form.username} onChange={(value) => setForm((current) => ({ ...current, username: value }))} />
          <Field label="Email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
          <Field
            label="Ko'rinadigan ism"
            value={form.displayName}
            onChange={(value) => setForm((current) => ({ ...current, displayName: value }))}
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
            {submitting ? "Akkaunt yaratilmoqda..." : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Akkauntingiz bormi?{" "}
          <Link to="/login" className="font-medium text-sky-300">
            Kirish
          </Link>
        </p>
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
