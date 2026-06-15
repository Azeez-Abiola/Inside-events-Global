import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/onboarding/profile")({
  component: () => <Navigate to="/signup" search={{ step: "profile" }} replace />,
});

// Re-export field primitives for event editor and other forms.
export {
  Field,
  TextArea,
  SelectField,
  ChipMulti,
  Checkbox,
} from "@/components/signup/profile-fields";
