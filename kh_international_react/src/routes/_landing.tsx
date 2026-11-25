import { createFileRoute, Outlet } from "@tanstack/react-router";
import { KHLanding } from "@/components/kh/KHLanding";

export const Route = createFileRoute("/_landing")({
  component: LandingLayout,
});

function LandingLayout() {
  return (
    <>
      <KHLanding />
      <Outlet />
    </>
  );
}
