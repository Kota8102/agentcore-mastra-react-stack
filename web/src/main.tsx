import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { configureAmplify } from "./lib/amplify-config";

configureAmplify();

// biome-ignore lint/style/noNonNullAssertion: no problem
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
