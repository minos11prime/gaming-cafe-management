import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/pcs")({
  component: PCsAdmin,
});

type Pc = { id: string; name: string; specs: string | null; hourly_rate: number; status: string };

function PCsAdmin() {
  const q = useQuery({
    queryKey: ["admin-pcs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pcs").select("*").order("name");
      if (error) throw error;
      return data as Pc[];
    },
  });

  const [editing, setEditing] = useState<Partial<Pc> | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => { setEditing({ name: "", specs: "", hourly_rate: 100, status: "available" }); setOpen(true); };
  const openEdit = (p: Pc) => { setEditing(p); setOpen(true); };

  const save = async () => {
    if (!editing?.name) return toast.error("Name required");
    const payload = { name: editing.name, specs: editing.specs ?? "", hourly_rate: Number(editing.hourly_rate), status: editing.status ?? "available" };
    const { error } = editing.id
      ? await supabase.from("pcs").update(payload).eq("id", editing.id)
      : await supabase.from("pcs").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setOpen(false);
    q.refetch();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this PC?")) return;
    const { error } = await supabase.from("pcs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    q.refetch();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("pcs").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    q.refetch();
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">PCs</h1>
        <Button onClick={openNew} className="bg-gradient-neon text-primary-foreground shadow-neon"><Plus className="h-4 w-4 mr-1" />Add PC</Button>
      </div>
      <div className="mt-6 rounded-xl bg-card border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Specs</TableHead><TableHead>Rate</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {q.data?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{p.specs}</TableCell>
                <TableCell><Badge>₹{p.hourly_rate}/hr</Badge></TableCell>
                <TableCell>
                  <Select value={p.status} onValueChange={(v) => updateStatus(p.id, v)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-rose-400" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit PC" : "New PC"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
            <div><Label>Specs</Label><Input value={editing?.specs ?? ""} onChange={(e) => setEditing({ ...editing!, specs: e.target.value })} /></div>
            <div><Label>Hourly rate (₹)</Label><Input type="number" value={editing?.hourly_rate ?? 100} onChange={(e) => setEditing({ ...editing!, hourly_rate: Number(e.target.value) })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={editing?.status ?? "available"} onValueChange={(v) => setEditing({ ...editing!, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={save} className="w-full bg-gradient-neon text-primary-foreground shadow-neon">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
