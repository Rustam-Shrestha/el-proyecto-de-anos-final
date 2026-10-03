import { Link } from "react-router-dom";
import { Seo } from "../components/seo/Seo";

const NotFoundPage = () => {
  return (
    <section className="page-center">
      <Seo path="/404" noindex />
      <div className="panel max-w-lg text-center">
        <h2 className="text-6xl font-bold text-gray-900">404</h2>
        <p className="mt-2 text-lg font-medium text-gray-700">
          Page not found
        </p>
        <p className="mt-1 text-sm text-gray-500">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link className="underline text-sm" to="/">Go to homepage</Link>
          <Link className="underline text-sm" to="/docs">Browse API docs</Link>
          <Link className="underline text-sm" to="/contact">Contact support</Link>
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
