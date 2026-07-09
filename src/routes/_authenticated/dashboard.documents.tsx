import { createFileRoute, redirect } from "@tanstack/react-router";
import { OrganiserDocumentsPage } from "@/components/dashboards/organiser-pages";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/documents")({
  head: () => ({ meta: [{ title: "Documents - IGE" }] }),
  component: () => {
    const { roles } = useAuth();
    if (!roles.includes("organiser")) throw redirect({ to: "/dashboard" });
    return <OrganiserDocumentsPage />;
  },
});
