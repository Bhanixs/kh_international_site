import { createFileRoute } from "@tanstack/react-router";
import { buildPageHead, findSitePage } from "@/lib/site-pages";

const page = findSitePage("/farmers")!;

export const Route = createFileRoute("/_landing/farmers")({
  head: () => buildPageHead(page.path, page.title, page.description),
  component: () => null,
});
