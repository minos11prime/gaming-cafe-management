import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — NeonByte Gaming Café" },
      { name: "description", content: "NeonByte is a community-first gaming café built for competitive and casual players." },
    ],
  }),
  component: () => (
    <PageLayout>
      <section className="container mx-auto px-4 py-20 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">About</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">A clubhouse for the controller-clutching crowd.</h1>
        <div className="prose prose-invert mt-8 text-muted-foreground space-y-4 text-lg">
          <p>NeonByte was born in 2024 from a simple idea: gaming spaces should feel as good as the games themselves. We obsess over the gear, the chairs, the airflow, the snacks — even the keycaps.</p>
          <p>Whether you're grinding ranked, hosting a LAN with your squad, or learning your first game, our team is here to set you up. We run weekly tournaments, casual nights, and a membership program with serious perks.</p>
          <p>Cleaner peripherals than your kitchen. Faster internet than your house. Better vibes than your group chat.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {[
            { k: "60+", v: "Tournaments hosted" },
            { k: "1Gbps", v: "Dedicated fibre" },
            { k: "24/7", v: "Weekend marathons" },
          ].map((s) => (
            <div key={s.v} className="neon-border rounded-xl p-5">
              <div className="text-3xl font-display font-bold text-gradient-neon">{s.k}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.v}</div>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  ),
});
