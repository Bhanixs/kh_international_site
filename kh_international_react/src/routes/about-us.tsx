import { createFileRoute } from "@tanstack/react-router";
import { About } from "@/components/kh/About";
import { SubPageLayout } from "@/components/kh/SubPageLayout";
import { findSitePage } from "@/lib/site-pages";

const page = findSitePage("/about-us")!;

export const Route = createFileRoute("/about-us")({
  head: () => ({
    meta: [
      { title: page.title },
      { name: "description", content: page.description },
      { property: "og:title", content: page.title },
      { property: "og:description", content: page.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `https://www.khinternational.org.in${page.path}` },
    ],
    links: [{ rel: "canonical", href: `https://www.khinternational.org.in${page.path}` }],
  }),
  component: () => (
    <SubPageLayout page={page}>
      <About asH1={true} />
    </SubPageLayout>
  ),
});
