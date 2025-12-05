import "@fontsource/archivo/400.css";
import "@fontsource/archivo/600.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/main.scss";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
