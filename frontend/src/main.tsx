import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@app/router";
import { AppProviders } from "@providers/AppProviders";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Suspense boundary allows route-level lazy loading. */}
    <Suspense fallback={<div className="page-center">Loading module...</div>}>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </Suspense>
  </React.StrictMode>
);
