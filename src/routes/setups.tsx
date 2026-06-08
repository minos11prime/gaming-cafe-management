import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Cpu } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const pcsQO = queryOptions({
  queryKey: ["pcs-list"],
  queryFn: async () => {
    const { data, error } = await supabase.from("pcs").select("*").order("name");
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/setups")({
  head: () => ({
    meta: [
      { title: "Gaming Setups — NeonByte" },
      { name: "description", content: "Browse our high-end gaming rigs. RTX 4060 to 4080, 144–240Hz panels, premium peripherals." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(pcsQO),
  component: SetupsPage,
});

const statusStyle: Record<string, string> = {
  available: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  occupied: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  maintenance: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

function SetupsPage() {
  const { data: pcs } = useSuspenseQuery(pcsQO);
  return (
    <PageLayout>
      <section className="container mx-auto px-4 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Setups</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">Pick your weapon.</h1>
        <p className="mt-3 text-muted-foreground max-w-xl">All rigs run premium peripherals — Logitech, Razer & SteelSeries — with 1Gbps wired internet.</p>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pcs.map((pc) => (
            <div key={pc.id} className="rounded-xl bg-card border border-border/60 p-5 hover:shadow-glow-blue transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="grid place-items-center h-11 w-11 rounded-lg bg-gradient-neon shadow-neon">
                  <Cpu className="h-5 w-5 text-primary-foreground" />
                </div>
                <Badge variant="outline" className={statusStyle[pc.status]}>{pc.status}</Badge>
              </div>
              <h3 className="mt-4 text-xl font-display font-bold">{pc.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{pc.specs}</p>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-gradient-neon">₹{pc.hourly_rate}</div>
                  <div className="text-xs text-muted-foreground">/ hour</div>
                </div>
                <Button asChild size="sm" disabled={pc.status !== "available"}>
                  <Link to="/booking">Book</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
