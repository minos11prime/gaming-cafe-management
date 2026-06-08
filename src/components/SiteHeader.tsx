import { Link } from "@tanstack/react-router";
import { Gamepad2, LogOut, UserCircle, Shield } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Home" },
  { to: "/setups", label: "Setups" },
  { to: "/pricing", label: "Pricing" },
  { to: "/tournaments", label: "Tournaments" },
  { to: "/booking", label: "Book" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl bg-background/70">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid place-items-center h-9 w-9 rounded-md bg-gradient-neon shadow-neon">
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="text-gradient-neon">NEONBYTE</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "px-3 py-2 text-sm text-foreground font-medium" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/admin"><Shield className="h-4 w-4 mr-1" />Admin</Link>
            </Button>
          )}
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/my-bookings"><UserCircle className="h-4 w-4 mr-1" />My bookings</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="bg-gradient-neon text-primary-foreground shadow-neon hover:opacity-90">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
