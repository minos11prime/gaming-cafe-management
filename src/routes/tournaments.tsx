import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Trophy, Calendar, Users, Coins } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";

const tQO = queryOptions({
  queryKey: ["tournaments-public"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .gte("event_date", new Date().toISOString())
      .order("event_date");
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/tournaments")({
  head: () => ({
    meta: [
      { title: "Tournaments — NeonByte" },
      { name: "description", content: "Upcoming gaming tournaments at NeonByte. Cash prizes, ranked brackets, weekly events." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(tQO),
  component: TournamentsPage,
});

function TournamentsPage() {
  const { data: tournaments } = useSuspenseQuery(tQO);
  return (
    <PageLayout>
      <section className="container mx-auto px-4 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Tournaments</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">Cash. Glory. Bragging rights.</h1>

        {tournaments.length === 0 ? (
          <div className="mt-10 rounded-xl border border-border/60 p-10 text-center text-muted-foreground">
            No upcoming tournaments. Check back soon.
          </div>
        ) : (
          <div className="mt-10 grid md:grid-cols-2 gap-5">
            {tournaments.map((t) => (
              <div key={t.id} className="rounded-xl bg-card border border-border/60 p-6 hover:shadow-glow-blue transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="grid place-items-center h-11 w-11 rounded-lg bg-gradient-neon shadow-neon">
                    <Trophy className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase text-muted-foreground">Prize pool</div>
                    <div className="text-xl font-display font-bold text-gradient-neon">₹{Number(t.prize_pool).toLocaleString()}</div>
                  </div>
                </div>
                <h3 className="mt-4 text-2xl font-display font-bold">{t.name}</h3>
                <p className="mt-1 text-sm text-accent">{t.game}</p>
                <p className="mt-3 text-sm text-muted-foreground">{t.description}</p>
                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" />{new Date(t.event_date).toLocaleDateString()}</div>
                  <div className="flex items-center gap-2"><Coins className="h-4 w-4 text-accent" />₹{t.entry_fee}</div>
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-accent" />{t.max_participants ?? "—"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
