export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-20">
      <div className="container mx-auto px-4 py-8 text-sm text-muted-foreground flex flex-col md:flex-row gap-4 justify-between">
        <p>© {new Date().getFullYear()} NeonByte Gaming Café. Press start to continue.</p>
        <p className="text-xs">Built for gamers, by gamers.</p>
      </div>
    </footer>
  );
}
