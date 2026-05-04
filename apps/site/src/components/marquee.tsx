"use client";

import {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@prisma-docs/ui/lib/cn";

export type MarqueeProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  direction?: "left" | "up";
  pauseOnHover?: boolean;
  reverse?: boolean;
  fade?: boolean;
  innerClassName?: string;
  numberOfCopies?: number;
};

export function Marquee({
  children,
  direction = "left",
  pauseOnHover = false,
  reverse = false,
  fade = false,
  className,
  innerClassName,
  numberOfCopies = 2,
  style,
  ...rest
}: MarqueeProps) {
  const animationName = direction === "left" ? "marquee-left" : "marquee-up";

  // #3 – CSS animation pausing: toggle `paused` class when the marquee is
  //       outside the viewport or the tab is backgrounded.
  // #5 – Tab Visibility API combined with IntersectionObserver below.
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoPaused, setAutoPaused] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isInView = true; // assume visible until the IO says otherwise
    let isTabVisible = !document.hidden;

    const update = () => setAutoPaused(!isInView || !isTabVisible);

    // #1 – IntersectionObserver: pause when scrolled off-screen.
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => {
          isInView = entry.isIntersecting;
          update();
        },
        { threshold: 0.05 },
      );
      io.observe(el);
    }

    // #5 – Tab Visibility API.
    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      update();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "group flex gap-[1rem] overflow-hidden",
        direction === "left" ? "flex-row" : "flex-col",
        className,
      )}
      style={{
        ...style,
        maskImage: fade
          ? `linear-gradient(${
              direction === "left" ? "to right" : "to bottom"
            }, transparent 0%, rgba(0, 0, 0, 1.0) 10%, rgba(0, 0, 0, 1.0) 90%, transparent 100%)`
          : undefined,
        WebkitMaskImage: fade
          ? `linear-gradient(${
              direction === "left" ? "to right" : "to bottom"
            }, transparent 0%, rgba(0, 0, 0, 1.0) 10%, rgba(0, 0, 0, 1.0) 90%, transparent 100%)`
          : undefined,
      }}
      {...rest}
    >
      {Array(numberOfCopies)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-[1rem] [--gap:1rem] shrink-0",
              direction === "left"
                ? "min-w-full flex-row justify-around"
                : "min-h-full flex-col justify-start",
              pauseOnHover && "group-hover:paused",
              // #3 – apply `paused` utility (animation-play-state: paused)
              // when viewport or tab visibility says to stop.
              autoPaused && "paused",
              innerClassName,
            )}
            style={
              {
                animation: `${animationName} var(--duration, 40s) linear infinite`,
                animationDirection: reverse ? "reverse" : "normal",
                willChange: "transform",
              } as CSSProperties
            }
          >
            {children}
          </div>
        ))}
    </div>
  );
}
