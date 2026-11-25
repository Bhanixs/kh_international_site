import { createFileRoute } from "@tanstack/react-router";
import { buildPageHead, findSitePage } from "@/lib/site-pages";

const page = findSitePage("/global-trade")!;

export const Route = createFileRoute("/_landing/global-trade")({
  head: () => buildPageHead(page.path, page.title, page.description),
  component: () => null,
});
