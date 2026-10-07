import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/components/calendar/calendar-page";

export const Route = createFileRoute("/_authenticated/dashboard/calendar")({
  head: () => ({ meta: [{ title: "Event Calendar - IGE" }] }),
  component: CalendarPage,
});
