import { createFileRoute } from "@tanstack/react-router";
import { buildPageHead, findSitePage } from "@/lib/site-pages";

const page = findSitePage("/compliance")!;

export const Route = createFileRoute("/_landing/compliance")({
  head: () => buildPageHead(page.path, page.title, page.description),
  component: () => null,
});
