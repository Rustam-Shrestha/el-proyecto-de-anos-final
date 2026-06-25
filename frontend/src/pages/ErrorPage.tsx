import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

const ErrorPage = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <section className="page-center">
        <div className="panel max-w-lg text-center">
          <h2 className="text-6xl font-bold text-red-600">{error.status}</h2>
          <p className="mt-2 text-lg font-medium text-gray-700 ">
            {error.statusText}
          </p>
          {error.data?.message && (
            <p className="mt-1 text-sm text-gray-500">{error.data.message}</p>
          )}
          <div className="mt-6">
            <Link className="underline text-sm" to="/dashboard">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "An unexpected error occurred.";

  return (
    <section className="page-center">
      <div className="panel max-w-lg text-center">
        <h2 className="text-2xl font-semibold text-red-700">Something went wrong</h2>
        <p className="mt-2 text-sm text-gray-600 ">{message}</p>
        <div className="mt-6">
          <Link className="underline text-sm" to="/dashboard">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ErrorPage;
