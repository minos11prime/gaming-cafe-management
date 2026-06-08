import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Cpu, Gamepad2, Trophy, Zap, ArrowRight } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const statsQO = queryOptions({
  queryKey: ["home-stats"],
  queryFn: async () => {
    const [pcs, tournaments] = await Promise.all([
      supabase.from("pcs").select("status"),
      supabase.from("tournaments").select("id").gte("event_date", new Date().toISOString()),
    ]);
    const available = pcs.data?.filter((p) => p.status === "available").length ?? 0;
    return { totalPcs: pcs.data?.length ?? 0, available, tournaments: tournaments.data?.length ?? 0 };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeonByte Gaming Café — Premium PCs, Tournaments & Memberships" },
      { name: "description", content: "Top-tier gaming rigs, hourly play, memberships and tournaments. Book your slot at NeonByte." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQO),
  component: Home,
});

function Home() {
  const { data: stats } = useSuspenseQuery(statsQO);
  return (
    <PageLayout>
      <section className="relative grid-bg overflow-hidden">
        <div className="container mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-32 text-center">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent">
            <Zap className="h-3 w-3" /> Press Start
          </p>
          <h1 className="mt-4 text-4xl md:text-7xl font-display font-black leading-tight">
            Where pixels<br />
            <span className="text-gradient-neon">become legends</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-muted-foreground text-lg">
            High-refresh rigs. Cold drinks. Cleaner aim than your shower. Welcome to NeonByte.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-neon text-primary-foreground shadow-neon hover:opacity-90">
              <Link to="/booking">Book a rig <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/tournaments">View tournaments</Link>
            </Button>
          </div>
          <div className="mt-16 grid grid-cols-3 max-w-xl mx-auto gap-4">
            {[
              { label: "Rigs", value: stats.totalPcs },
              { label: "Available now", value: stats.available },
              { label: "Upcoming events", value: stats.tournaments },
            ].map((s) => (
              <div key={s.label} className="neon-border rounded-xl p-4">
                <div className="text-3xl font-display font-bold text-gradient-neon">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center">Built for the win</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { Icon: Cpu, title: "RTX-powered rigs", body: "RTX 4060–4080 builds with 240Hz panels. Zero excuses." },
            { Icon: Trophy, title: "Real tournaments", body: "Weekly cash prizes across Valorant, CS2, FIFA and more." },
            { Icon: Gamepad2, title: "Membership perks", body: "Up to 30% off, priority booking, and free refuelling." },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="rounded-xl bg-card border border-border/60 p-6 hover:shadow-glow-blue transition-shadow">
              <div className="grid place-items-center h-11 w-11 rounded-lg bg-gradient-neon shadow-neon">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
