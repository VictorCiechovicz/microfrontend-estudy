import {
  createInstance,
  type ModuleFederation,
} from "@module-federation/enhanced/runtime";
import * as React from "react";
import * as JSXDevRuntime from "react/jsx-dev-runtime";
import * as JSXRuntime from "react/jsx-runtime";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";

const WIDGETS_URL =
  process.env.NEXT_PUBLIC_WIDGETS_URL ?? "http://localhost:3003";

let federation: ModuleFederation | undefined;

function singleton(version: string, lib: () => object) {
  return {
    version,
    lib,
    shareConfig: { singleton: true, requiredVersion: false as const },
  };
}

export function getFederation(): ModuleFederation {
  federation ??= createInstance({
    name: "lab_host",
    remotes: [{ name: "widgets", entry: `${WIDGETS_URL}/mf-manifest.json` }],
    shared: {
      react: singleton(React.version, () => React),
      "react/jsx-runtime": singleton(React.version, () => JSXRuntime),
      "react/jsx-dev-runtime": singleton(React.version, () => JSXDevRuntime),
      "react-dom": singleton(ReactDOM.version, () => ReactDOM),
      "react-dom/client": singleton(ReactDOM.version, () => ReactDOMClient),
    },
  });
  return federation;
}
