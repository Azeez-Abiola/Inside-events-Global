import { createFileRoute } from "@tanstack/react-router";
import { UserRecordPage } from "@/components/admin/user-governance";

export const Route = createFileRoute("/_authenticated/dashboard/user-record/$userId")({
  head: () => ({
    meta: [{ title: "Edit user record - IGE Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: function UserRecordRoute() {
    const { userId } = Route.useParams();
    return <UserRecordPage userId={userId} />;
  },
});
