import { createFileRoute } from "@tanstack/react-router";
import { buildPageHead } from "@/lib/site-pages";

export const Route = createFileRoute("/_landing/")({
  head: () => buildPageHead("/"),
  component: () => null,
});
