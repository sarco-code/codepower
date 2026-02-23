import { Link, NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ListChecks, LogOut, Shield, Swords, Trophy, UserCog } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/problems", label: "Problems", icon: ListChecks },
  { to: "/contests", label: "Contests", icon: Trophy }
];

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-grid bg-[size:28px_28px]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-800 bg-slate-950/90 p-6 lg:border-b-0 lg:border-r">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-400/15 p-3 text-sky-300">
              <Swords className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Competitive Judge</p>
              <h1 className="text-xl font-semibold text-slate-100">Sarcstar</h1>
            </div>
          </Link>

          <div className="mt-10 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-sky-400 text-slate-950"
                        : "text-slate-300 hover:bg-slate-900 hover:text-slate-100"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}

            {user?.role === "admin" && (
              <>
                <NavLink
                  to="/admin/problems"
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-amber-400 text-slate-950"
                        : "text-amber-200 hover:bg-amber-500/10"
                    }`
                  }
                >
                  <Shield className="h-4 w-4" />
                  Admin Problems
                </NavLink>
                <NavLink
                  to="/admin/contests"
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-amber-400 text-slate-950"
                        : "text-amber-200 hover:bg-amber-500/10"
                    }`
                  }
                >
                  <Trophy className="h-4 w-4" />
                  Admin Contests
                </NavLink>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-amber-400 text-slate-950"
                        : "text-amber-200 hover:bg-amber-500/10"
                    }`
                  }
                >
                  <UserCog className="h-4 w-4" />
                  Admin Users
                </NavLink>
              </>
            )}
          </div>

          <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Signed in</p>
            <p className="mt-3 text-lg font-semibold text-slate-100">{user?.display_name || user?.username}</p>
            <p className="mt-1 text-sm text-slate-400">{user?.role === "admin" ? "Administrator" : "Contestant"}</p>
            <button
              onClick={logout}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="p-4 sm:p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
