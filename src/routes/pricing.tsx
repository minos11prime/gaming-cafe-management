import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Check, Sparkles } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const memQO = queryOptions({
  queryKey: ["memberships"],
  queryFn: async () => {
    const { data, error } = await supabase.from("memberships").select("*").order("price");
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing & Memberships — NeonByte" },
      { name: "description", content: "Pay by the hour or save with a NeonByte membership. Silver, Gold and Platinum tiers." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(memQO),
  component: PricingPage,
});

function PricingPage() {
  const { data: plans } = useSuspenseQuery(memQO);
  return (
    <PageLayout>
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Pricing</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">Pay-per-play. Or join the club.</h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Hourly from ₹100. Memberships unlock discounts, priority slots, and freebies.</p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((p) => {
            const featured = p.tier === "gold";
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl p-6 border ${featured ? "neon-border shadow-neon" : "bg-card border-border/60"}`}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs uppercase tracking-wider rounded-full bg-gradient-neon text-primary-foreground font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Most popular
                  </span>
                )}
                <h3 className="text-lg font-display uppercase tracking-wider">{p.tier}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-display font-bold text-gradient-neon">₹{p.price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.discount_percent}% off all hourly play</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {(p.perks ?? "").split(",").map((perk) => (
                    <li key={perk} className="flex gap-2"><Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />{perk.trim()}</li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full" variant={featured ? "default" : "outline"}>
                  <Link to="/booking">Get started</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </PageLayout>
  );
}
