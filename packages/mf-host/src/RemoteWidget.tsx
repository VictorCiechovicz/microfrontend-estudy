"use client";

import { type ComponentType, type ReactNode, useEffect, useState } from "react";
import { getFederation } from "./runtime";

export type WidgetName = "HelloWidget";

type WidgetModule<P> = { default: ComponentType<P> };

type LoadState<P> =
  | { status: "loading" }
  | { status: "ready"; Widget: ComponentType<P> }
  | { status: "failed" };

export type RemoteWidgetProps<P> = {
  name: WidgetName;
  props?: P;
  fallback?: ReactNode;
};

export function RemoteWidget<P extends object>({
  name,
  props,
  fallback,
}: RemoteWidgetProps<P>) {
  const [state, setState] = useState<LoadState<P>>({ status: "loading" });

  useEffect(() => {
    let active = true;
    getFederation()
      .loadRemote<WidgetModule<P>>(`widgets/${name}`)
      .then((mod) => {
        if (!active) return;
        setState(
          mod?.default
            ? { status: "ready", Widget: mod.default }
            : { status: "failed" },
        );
      })
      .catch((error) => {
        console.error(error);
        if (active) setState({ status: "failed" });
      });
    return () => {
      active = false;
    };
  }, [name]);

  if (state.status === "failed") {
    return (
      fallback ?? <span data-testid="widget-fallback">Widget unavailable</span>
    );
  }
  if (state.status === "loading") return null;
  const { Widget } = state;
  return <Widget {...(props as P)} />;
}
