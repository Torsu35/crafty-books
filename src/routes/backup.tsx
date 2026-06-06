import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/page-section";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { exportDbBytes, importDbBytes, wipeDb } from "@/lib/db";
import { Download, Upload, Trash2 } from "lucide-react";

export const Route = createFileRoute("/backup")({
  head: () => ({ meta: [{ title: "Backup — Ledger" }] }),
  component: Backup,
});

function Backup() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const bytes = await exportDbBytes();
      const ts = new Date().toISOString().slice(0, 10);
      const blob = new Blob([bytes as BlobPart], { type: "application/x-sqlite3" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledger-backup-${ts}.db`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } finally {
      setBusy(false);
    }
  };

  const restore = async (file: File) => {
    setBusy(true);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      await importDbBytes(buf);
      toast.success("Backup restored");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error("Could not restore — is this a valid backup file?");
    } finally {
      setBusy(false);
    }
  };

  const wipe = async () => {
    await wipeDb();
    toast.success("All data cleared");
    navigate({ to: "/setup", replace: true });
    setTimeout(() => window.location.reload(), 200);
  };

  return (
    <AppShell title="Backup & restore">
      <div className="mx-auto grid max-w-2xl gap-4">
        <Card title="Download a backup">
          <p className="mb-4 text-sm text-muted-foreground">
            Saves a copy of all your data as a single <code className="rounded bg-muted px-1 py-0.5 text-xs">.db</code> file.
            Keep it somewhere safe — e.g. Google Drive, email it to yourself, or copy to a USB drive.
          </p>
          <Button onClick={download} disabled={busy}>
            <Download className="mr-2 h-4 w-4" />
            Download backup
          </Button>
        </Card>

        <Card title="Restore from a backup">
          <p className="mb-4 text-sm text-muted-foreground">
            Replaces all current data with the contents of a backup file. Make a backup first if you're unsure.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".db,application/x-sqlite3,application/octet-stream"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) restore(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
            <Upload className="mr-2 h-4 w-4" />
            Choose backup file
          </Button>
        </Card>

        <Card title="Reset all data">
          <p className="mb-4 text-sm text-muted-foreground">
            Clears every record on this device. This cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete everything
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all data?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your records, inventory and reports will be permanently removed from this device.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={wipe}>Yes, delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      </div>
    </AppShell>
  );
}