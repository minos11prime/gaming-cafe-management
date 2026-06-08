import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/bookings")({
  component: BookingsAdmin,
});

const statusStyle: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  cancelled: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  completed: "bg-accent/15 text-accent border-accent/30",
};

function BookingsAdmin() {
  const q = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, pcs(name), profiles(full_name)")
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Booking ${status}`);
    q.refetch();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("bookings").delete().eq("id", id);
    q.refetch();
  };

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-3xl font-display font-bold">Bookings</h1>
      <div className="mt-6 rounded-xl bg-card border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead><TableHead>PC</TableHead><TableHead>Start</TableHead><TableHead>Hours</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(q.data ?? []).map((b: any) => (
              <TableRow key={b.id}>
                <TableCell>{b.profiles?.full_name ?? "—"}</TableCell>
                <TableCell>{b.pcs?.name ?? "—"}</TableCell>
                <TableCell>{new Date(b.start_time).toLocaleString()}</TableCell>
                <TableCell>{b.duration_hours}</TableCell>
                <TableCell><Badge variant="outline" className={statusStyle[b.status]}>{b.status}</Badge></TableCell>
                <TableCell className="text-right">
                  {b.status === "pending" && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(b.id, "approved")}><Check className="h-4 w-4 text-emerald-400" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(b.id, "rejected")}><X className="h-4 w-4 text-rose-400" /></Button>
                    </>
                  )}
                  {b.status === "approved" && <Button size="sm" variant="ghost" onClick={() => setStatus(b.id, "cancelled")}>Cancel</Button>}
                  <Button size="sm" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4 text-rose-400" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {q.data?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No bookings.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
