const ADDRESS = "123 Fintech Ave, San Francisco, CA 94105";

export function MapEmbed({ showDetails = true }: { showDetails?: boolean }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FinGuard",
    url: "https://finguard.io",
    telephone: "+1-555-123-4567",
    email: "support@finguard.io",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Fintech Ave",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      postalCode: "94105",
      addressCountry: "US",
    },
  };
  return (
    <div style={{ width: "100%" }}>
      <iframe
        title="FinGuard location"
        src={`https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&z=15&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        style={{ width: "100%", height: 400, border: 0, borderRadius: 8 }}
      />
      {showDetails && (
        <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6 }}>
          <div>{ADDRESS}</div>
          <div>Phone: +1 (555) 123-4567</div>
          <div>Email: support@finguard.io</div>
          <div>Hours: Mon–Fri 9am–6pm PT</div>
          <a href={`https://maps.google.com/?q=${encodeURIComponent(ADDRESS)}`} target="_blank" rel="noopener noreferrer">
            Open in Google Maps
          </a>{" "}
          |{" "}
          <a href={`https://maps.apple.com/?address=${encodeURIComponent(ADDRESS)}`}>Get Directions</a>
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
export default MapEmbed;
