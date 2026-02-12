import React from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import './styles/globals.css';  // ✅ add this line

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
