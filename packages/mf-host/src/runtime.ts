import {
  createInstance,
  type ModuleFederation,
} from "@module-federation/enhanced/runtime";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";

export const MF_STRATEGY: "shared" | "mount" = "shared";

const WIDGETS_URL =
  process.env.NEXT_PUBLIC_WIDGETS_URL ?? "http://localhost:3003";

let federation: ModuleFederation | undefined;

export function getFederation(): ModuleFederation {
  federation ??= createInstance({
    name: "lab_host",
    remotes: [{ name: "widgets", entry: `${WIDGETS_URL}/mf-manifest.json` }],
    shared: {
      react: {
        version: React.version,
        lib: () => React,
        shareConfig: { singleton: true, requiredVersion: false },
      },
      "react-dom": {
        version: ReactDOM.version,
        lib: () => ReactDOM,
        shareConfig: { singleton: true, requiredVersion: false },
      },
      "react-dom/client": {
        version: ReactDOM.version,
        lib: () => ReactDOMClient,
        shareConfig: { singleton: true, requiredVersion: false },
      },
    },
  });
  return federation;
}
