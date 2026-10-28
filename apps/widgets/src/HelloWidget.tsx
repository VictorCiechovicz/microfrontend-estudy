import { useState } from "react";
import { createMount } from "./mount";

export default function HelloWidget() {
  const [text] = useState("Hello from widgets");
  return <p data-testid="hello-widget">{text}</p>;
}

export const mount = createMount(HelloWidget);
