import { createFileRoute } from "@tanstack/react-router";
import { buildPageHead, findSitePage } from "@/lib/site-pages";

const page = findSitePage("/sustainability")!;

export const Route = createFileRoute("/_landing/sustainability")({
  head: () => buildPageHead(page.path, page.title, page.description),
  component: () => null,
});
