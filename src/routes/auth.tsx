import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — NeonByte" },
      { name: "description", content: "Sign in or create your NeonByte account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You can sign in now.");
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) return toast.error("Google sign-in failed.");
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen grid-bg grid place-items-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl neon-border p-8">
        <a href="/" className="flex items-center gap-2 font-display text-lg font-bold justify-center">
          <span className="grid place-items-center h-9 w-9 rounded-md bg-gradient-neon shadow-neon">
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="text-gradient-neon">NEONBYTE</span>
        </a>
        <Tabs defaultValue="signin" className="mt-6">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={signIn} className="space-y-4 mt-4">
              <div><Label htmlFor="e1">Email</Label><Input id="e1" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="p1">Password</Label><Input id="p1" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1.5" /></div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-neon text-primary-foreground shadow-neon">{loading ? "..." : "Sign in"}</Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={signUp} className="space-y-4 mt-4">
              <div><Label htmlFor="n2">Full name</Label><Input id="n2" required value={name} onChange={(e)=>setName(e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="e2">Email</Label><Input id="e2" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="p2">Password</Label><Input id="p2" type="password" required minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1.5" /></div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-neon text-primary-foreground shadow-neon">{loading ? "..." : "Create account"}</Button>
            </form>
          </TabsContent>
        </Tabs>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="flex-1 h-px bg-border" />OR<div className="flex-1 h-px bg-border" /></div>
        <Button onClick={google} variant="outline" className="w-full">Continue with Google</Button>
      </div>
    </div>
  );
}
