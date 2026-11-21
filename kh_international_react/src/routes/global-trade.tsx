import { createFileRoute } from "@tanstack/react-router";
import { MarketsFrance } from "@/components/kh/MarketsFrance";
import { SubPageLayout } from "@/components/kh/SubPageLayout";
import { findSitePage } from "@/lib/site-pages";

const page = findSitePage("/global-trade")!;

export const Route = createFileRoute("/global-trade")({
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
      render={(openModal) => <MarketsFrance asH1={true} onOpenSampleModal={openModal} />}
    />
  ),
});
