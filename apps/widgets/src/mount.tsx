import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";

export type MountedWidget<P> = {
  update(props: P): void;
  unmount(): void;
};

export function createMount<P extends object>(Widget: ComponentType<P>) {
  return function mount(el: HTMLElement, props: P): MountedWidget<P> {
    const root = createRoot(el);
    root.render(<Widget {...props} />);
    return {
      update(next) {
        root.render(<Widget {...next} />);
      },
      unmount() {
        root.unmount();
      },
    };
  };
}
