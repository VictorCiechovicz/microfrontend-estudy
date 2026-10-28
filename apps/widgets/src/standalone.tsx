import { createRoot } from "react-dom/client";
import CartWidget from "./CartWidget";
import HelloWidget from "./HelloWidget";
import Recommendations from "./Recommendations";

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <main>
      <h1>widgets</h1>
      <HelloWidget />
      <CartWidget />
      <Recommendations />
    </main>,
  );
}
