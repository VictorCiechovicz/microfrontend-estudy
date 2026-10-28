import { createRoot } from "react-dom/client";
import HelloWidget from "./HelloWidget";

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <main>
      <h1>widgets</h1>
      <HelloWidget />
    </main>,
  );
}
