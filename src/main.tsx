import '@fontsource/cormorant-garamond/latin-300.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-700.css';
import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import './archive.css';
import App from "./App";

const Debug = import.meta.env.DEV && new URLSearchParams(location.search).has('debug') ? lazy(() => import('./dev/BatchInspector')) : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<p>Loading review...</p>}>{Debug ? <Debug /> : <App />}</Suspense>
  </StrictMode>
);
