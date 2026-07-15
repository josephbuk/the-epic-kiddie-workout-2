import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isKidMode = pathname.startsWith("/play/") && pathname !== "/play";

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isKidMode) {
    return <div className="min-h-screen bg-background text-foreground">{children}</div>;
  }

  const nav = [
    { to: "/dashboard", label: "Kids" },
    { to: "/library", label: "Library" },
    { to: "/play", label: "Play mode" },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="font-display text-2xl">RUNGO</Link>
          <nav className="flex items-center gap-1">
            {nav.map((n) => {
              const active = pathname === n.to || pathname.startsWith(n.to + "/");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {n.label}
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="ml-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}