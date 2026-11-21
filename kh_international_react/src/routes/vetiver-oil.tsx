import { createFileRoute } from "@tanstack/react-router";
import { Product } from "@/components/kh/Product";
import { SubPageLayout } from "@/components/kh/SubPageLayout";
import { findSitePage } from "@/lib/site-pages";

const page = findSitePage("/vetiver-oil")!;

export const Route = createFileRoute("/vetiver-oil")({
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
    <SubPageLayout
      page={page}
      render={(openModal) => <Product asH1={true} onOpenSampleModal={openModal} />}
    />
  ),
});
