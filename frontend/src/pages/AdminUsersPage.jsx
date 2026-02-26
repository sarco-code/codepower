import { useEffect, useState } from "react";
import api from "../services/api";
import Loader from "../components/Loader";
import { formatDate } from "../utils/format";

export default function AdminUsersPage() {
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    displayName: "",
    password: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadUsers() {
    const response = await api.get("/admin/users");
    setUsers(response.data.users);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreateAdmin(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/admin/users/admin", form);
      setForm({ username: "", email: "", displayName: "", password: "" });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to create admin.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleRole(user) {
    await api.patch(`/admin/users/${user.id}/role`, {
      role: user.role === "admin" ? "user" : "admin"
    });
    await loadUsers();
  }

  async function handleDelete(user) {
    await api.delete(`/admin/users/${user.id}`);
    await loadUsers();
  }

  if (!users) {
    return <Loader label="Loading users..." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-6 shadow-glow">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">User Roles</h1>
        <div className="mt-6 space-y-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">{user.display_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    @{user.username} • {user.email} • {formatDate(user.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleRole(user)}
                    className={`rounded-2xl px-4 py-2 text-sm ${
                      user.role === "admin"
                        ? "border border-amber-500/20 bg-amber-500/10 text-amber-300"
                        : "border border-slate-700 text-slate-200"
                    }`}
                  >
                    {user.role === "admin" ? "Make User" : "Make Admin"}
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-6 shadow-glow">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Create account</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-100">Add Admin</h2>
        <form onSubmit={handleCreateAdmin} className="mt-6 space-y-4">
          <Field
            label="Username"
            value={form.username}
            onChange={(value) => setForm((current) => ({ ...current, username: value }))}
          />
          <Field
            label="Email"
            value={form.email}
            onChange={(value) => setForm((current) => ({ ...current, email: value }))}
          />
          <Field
            label="Display Name"
            value={form.displayName}
            onChange={(value) => setForm((current) => ({ ...current, displayName: value }))}
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
            className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Admin"}
          </button>
        </form>
      </section>
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
        className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-500"
      />
    </label>
  );
}
