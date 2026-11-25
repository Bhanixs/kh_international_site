import { createFileRoute } from "@tanstack/react-router";
import { buildPageHead, findSitePage } from "@/lib/site-pages";

const page = findSitePage("/vetiver-oil")!;

export const Route = createFileRoute("/_landing/vetiver-oil")({
  head: () => buildPageHead(page.path, page.title, page.description),
  component: () => null,
});
