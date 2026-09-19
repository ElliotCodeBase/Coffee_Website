"use client";

import { Component, type ReactNode } from "react";

/* A render error inside a Server Component propagates up through the
   React tree exactly like a render error in a Client Component. Without
   something in the tree willing to catch it, it keeps propagating past
   unrelated siblings (like the header) until it reaches the nearest
   error boundary — which, if there isn't one nearby, is Next's own
   route-level error.tsx (or, with no error.tsx, the framework's built-in
   fallback), replacing the ENTIRE page.

   Wrapping each independent section of a page in its own boundary stops
   a failure in one section from being able to reach — and blank out —
   any other. This has to be a Client Component: error boundaries are a
   React class-component feature with no Server Component equivalent. */
export default class SectionErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Section failed to render:", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
