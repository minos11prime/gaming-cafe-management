import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Cpu, Calendar, Trophy, Users, LayoutDashboard, PlaySquare, BarChart3, Gamepad2, ArrowLeft } from "lucide-react";
import { useIsAdmin } from "@/lib/useIsAdmin";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — NeonByte" }] }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/pcs", label: "PCs", icon: Cpu },
  { to: "/admin/sessions", label: "Sessions", icon: PlaySquare },
  { to: "/admin/bookings", label: "Bookings", icon: Calendar },
  { to: "/admin/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
];

function AdminLayout() {
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [loading, isAdmin, navigate]);

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-border/60 bg-card/50 backdrop-blur-xl hidden md:flex md:flex-col">
        <Link to="/" className="flex items-center gap-2 px-5 py-4 font-display font-bold">
          <span className="grid place-items-center h-8 w-8 rounded-md bg-gradient-neon shadow-neon">
            <Gamepad2 className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-gradient-neon">NEONBYTE</span>
        </Link>
        <nav className="flex-1 px-2 py-2 space-y-1">
          {nav.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${
                  active ? "bg-gradient-neon text-primary-foreground shadow-neon" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />{label}
              </Link>
            );
          })}
        </nav>
        <Link to="/" className="m-2 flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
      </aside>
      <main className="flex-1 min-w-0"><Outlet /></main>
    </div>
  );
}
