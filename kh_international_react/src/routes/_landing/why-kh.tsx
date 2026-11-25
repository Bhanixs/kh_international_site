import { createFileRoute } from "@tanstack/react-router";
import { buildPageHead, findSitePage } from "@/lib/site-pages";

const page = findSitePage("/why-kh")!;

export const Route = createFileRoute("/_landing/why-kh")({
  head: () => buildPageHead(page.path, page.title, page.description),
  component: () => null,
});
