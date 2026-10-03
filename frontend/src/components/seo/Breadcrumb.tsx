import { Link } from "react-router-dom";

type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: c.href ? `https://finguard.io${c.href}` : undefined,
    })),
  };
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-1">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
          {items.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-400" aria-hidden>/</span>}
              {c.href ? (
                <Link to={c.href} className="transition-colors hover:text-[var(--primary)] hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span className="font-medium text-gray-800" aria-current="page">
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
export default Breadcrumb;
