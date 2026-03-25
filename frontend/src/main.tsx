import React from "react";
import { createRoot } from "react-dom/client";
import { AppRoot } from "./AppRoot";
import "./pages/App.css";
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
