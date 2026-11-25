export interface SitePageItem {
  slug: string;
  path: string;
  sectionId: string;
  navLabel: string;
  title: string;
  description: string;
  h1: string;
  isBadge?: boolean;
  relatedPaths: string[];
}

export const HOME_TITLE = "KH International — Premium Vetriver Oil for Fragrance & Beauty";
export const HOME_DESCRIPTION =
  "KH International supplies premium vetriver oil to B2B buyers — fragrance houses, perfume manufacturers, devotional and beauty brands across India, France, and global markets.";

export const sitePages: SitePageItem[] = [
  {
    slug: "about-us",
    path: "/about-us",
    sectionId: "about",
    navLabel: "About Us",
    title: "About KH International — Premium Vetriver Oil & Regenerative Sourcing",
    description:
      "Founded in 2012 in Villupuram, Tamil Nadu. KH International empowers 900+ women across regenerative vetriver farming and handwoven root craft.",
    h1: "About KH International",
    relatedPaths: ["/vetiver-oil", "/sustainability", "/farmers"],
  },
  {
    slug: "vetiver-oil",
    path: "/vetiver-oil",
    sectionId: "product",
    navLabel: "Vetriver Oil",
    title: "Premium Vetriver Oil (Chrysopogon zizanioides) — KH International",
    description:
      "Steam-distilled export-grade vetriver oil from Tamil Nadu with exceptional tenacity, high vetiverol content, and woody-earthy olfactive richness.",
    h1: "Our Vetriver Oil",
    relatedPaths: ["/compliance", "/global-trade", "/why-kh"],
  },
  {
    slug: "why-kh",
    path: "/why-kh",
    sectionId: "why-kh",
    navLabel: "Why KH",
    title: "Why India, Why KH International — Supply Security & Traceability",
    description:
      "De-risking global vetriver sourcing through transparent supply security, regenerative cultivation, and direct farm-to-distillery traceability.",
    h1: "Why India, Why KH International",
    relatedPaths: ["/vetiver-oil", "/sustainability", "/global-trade"],
  },
  {
    slug: "sustainability",
    path: "/sustainability",
    sectionId: "sustainability",
    navLabel: "Sustainability",
    title: "Sustainability & Farmer Partnerships — KH International",
    description:
      "Empowering 500+ women in regenerative vetriver agriculture across 100+ acres and 400+ women artisans in traditional root craft in Tamil Nadu.",
    h1: "Sustainability & Farmer Partnerships",
    relatedPaths: ["/farmers", "/why-kh", "/about-us"],
  },
  {
    slug: "global-trade",
    path: "/global-trade",
    sectionId: "markets",
    navLabel: "Global Trade",
    title: "Global Trade & Export Partnerships — KH International",
    description:
      "Direct B2B supply of export-grade vetriver oil to fragrance houses and cosmetic manufacturers in France, Europe, India, and worldwide.",
    h1: "Global Trade & Partnerships",
    relatedPaths: ["/compliance", "/contact", "/vetiver-oil"],
  },
  {
    slug: "compliance",
    path: "/compliance",
    sectionId: "quality",
    navLabel: "Compliance",
    title: "Global Standards & Compliance Matrix — KH International",
    description:
      "Complete export compliance: DGFT IEC, RCMC CHEMEXCIL, EU REACH readiness, CLP GHS SDS, and authenticated GC-MS batch analysis.",
    h1: "Global Standards & Compliance",
    relatedPaths: ["/reports", "/global-trade", "/vetiver-oil"],
  },
  {
    slug: "farmers",
    path: "/farmers",
    sectionId: "farmers",
    navLabel: "Farmers (தமிழ்)",
    isBadge: true,
    title: "விவசாயிகள் மற்றும் கைவினைஞர்கள் — KH International",
    description:
      "Empowering local agriculture through low-water vetriver farming and handwoven root craft in Villupuram district, Tamil Nadu.",
    h1: "For Partner Farmers & Women Artisans",
    relatedPaths: ["/sustainability", "/about-us", "/contact"],
  },
  {
    slug: "contact",
    path: "/contact",
    sectionId: "contact",
    navLabel: "Trade Inquiry",
    title: "Contact & Commercial Trade Inquiry — KH International",
    description:
      "Inquire about export-grade vetriver oil supply, request a 100g sample vial, or discuss long-term partnership with KH International.",
    h1: "Contact & Commercial Inquiries",
    relatedPaths: ["/reports", "/compliance", "/global-trade"],
  },
];

export function findSitePage(path: string): SitePageItem | undefined {
  return sitePages.find((p) => p.path === path);
}

export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function getSectionIdForPath(pathname: string): string | undefined {
  const normalized = normalizePathname(pathname);
  if (normalized === "/") return "home";
  return findSitePage(normalized)?.sectionId;
}

export function buildPageHead(path: string, title = HOME_TITLE, description = HOME_DESCRIPTION) {
  const url = `https://www.khinternational.org.in${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
