import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
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

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{ title: "Account settings — IGE" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const fn = useServerFn(deleteMyAccount);
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    setLoading(true);
    try {
      await fn({});
      await supabase.auth.signOut();
      toast.success("Account deleted. Your personal data has been anonymised.");
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold">Account settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your IGE account and data.
        </p>
      </header>

      <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-lg font-semibold text-foreground">Delete account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Permanently delete your account and anonymise your personal data. Deal and
          referral records are retained for accounting purposes (12-month minimum) as
          required for NDPR / GDPR compliance.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="mt-4" disabled={loading}>
              {loading ? "Deleting…" : "Delete my account"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your IGE account?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. Your email, name, and personal links will be
                anonymised; you will be signed out immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
