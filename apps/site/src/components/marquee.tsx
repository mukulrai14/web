"use client";

import {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { cn } from "@prisma-docs/ui/lib/cn";

export type MarqueeProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  direction?: "left" | "up";
  pauseOnHover?: boolean;
  reverse?: boolean;
  fade?: boolean;
  fillContainer?: boolean;
  innerClassName?: string;
  numberOfCopies?: number;
  deferDuplicateCopiesUntilMount?: boolean;
  hideDuplicateCopiesFromAccessibility?: boolean;
};

export function Marquee({
  children,
  direction = "left",
  pauseOnHover = false,
  reverse = false,
  fade = false,
  fillContainer = true,
  className,
  innerClassName,
  numberOfCopies = 2,
  deferDuplicateCopiesUntilMount = false,
  hideDuplicateCopiesFromAccessibility = false,
  style,
  ...rest
}: MarqueeProps) {
  const animationName = direction === "left" ? "marquee-left" : "marquee-up";
  const fadeMask =
    fade
      ? `linear-gradient(${
          direction === "left" ? "to right" : "to bottom"
        }, transparent 0%, rgba(0, 0, 0, 1.0) 10%, rgba(0, 0, 0, 1.0) 90%, transparent 100%)`
      : undefined;

  // CSS hover pause is driven by a custom property on the container. JS only
  // handles offscreen/tab pausing via IntersectionObserver + Visibility API.
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoPaused, setAutoPaused] = useState(false);
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

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

  const copyCount =
    deferDuplicateCopiesUntilMount && !hasMounted ? 1 : numberOfCopies;

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex overflow-hidden [--marquee-play-state:running]",
        pauseOnHover && "hover:[--marquee-play-state:paused]",
        direction === "left" ? "flex-row" : "flex-col",
        className,
      )}
      style={{
        ...style,
        gap: "var(--gap, 1rem)",
        maskImage: fadeMask ?? style?.maskImage,
        WebkitMaskImage: fadeMask ?? style?.WebkitMaskImage ?? style?.maskImage,
      }}
      {...rest}
    >
      {Array(copyCount)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            aria-hidden={hideDuplicateCopiesFromAccessibility && i > 0 ? true : undefined}
            className={cn(
              "flex shrink-0",
              direction === "left"
                ? fillContainer
                  ? "min-w-full flex-row justify-around"
                  : "w-max flex-row justify-start"
                : "min-h-full flex-col justify-start",
              innerClassName,
            )}
            style={
              {
                animation: `${animationName} var(--duration, 40s) linear infinite`,
                animationDirection: reverse ? "reverse" : "normal",
                animationPlayState: autoPaused
                  ? "paused"
                  : "var(--marquee-play-state)",
                gap: "var(--gap, 1rem)",
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
