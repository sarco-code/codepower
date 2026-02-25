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
      setError(requestError.response?.data?.message || "Login failed.");
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
              Train with real verdicts, contests, and a serious dark-mode workflow.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
              React, Tailwind, Monaco, PostgreSQL, and a cloud judge engine in a single coding arena with admin
              tooling for problem creation and testcase management.
            </p>
          </div>

          <div className="p-8 sm:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Welcome back</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-50">Login</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Use your account, or the backend-configured admin credentials.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Field
                label="Username"
                value={form.username}
                onChange={(value) => setForm((current) => ({ ...current, username: value }))}
              />
              <Field
                label="Password"
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
                {submitting ? "Signing in..." : "Login"}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-400">
              Need an account?{" "}
              <Link to="/register" className="font-medium text-sky-300">
                Register here
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
