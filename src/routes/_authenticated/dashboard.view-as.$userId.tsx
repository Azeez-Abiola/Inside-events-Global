import { createFileRoute } from "@tanstack/react-router";
import { ViewAsUserPage } from "@/components/admin/user-governance";

export const Route = createFileRoute("/_authenticated/dashboard/view-as/$userId")({
  head: () => ({
    meta: [{ title: "View as User - IGE Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: function ViewAsRoute() {
    const { userId } = Route.useParams();
    return <ViewAsUserPage userId={userId} />;
  },
});
