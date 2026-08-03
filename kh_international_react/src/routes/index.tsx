import { createFileRoute } from "@tanstack/react-router";
import { KHLanding } from "@/components/kh/KHLanding";

const TITLE = "KH International — Premium Vetiver Oil for Fragrance & Beauty";
const DESC =
  "KH International supplies premium vetiver oil to B2B buyers — fragrance houses, perfume manufacturers, devotional and beauty brands across India, France, and global markets.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KHLanding,
});
