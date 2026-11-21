import { createFileRoute } from "@tanstack/react-router";
import { Sustainability } from "@/components/kh/Sustainability";
import { SubPageLayout } from "@/components/kh/SubPageLayout";
import { findSitePage } from "@/lib/site-pages";

const page = findSitePage("/sustainability")!;

export const Route = createFileRoute("/sustainability")({
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
      <Sustainability asH1={true} />
    </SubPageLayout>
  ),
});
