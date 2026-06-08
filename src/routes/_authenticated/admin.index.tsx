import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Cpu, PlaySquare, IndianRupee, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [customers, pcs, sessions, dailyRev, monthlyRev, byDay] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("pcs").select("status"),
        supabase.from("gaming_sessions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("gaming_sessions").select("total_amount").gte("start_time", new Date(new Date().setHours(0,0,0,0)).toISOString()),
        supabase.from("gaming_sessions").select("total_amount").gte("start_time", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from("gaming_sessions").select("start_time, total_amount").gte("start_time", new Date(Date.now() - 7*24*3600*1000).toISOString()),
      ]);
      const pcArr = pcs.data ?? [];
      const sum = (arr: any[] | null) => (arr ?? []).reduce((a, b) => a + Number(b.total_amount ?? 0), 0);
      const days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i*24*3600*1000);
        days[d.toISOString().slice(0, 10)] = 0;
      }
      (byDay.data ?? []).forEach((s: any) => {
        const k = s.start_time.slice(0, 10);
        if (k in days) days[k] += Number(s.total_amount ?? 0);
      });
      return {
        customers: customers.count ?? 0,
        active: sessions.count ?? 0,
        available: pcArr.filter((p) => p.status === "available").length,
        occupied: pcArr.filter((p) => p.status === "occupied").length,
        daily: sum(dailyRev.data),
        monthly: sum(monthlyRev.data),
        chart: Object.entries(days).map(([date, revenue]) => ({ date: date.slice(5), revenue })),
      };
    },
  });

  const cards = [
    { label: "Total customers", value: stats.data?.customers ?? 0, Icon: Users },
    { label: "Active sessions", value: stats.data?.active ?? 0, Icon: PlaySquare },
    { label: "Available PCs", value: stats.data?.available ?? 0, Icon: Cpu },
    { label: "Occupied PCs", value: stats.data?.occupied ?? 0, Icon: Cpu },
    { label: "Daily revenue", value: `₹${(stats.data?.daily ?? 0).toLocaleString()}`, Icon: IndianRupee },
    { label: "Monthly revenue", value: `₹${(stats.data?.monthly ?? 0).toLocaleString()}`, Icon: TrendingUp },
  ];

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-3xl font-display font-bold">Dashboard</h1>
      <p className="text-muted-foreground mt-1">Live overview of your café.</p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-xl bg-card border border-border/60 p-5 hover:shadow-glow-blue transition-shadow">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center h-10 w-10 rounded-lg bg-gradient-neon shadow-neon">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
                <div className="text-2xl font-display font-bold">{value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-card border border-border/60 p-5">
        <h2 className="font-display text-lg mb-4">Revenue · last 7 days</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.data?.chart ?? []}>
              <CartesianGrid stroke="oklch(0.3 0.05 270 / 0.4)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="oklch(0.7 0.03 260)" fontSize={12} />
              <YAxis stroke="oklch(0.7 0.03 260)" fontSize={12} />
              <Tooltip contentStyle={{ background: "oklch(0.19 0.04 270)", border: "1px solid oklch(0.3 0.05 270)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="revenue" stroke="oklch(0.72 0.24 295)" strokeWidth={3} dot={{ fill: "oklch(0.78 0.2 225)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
