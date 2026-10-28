import { type ReactNode, ViewTransition } from "react";

const ON_SLIDE = { slide: "slide", default: "none" };

export function SlideTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={ON_SLIDE} exit={ON_SLIDE} default="none">
      {children}
    </ViewTransition>
  );
}
