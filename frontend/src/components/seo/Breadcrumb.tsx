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
      <nav aria-label="Breadcrumb">
        <ol style={{ display: "flex", gap: 8, listStyle: "none", padding: 0, fontSize: 14 }}>
          {items.map((c, i) => (
            <li key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {i > 0 && <span aria-hidden>/</span>}
              {c.href ? <Link to={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
export default Breadcrumb;
