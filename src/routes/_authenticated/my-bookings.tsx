import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/my-bookings")({
  head: () => ({ meta: [{ title: "My Bookings — NeonByte" }] }),
  component: MyBookings,
});

const statusStyle: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  cancelled: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  completed: "bg-accent/15 text-accent border-accent/30",
};

function MyBookings() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, pcs(name, hourly_rate)")
        .eq("user_id", user!.id)
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cancel = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Booking cancelled.");
    q.refetch();
  };

  return (
    <PageLayout>
      <section className="container mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-display font-bold">My bookings</h1>
        <div className="mt-8 space-y-3">
          {q.data?.length === 0 && <p className="text-muted-foreground">No bookings yet.</p>}
          {q.data?.map((b) => (
            <div key={b.id} className="rounded-xl bg-card border border-border/60 p-5 flex flex-wrap items-center gap-4 justify-between">
              <div>
                <div className="font-display text-lg">{b.pcs?.name ?? "—"}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(b.start_time).toLocaleString()} · {b.duration_hours}h · ₹{Number(b.pcs?.hourly_rate ?? 0) * Number(b.duration_hours)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={statusStyle[b.status]}>{b.status}</Badge>
                {["pending","approved"].includes(b.status) && (
                  <Button variant="outline" size="sm" onClick={() => cancel(b.id)}>Cancel</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
