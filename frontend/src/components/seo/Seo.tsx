import { useEffect } from "react";
import { SITE_URL, PAGE_TITLES, META_DESCRIPTIONS, canonicalUrl } from "../../config/seo";

type SeoProps = {
  path?: string;
  title?: string;
  description?: string;
  noindex?: boolean;
};

export function Seo({ path, title, description, noindex }: SeoProps) {
  const loc = path ?? window.location.pathname;
  const resolvedTitle = title ?? PAGE_TITLES[loc] ?? PAGE_TITLES["/"];
  const resolvedDesc = description ?? META_DESCRIPTIONS[loc] ?? META_DESCRIPTIONS["/"];
  const canonical = canonicalUrl(loc);

  useEffect(() => {
    document.title = resolvedTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", resolvedDesc);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);

    let robots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, nofollow");
    } else if (robots) {
      robots.setAttribute("content", "index, follow");
    }
  }, [resolvedTitle, resolvedDesc, canonical, noindex]);

  return null;
}

export function buildCanonical(path: string) {
  return canonicalUrl(path);
}

export { SITE_URL };
export default Seo;
