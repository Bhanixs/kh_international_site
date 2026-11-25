import { createFileRoute } from "@tanstack/react-router";
import { buildPageHead, findSitePage } from "@/lib/site-pages";

const page = findSitePage("/contact")!;

export const Route = createFileRoute("/_landing/contact")({
  head: () => buildPageHead(page.path, page.title, page.description),
  component: () => null,
});
