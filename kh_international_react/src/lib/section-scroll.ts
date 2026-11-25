import { getSectionIdForPath } from "./site-pages";

export const HEADER_OFFSET_PX = 80;

export function getPreferredScrollBehavior(behavior: ScrollBehavior): ScrollBehavior {
  if (typeof window === "undefined") return "auto";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "auto";
  }
  return behavior;
}

export function scrollToSectionId(
  sectionId: string,
  behavior: ScrollBehavior = "smooth",
): boolean {
  if (typeof window === "undefined") return false;
  const effectiveBehavior = getPreferredScrollBehavior(behavior);

  if (sectionId === "home") {
    window.scrollTo({ top: 0, behavior: effectiveBehavior });
    return true;
  }

  const target = document.getElementById(sectionId);
  if (!target) return false;

  const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET_PX;
  window.scrollTo({ top: Math.max(0, top), behavior: effectiveBehavior });
  return true;
}

export function scrollToSectionByPath(
  pathname: string,
  behavior: ScrollBehavior = "smooth",
): boolean {
  const sectionId = getSectionIdForPath(pathname);
  if (!sectionId) return false;
  return scrollToSectionId(sectionId, behavior);
}
