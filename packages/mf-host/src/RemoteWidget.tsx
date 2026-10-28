"use client";

import {
  Component,
  type ComponentType,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { getFederation } from "./runtime";

export type WidgetProps = {
  HelloWidget: Record<string, never>;
  CartWidget: Record<string, never>;
  Recommendations: { excludeId?: number; lang?: "pt" | "en" };
};

export type WidgetName = keyof WidgetProps;

type WidgetModule<P> = { default?: ComponentType<P> };

type LoadState<N extends WidgetName> =
  | { name: N; status: "ready"; Widget: ComponentType<WidgetProps[N]> }
  | { name: N; status: "failed" };

export type RemoteWidgetProps<N extends WidgetName> = {
  name: N;
  props?: WidgetProps[N];
  fallback?: ReactNode;
};

const DEFAULT_FALLBACK = (
  <span data-testid="widget-fallback">Widget unavailable</span>
);

class WidgetErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function RemoteWidget<N extends WidgetName>({
  name,
  props,
  fallback = DEFAULT_FALLBACK,
}: RemoteWidgetProps<N>) {
  const [state, setState] = useState<LoadState<N> | null>(null);

  useEffect(() => {
    let active = true;
    getFederation()
      .loadRemote<WidgetModule<WidgetProps[N]>>(`widgets/${name}`)
      .then((mod) => {
        if (!active) return;
        setState(
          mod?.default
            ? { name, status: "ready", Widget: mod.default }
            : { name, status: "failed" },
        );
      })
      .catch((error) => {
        console.warn(error);
        if (active) setState({ name, status: "failed" });
      });
    return () => {
      active = false;
    };
  }, [name]);

  if (state?.name !== name) return null;
  if (state.status === "failed") return fallback;
  const { Widget } = state;
  return (
    <WidgetErrorBoundary key={name} fallback={fallback}>
      <Widget {...(props ?? ({} as WidgetProps[N]))} />
    </WidgetErrorBoundary>
  );
}
