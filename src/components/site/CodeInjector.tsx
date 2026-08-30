"use client";

import { useEffect, useRef } from "react";

interface Props {
  snippets: { id: string; code: string }[];
}

/**
 * Injects developer-authored HTML/CSS/JS snippets into the page.
 *
 * Why this exists: setting innerHTML (via dangerouslySetInnerHTML) does NOT
 * execute <script> tags — that's a browser security behavior, not a React
 * quirk. To actually run injected scripts (e.g. Google Analytics, Meta
 * Pixel), we manually parse the snippet and recreate any <script> tags as
 * real DOM nodes, which browsers DO execute.
 */
export default function CodeInjector({ snippets }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    snippets.forEach(({ code }) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = code;

      // Recreate <script> tags so the browser executes them
      wrapper.querySelectorAll("script").forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = oldScript.textContent;
        oldScript.replaceWith(newScript);
      });

      container.appendChild(wrapper);
    });

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [snippets]);

  if (snippets.length === 0) return null;
  return <div ref={containerRef} />;
}
