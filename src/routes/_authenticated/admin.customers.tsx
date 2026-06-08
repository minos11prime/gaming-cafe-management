import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: Customers,
});

function Customers() {
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateTier = async (id: string, tier: string) => {
    const { error } = await supabase.from("profiles").update({ membership_tier: tier }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Tier updated");
    q.refetch();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    q.refetch();
  };

  const filtered = (q.data ?? []).filter((c) =>
    !search || (c.full_name ?? "").toLowerCase().includes(search.toLowerCase()) || (c.phone ?? "").includes(search)
  );

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-3xl font-display font-bold">Customers</h1>
      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or phone..." className="pl-9" />
        </div>
      </div>
      <div className="mt-6 rounded-xl bg-card border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Membership</TableHead><TableHead>Joined</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.full_name ?? "—"}</TableCell>
                <TableCell>{c.phone ?? "—"}</TableCell>
                <TableCell>
                  <Select value={c.membership_tier} onValueChange={(v) => updateTier(c.id, v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["free","silver","gold","platinum"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Badge variant="outline">{new Date(c.created_at).toLocaleDateString()}</Badge></TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-rose-400" /></Button></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No customers.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
