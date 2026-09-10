import { Link } from "react-router-dom";
import { Seo } from "../components/seo/Seo";

const NotFoundPage = () => {
  return (
    <section className="page-center" style={{ padding: 32, textAlign: "center" }}>
      <Seo path="/404" noindex />
      <h1>Page not found (404)</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
        <Link to="/">Go to homepage</Link>
        <Link to="/docs">Browse API docs</Link>
        <Link to="/contact">Contact support</Link>
      </div>
    </section>
  );
};

export default NotFoundPage;
