import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, MapPin, Phone } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — NeonByte Gaming Café" },
      { name: "description", content: "Reach out to NeonByte for bookings, events, parties or feedback." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    setSending(false);
    toast.success("Message sent! We'll get back to you shortly.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <PageLayout>
      <section className="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 max-w-5xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Contact</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">Drop us a line.</h1>
          <p className="mt-4 text-muted-foreground">Tournament inquiries, group bookings, party packages — we got you.</p>
          <div className="mt-8 space-y-4 text-sm">
            <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-accent" />221B Cyber Street, Neo City</div>
            <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-accent" />+91 98765 43210</div>
            <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-accent" />hello@neonbyte.gg</div>
          </div>
        </div>
        <form onSubmit={submit} className="rounded-xl bg-card border border-border/60 p-6 space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="msg">Message</Label>
            <Textarea id="msg" required rows={5} className="mt-1.5" />
          </div>
          <Button type="submit" disabled={sending} className="w-full bg-gradient-neon text-primary-foreground shadow-neon">
            {sending ? "Sending..." : "Send message"}
          </Button>
        </form>
      </section>
    </PageLayout>
  );
}
