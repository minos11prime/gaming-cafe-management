import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/tournaments")({
  component: TournamentsAdmin,
});

function TournamentsAdmin() {
  const q = useQuery({
    queryKey: ["admin-tournaments"],
    queryFn: async () => (await supabase.from("tournaments").select("*").order("event_date")).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [t, setT] = useState<any>({ name: "", game: "", event_date: "", prize_pool: 0, entry_fee: 0, max_participants: 16, description: "" });

  const openNew = () => { setT({ name: "", game: "", event_date: "", prize_pool: 0, entry_fee: 0, max_participants: 16, description: "" }); setOpen(true); };
  const openEdit = (row: any) => { setT({ ...row, event_date: row.event_date.slice(0, 16) }); setOpen(true); };

  const save = async () => {
    const payload = { ...t, event_date: new Date(t.event_date).toISOString(), prize_pool: Number(t.prize_pool), entry_fee: Number(t.entry_fee), max_participants: Number(t.max_participants) };
    const { error } = t.id ? await supabase.from("tournaments").update(payload).eq("id", t.id) : await supabase.from("tournaments").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setOpen(false); q.refetch();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("tournaments").delete().eq("id", id);
    q.refetch();
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Tournaments</h1>
        <Button onClick={openNew} className="bg-gradient-neon text-primary-foreground shadow-neon"><Plus className="h-4 w-4 mr-1" />Add</Button>
      </div>
      <div className="mt-6 rounded-xl bg-card border border-border/60 overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Game</TableHead><TableHead>Date</TableHead><TableHead>Prize</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {(q.data ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.game}</TableCell>
                <TableCell>{new Date(row.event_date).toLocaleString()}</TableCell>
                <TableCell>₹{Number(row.prize_pool).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(row.id)}><Trash2 className="h-4 w-4 text-rose-400" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.id ? "Edit" : "New"} tournament</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} /></div>
            <div><Label>Game</Label><Input value={t.game} onChange={(e) => setT({ ...t, game: e.target.value })} /></div>
            <div><Label>Date & time</Label><Input type="datetime-local" value={t.event_date} onChange={(e) => setT({ ...t, event_date: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Prize ₹</Label><Input type="number" value={t.prize_pool} onChange={(e) => setT({ ...t, prize_pool: e.target.value })} /></div>
              <div><Label>Entry ₹</Label><Input type="number" value={t.entry_fee} onChange={(e) => setT({ ...t, entry_fee: e.target.value })} /></div>
              <div><Label>Max</Label><Input type="number" value={t.max_participants} onChange={(e) => setT({ ...t, max_participants: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={t.description ?? ""} onChange={(e) => setT({ ...t, description: e.target.value })} /></div>
            <Button onClick={save} className="w-full bg-gradient-neon text-primary-foreground">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
