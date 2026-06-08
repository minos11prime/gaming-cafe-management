import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "Book a Rig — NeonByte" },
      { name: "description", content: "Reserve a gaming PC at NeonByte. Pick your rig, date and slot." },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pcId, setPcId] = useState<string>("");
  const [startTime, setStartTime] = useState("");
  const [hours, setHours] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  const { data: pcs } = useQuery({
    queryKey: ["pcs-available"],
    queryFn: async () => {
      const { data } = await supabase.from("pcs").select("*").eq("status", "available").order("name");
      return data ?? [];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to book.");
      navigate({ to: "/auth" });
      return;
    }
    if (!pcId || !startTime) {
      toast.error("Pick a rig and start time.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      pc_id: pcId,
      start_time: new Date(startTime).toISOString(),
      duration_hours: Number(hours),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Booking submitted! Awaiting admin approval.");
    navigate({ to: "/my-bookings" });
  };

  return (
    <PageLayout>
      <section className="container mx-auto px-4 py-16 max-w-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Booking</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">Lock in your slot.</h1>

        <form onSubmit={submit} className="mt-8 rounded-xl bg-card border border-border/60 p-6 space-y-5">
          <div>
            <Label>Rig</Label>
            <Select value={pcId} onValueChange={setPcId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a PC" /></SelectTrigger>
              <SelectContent>
                {pcs?.map((pc) => (
                  <SelectItem key={pc.id} value={pc.id}>{pc.name} — ₹{pc.hourly_rate}/hr</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="start">Start time</Label>
            <Input id="start" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="hours">Duration (hours)</Label>
            <Input id="hours" type="number" min="1" max="12" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} className="mt-1.5" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-gradient-neon text-primary-foreground shadow-neon hover:opacity-90">
            {submitting ? "Submitting..." : user ? "Request booking" : "Sign in to book"}
          </Button>
          {!user && (
            <p className="text-xs text-muted-foreground text-center">You'll be redirected to sign in.</p>
          )}
        </form>
      </section>
    </PageLayout>
  );
}
