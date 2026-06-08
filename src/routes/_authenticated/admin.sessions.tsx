import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Play, Pause, Square, Plus, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const GST_RATE = 0.18;

export const Route = createFileRoute("/_authenticated/admin/sessions")({
  component: SessionsAdmin,
});

function elapsedSeconds(s: any): number {
  const start = new Date(s.start_time).getTime();
  const end = s.end_time ? new Date(s.end_time).getTime() : (s.status === "paused" ? new Date(s.paused_at).getTime() : Date.now());
  return Math.max(0, Math.floor((end - start) / 1000) - (s.paused_seconds ?? 0));
}
function calcBill(s: any, tier: string = "free") {
  const hours = elapsedSeconds(s) / 3600;
  const discount = { free: 0, silver: 0.1, gold: 0.2, platinum: 0.3 }[tier] ?? 0;
  const base = hours * Number(s.hourly_rate) * (1 - discount);
  const gst = base * GST_RATE;
  return { hours, base, gst, total: base + gst };
}

function SessionsAdmin() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick((t) => t + 1), 1000); return () => clearInterval(i); }, []);

  const sessions = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gaming_sessions")
        .select("*, pcs(name), profiles(full_name, membership_tier)")
        .order("start_time", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const [open, setOpen] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [pcId, setPcId] = useState("");
  const [userId, setUserId] = useState<string>("");

  const pcs = useQuery({ queryKey: ["pcs-avail-admin"], queryFn: async () => (await supabase.from("pcs").select("*").eq("status","available")).data ?? [] });
  const users = useQuery({ queryKey: ["users-admin"], queryFn: async () => (await supabase.from("profiles").select("id, full_name, membership_tier")).data ?? [] });

  const start = async () => {
    if (!pcId) return toast.error("Pick a PC");
    const pc = (pcs.data ?? []).find((p) => p.id === pcId);
    if (!pc) return;
    const { error } = await supabase.from("gaming_sessions").insert({
      pc_id: pcId, user_id: userId || null, hourly_rate: pc.hourly_rate, status: "active",
    });
    if (error) return toast.error(error.message);
    await supabase.from("pcs").update({ status: "occupied" }).eq("id", pcId);
    toast.success("Session started"); setOpen(false); setPcId(""); setUserId("");
    sessions.refetch(); pcs.refetch();
  };

  const pause = async (s: any) => {
    await supabase.from("gaming_sessions").update({ status: "paused", paused_at: new Date().toISOString() }).eq("id", s.id);
    sessions.refetch();
  };
  const resume = async (s: any) => {
    const add = Math.floor((Date.now() - new Date(s.paused_at).getTime()) / 1000);
    await supabase.from("gaming_sessions").update({ status: "active", paused_at: null, paused_seconds: (s.paused_seconds ?? 0) + add }).eq("id", s.id);
    sessions.refetch();
  };
  const end = async (s: any) => {
    const bill = calcBill(s, s.profiles?.membership_tier ?? "free");
    await supabase.from("gaming_sessions").update({
      status: "ended", end_time: new Date().toISOString(),
      total_amount: Number(bill.total.toFixed(2)), gst_amount: Number(bill.gst.toFixed(2)),
    }).eq("id", s.id);
    await supabase.from("pcs").update({ status: "available" }).eq("id", s.pc_id);
    setInvoice({ ...s, ...bill, end_time: new Date().toISOString() });
    sessions.refetch(); pcs.refetch();
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Sessions</h1>
        <Button onClick={() => setOpen(true)} className="bg-gradient-neon text-primary-foreground shadow-neon"><Plus className="h-4 w-4 mr-1" />Start session</Button>
      </div>
      <div className="mt-6 grid md:grid-cols-2 gap-4" data-tick={tick}>
        {(sessions.data ?? []).map((s: any) => {
          const bill = calcBill(s, s.profiles?.membership_tier ?? "free");
          const e = elapsedSeconds(s);
          const h = Math.floor(e / 3600), m = Math.floor((e % 3600) / 60), sec = e % 60;
          return (
            <div key={s.id} className="rounded-xl bg-card border border-border/60 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-lg">{s.pcs?.name}</div>
                  <div className="text-sm text-muted-foreground">{s.profiles?.full_name ?? "Walk-in"} · {s.profiles?.membership_tier ?? "free"}</div>
                </div>
                <Badge variant="outline">{s.status}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div><div className="text-xs text-muted-foreground">Elapsed</div><div className="text-2xl font-display font-bold text-gradient-neon">{h}:{String(m).padStart(2,"0")}:{String(sec).padStart(2,"0")}</div></div>
                <div><div className="text-xs text-muted-foreground">Bill (incl. GST)</div><div className="text-2xl font-display font-bold">₹{bill.total.toFixed(2)}</div></div>
              </div>
              <div className="mt-4 flex gap-2">
                {s.status === "active" && <Button variant="outline" size="sm" onClick={() => pause(s)}><Pause className="h-4 w-4 mr-1" />Pause</Button>}
                {s.status === "paused" && <Button variant="outline" size="sm" onClick={() => resume(s)}><Play className="h-4 w-4 mr-1" />Resume</Button>}
                {s.status !== "ended" && <Button size="sm" onClick={() => end(s)} className="bg-gradient-neon text-primary-foreground"><Square className="h-4 w-4 mr-1" />End & bill</Button>}
                {s.status === "ended" && <Button size="sm" variant="outline" onClick={() => setInvoice({ ...s, ...bill })}><Printer className="h-4 w-4 mr-1" />Invoice</Button>}
              </div>
            </div>
          );
        })}
        {sessions.data?.length === 0 && <div className="text-muted-foreground">No sessions yet.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Start a session</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>PC</Label>
              <Select value={pcId} onValueChange={setPcId}>
                <SelectTrigger><SelectValue placeholder="Available PC" /></SelectTrigger>
                <SelectContent>{(pcs.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · ₹{p.hourly_rate}/hr</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Customer (optional)</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger><SelectValue placeholder="Walk-in" /></SelectTrigger>
                <SelectContent>{(users.data ?? []).map((u: any) => <SelectItem key={u.id} value={u.id}>{u.full_name ?? "Unnamed"} · {u.membership_tier}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={start} className="w-full bg-gradient-neon text-primary-foreground">Start</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!invoice} onOpenChange={() => setInvoice(null)}>
        <DialogContent className="print:shadow-none">
          <DialogHeader><DialogTitle>Invoice</DialogTitle></DialogHeader>
          {invoice && (
            <div id="invoice" className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">PC</span><span>{invoice.pcs?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{invoice.profiles?.full_name ?? "Walk-in"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Hours</span><span>{invoice.hours?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span>₹{invoice.hourly_rate}/hr</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{invoice.base?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>₹{invoice.gst?.toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-border pt-2 mt-2 font-display text-lg"><span>Total</span><span className="text-gradient-neon">₹{invoice.total?.toFixed(2)}</span></div>
              <Button onClick={() => window.print()} className="w-full mt-4 bg-gradient-neon text-primary-foreground"><Printer className="h-4 w-4 mr-1" />Print</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
