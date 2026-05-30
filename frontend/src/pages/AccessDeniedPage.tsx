import { Link, useLocation } from "react-router-dom";

const AccessDeniedPage = () => {
  const location = useLocation();
  const fromPath = (location.state as { from?: string } | null)?.from;

  return (
    <section className="page-center">
      <div className="panel max-w-lg text-center">
        <h2 className="text-2xl font-semibold text-red-700">Access Denied</h2>
        <p className="mt-2 text-sm text-slate-700">
          You do not have permission to view this page.
          {fromPath ? ` You tried to access: ${fromPath}` : ""}
        </p>
        <div className="mt-4">
          <Link className="underline" to="/app/dashboard">
            Go back to dashboard
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AccessDeniedPage;
