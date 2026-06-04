"use client";

import { cn } from "@prisma-docs/ui/lib/cn";
import { type AnnotationHandler, type HighlightedCode, InnerToken, Pre } from "codehike/code";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ConceptToken } from "./presets";
import { SmoothPre } from "./smooth-pre";

const AUTOPLAY_INTERVAL = 2600;

const handlers: AnnotationHandler[] = [
  {
    name: "token-transitions",
    PreWithRef: SmoothPre,
    // inline-block so the WAAPI translate animation can move each token
    Token: (props) => <InnerToken merge={props} style={{ display: "inline-block" }} />,
  },
];

export interface PlayerStep {
  tokens: ConceptToken[];
  plain: string;
  caption: string;
}

export function ConceptPlayer({ label, steps }: { label: string; steps: PlayerStep[] }) {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  const codes = useMemo(
    () =>
      steps.map(
        (step) =>
          ({
            tokens: step.tokens,
            code: step.plain,
            lang: "txt",
            meta: "",
            themeName: "concept",
            style: {},
            annotations: [],
          }) as unknown as HighlightedCode,
      ),
    [steps],
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAutoplay(false);
    }
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.5,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!autoplay || paused || !inView) return;
    const id = window.setInterval(
      () => setActive((current) => (current + 1) % steps.length),
      AUTOPLAY_INTERVAL,
    );
    return () => window.clearInterval(id);
  }, [autoplay, paused, inView, steps.length]);

  return (
    <figure
      ref={rootRef}
      role="group"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="not-prose my-4 overflow-hidden rounded-square border border-stroke-neutral bg-fd-card"
    >
      {/* Grid-stacked sizers reserve the tallest/widest step up front, so
          stepping through states never shifts the layout. */}
      <div className="grid overflow-x-auto px-4 py-3.5">
        <div className="col-start-1 row-start-1">
          <Pre
            code={codes[active]}
            handlers={handlers}
            className="type-code-sm whitespace-pre font-mono text-fd-foreground"
          />
        </div>
        {steps.map((step) => (
          <pre
            key={step.plain}
            aria-hidden
            className="type-code-sm invisible col-start-1 row-start-1 whitespace-pre font-mono"
          >
            {step.plain}
          </pre>
        ))}
      </div>
      <figcaption className="flex items-center justify-between gap-4 border-t border-stroke-neutral px-4 py-2.5">
        <span className="grid text-[0.8125rem] text-fd-muted-foreground">
          {steps.map((step, index) => (
            <span
              key={step.plain}
              aria-hidden={index !== active}
              className={cn(
                "col-start-1 row-start-1 transition-opacity duration-300",
                index === active ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              {step.caption}
            </span>
          ))}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {steps.map((step, index) => (
            <button
              key={step.plain}
              type="button"
              aria-label={`Step ${index + 1} of ${steps.length}: ${step.caption}`}
              aria-current={index === active}
              onClick={() => {
                setAutoplay(false);
                setActive(index);
              }}
              className={cn(
                "size-2 rounded-full transition-colors",
                index === active
                  ? "bg-fd-primary"
                  : "bg-fd-muted-foreground/30 hover:bg-fd-muted-foreground/60",
              )}
            />
          ))}
        </span>
      </figcaption>
    </figure>
  );
}
