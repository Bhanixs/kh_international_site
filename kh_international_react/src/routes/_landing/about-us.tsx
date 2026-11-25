import { createFileRoute } from "@tanstack/react-router";
import { buildPageHead, findSitePage } from "@/lib/site-pages";

const page = findSitePage("/about-us")!;

export const Route = createFileRoute("/_landing/about-us")({
  head: () => buildPageHead(page.path, page.title, page.description),
  component: () => null,
});
