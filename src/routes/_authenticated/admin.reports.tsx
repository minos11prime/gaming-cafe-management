import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: Reports,
});

function Reports() {
  const q = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      const [sessions, profiles] = await Promise.all([
        supabase.from("gaming_sessions").select("start_time, total_amount, user_id").gte("start_time", monthAgo.toISOString()),
        supabase.from("profiles").select("membership_tier"),
      ]);
      const byDay: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
        byDay[d] = 0;
      }
      (sessions.data ?? []).forEach((s: any) => {
        const k = s.start_time.slice(0, 10);
        if (k in byDay) byDay[k] += Number(s.total_amount ?? 0);
      });
      const daily = Object.entries(byDay).map(([date, amt]) => ({ date: date.slice(5), amt }));

      // Weekly bins
      const weekly: { week: string; amt: number }[] = [];
      for (let i = 0; i < daily.length; i += 7) {
        const slice = daily.slice(i, i + 7);
        weekly.push({ week: `W${Math.floor(i/7)+1}`, amt: slice.reduce((a, b) => a + b.amt, 0) });
      }

      const tierCount: Record<string, number> = {};
      (profiles.data ?? []).forEach((p: any) => { tierCount[p.membership_tier] = (tierCount[p.membership_tier] ?? 0) + 1; });
      const tiers = Object.entries(tierCount).map(([name, value]) => ({ name, value }));

      const activeUsers = new Set((sessions.data ?? []).map((s: any) => s.user_id).filter(Boolean));

      return { daily, weekly, tiers, monthly: daily.reduce((a, b) => a + b.amt, 0), activeUsers: activeUsers.size };
    },
  });

  const colors = ["oklch(0.72 0.24 295)", "oklch(0.78 0.2 225)", "oklch(0.74 0.25 340)", "oklch(0.82 0.18 180)"];

  return (
    <div className="p-6 md:p-10 space-y-6">
      <h1 className="text-3xl font-display font-bold">Reports</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-card border border-border/60 p-5"><div className="text-xs text-muted-foreground uppercase">Monthly revenue</div><div className="text-3xl font-display font-bold text-gradient-neon">₹{(q.data?.monthly ?? 0).toLocaleString()}</div></div>
        <div className="rounded-xl bg-card border border-border/60 p-5"><div className="text-xs text-muted-foreground uppercase">Active customers (30d)</div><div className="text-3xl font-display font-bold">{q.data?.activeUsers ?? 0}</div></div>
        <div className="rounded-xl bg-card border border-border/60 p-5"><div className="text-xs text-muted-foreground uppercase">Avg daily</div><div className="text-3xl font-display font-bold">₹{(((q.data?.monthly ?? 0)/30)|0).toLocaleString()}</div></div>
      </div>

      <div className="rounded-xl bg-card border border-border/60 p-5">
        <h2 className="font-display text-lg mb-4">Daily revenue · 30 days</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={q.data?.daily ?? []}>
              <CartesianGrid stroke="oklch(0.3 0.05 270 / 0.4)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="oklch(0.7 0.03 260)" fontSize={11} />
              <YAxis stroke="oklch(0.7 0.03 260)" fontSize={11} />
              <Tooltip contentStyle={{ background: "oklch(0.19 0.04 270)", border: "1px solid oklch(0.3 0.05 270)", borderRadius: 8 }} />
              <Bar dataKey="amt" fill="oklch(0.72 0.24 295)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-card border border-border/60 p-5">
          <h2 className="font-display text-lg mb-4">Weekly revenue</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={q.data?.weekly ?? []}>
                <CartesianGrid stroke="oklch(0.3 0.05 270 / 0.4)" strokeDasharray="3 3" />
                <XAxis dataKey="week" stroke="oklch(0.7 0.03 260)" fontSize={12} />
                <YAxis stroke="oklch(0.7 0.03 260)" fontSize={12} />
                <Tooltip contentStyle={{ background: "oklch(0.19 0.04 270)", border: "1px solid oklch(0.3 0.05 270)", borderRadius: 8 }} />
                <Bar dataKey="amt" fill="oklch(0.78 0.2 225)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl bg-card border border-border/60 p-5">
          <h2 className="font-display text-lg mb-4">Membership distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={q.data?.tiers ?? []} dataKey="value" nameKey="name" outerRadius={80} label>
                  {(q.data?.tiers ?? []).map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.19 0.04 270)", border: "1px solid oklch(0.3 0.05 270)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
