import { createFileRoute } from "@tanstack/react-router";
import { WhyKH } from "@/components/kh/WhyKH";
import { SubPageLayout } from "@/components/kh/SubPageLayout";
import { findSitePage } from "@/lib/site-pages";

const page = findSitePage("/why-kh")!;

export const Route = createFileRoute("/why-kh")({
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
      <WhyKH asH1={true} />
    </SubPageLayout>
  ),
});
