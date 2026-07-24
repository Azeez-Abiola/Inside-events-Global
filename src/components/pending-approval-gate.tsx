import { useAuth } from "@/lib/auth-context";
import { IGE_SUPPORT_EMAIL, IGE_SUPPORT_MAILTO } from "@/lib/support-email";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Clock, Mail } from "lucide-react";

export function PendingApprovalGate({ children }: { children: React.ReactNode }) {
  const { isPendingApproval, loading, signOut, roles } = useAuth();
  const isStaff = roles.includes("abw_admin") || roles.includes("super_admin");

  if (loading || !isPendingApproval || isStaff) return <>{children}</>;

  return (
    <>
      <div className="pointer-events-none opacity-40 blur-[1px] select-none" aria-hidden>
        {children}
      </div>

      <AlertDialog open onOpenChange={() => {}}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-6 w-6 text-amber-700" />
            </div>
            <AlertDialogTitle className="text-center">Account pending approval</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-center text-sm text-muted-foreground">
                <p>
                  Thanks for completing your profile. An IGE admin will review your account shortly — you'll
                  receive an email when your dashboard access is approved.
                </p>
                <p>
                  Questions?{" "}
                  <a href={IGE_SUPPORT_MAILTO} className="font-semibold text-primary hover:underline">
                    {IGE_SUPPORT_EMAIL}
                  </a>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <Button type="button" variant="outline" className="gap-2" asChild>
              <a href={IGE_SUPPORT_MAILTO}>
                <Mail className="h-4 w-4" />
                Email support
              </a>
            </Button>
            <Button type="button" variant="ghost" onClick={() => void signOut()}>
              Sign out
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
