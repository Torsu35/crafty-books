import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useProfile } from "@/lib/use-db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ledger — Offline Accounting" },
      {
        name: "description",
        content:
          "Offline-first bookkeeping for sole proprietors in Ghana. No accounting knowledge required.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  useEffect(() => {
    if (loading) return;
    if (profile) navigate({ to: "/dashboard", replace: true });
    else navigate({ to: "/setup", replace: true });
  }, [loading, profile, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-primary-foreground shadow-[var(--shadow-elegant)]"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          L
        </div>
        <p className="text-sm text-muted-foreground">Opening your books…</p>
      </div>
    </div>
  );
}
