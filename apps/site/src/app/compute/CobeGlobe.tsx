"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { useTheme } from "@prisma-docs/ui/components/theme-provider";
import { COBE_MARKER_DOT_RGB, cobeGlobe, hexToRgb01, light } from "./tokens";

const DATA_CENTER_MARKERS: {
  location: [number, number];
  id: string;
  /** Region name shown above the marker (cobe bindable `id` → `--cobe-{id}` / `--cobe-visible-{id}`). */
  name: string;
}[] = [
  { id: "dc-sanjose", location: [37.37, -121.92], name: "us-west-1" },
  { id: "dc-ashburn", location: [39.04, -77.49], name: "us-east-1" },
  { id: "dc-dublin", location: [53.35, -6.26], name: "eu-west-1" },
  { id: "dc-frankfurt", location: [50.11, 8.68], name: "eu-central-1" },
  { id: "dc-singapore", location: [1.35, 103.82], name: "ap-southeast-1" },
  { id: "dc-tokyo", location: [35.68, 139.65], name: "ap-northeast-1" },
  { id: "dc-sydney", location: [-33.87, 151.21], name: "ap-southeast-2" },
  { id: "dc-saopaulo", location: [-23.55, -46.63], name: "sa-east-1" },
];

const DATA_CENTER_ARCS: {
  from: [number, number];
  to: [number, number];
  id: string;
}[] = [
  { id: "dc-west-east", from: [37.37, -121.92], to: [39.04, -77.49] },
  { id: "dc-dublin-frankfurt", from: [53.35, -6.26], to: [50.11, 8.68] },
  { id: "dc-singapore-tokyo", from: [1.35, 103.82], to: [35.68, 139.65] },
];

const PHI = 0;
const THETA = 0.2;
const MAP_SAMPLES = 16000;
const MAP_BASE_BRIGHTNESS = 0.025;
const SCALE = 1;
const OFFSET: [number, number] = [0, 0];
const MARKER_SIZE = 0.025;
const MARKER_ELEVATION = 0;
const ARC_HEIGHT = 0.5;
const ARC_WIDTH = 0.4;
const AUTO_ROTATE_SPEED = 0.0003;

// ─── Theme presets ─────────────────────────────────────────────────────────────
const _lightGlobe = cobeGlobe(true);

const LIGHT_COLORS = {
  dark: -2 as number,
  diffuse: 0.6 as number,
  mapBrightness: 6,
  mapBaseBrightness: MAP_BASE_BRIGHTNESS,
  baseColor: _lightGlobe.baseColor as [number, number, number],
  markerColor: _lightGlobe.markerColor as [number, number, number],
  glowColor: _lightGlobe.glowColor as [number, number, number],
  arcColor: _lightGlobe.arcColor as [number, number, number],
  markerDotRgb: COBE_MARKER_DOT_RGB(false),
};
const _darkGlobe = cobeGlobe(false);

/** Dark mode — existing cobeGlobe tokens, unchanged. */
const DARK_COLORS = {
  dark: 1,
  diffuse: 0.6,
  mapBrightness: 12,
  mapBaseBrightness: MAP_BASE_BRIGHTNESS,
  baseColor: _darkGlobe.baseColor as [number, number, number],
  markerColor: _darkGlobe.markerColor as [number, number, number],
  glowColor: _darkGlobe.glowColor as [number, number, number],
  arcColor: _darkGlobe.arcColor as [number, number, number],
  markerDotRgb: COBE_MARKER_DOT_RGB(false),
};

export function CobeGlobe({ showLabels = true }: { showLabels?: boolean }) {
  const { resolvedTheme } = useTheme();

  // isRevealed drives the container opacity. Starts false (invisible), set to
  // true once the globe has rendered its first real frame. Resets automatically
  // on unmount → React StrictMode safe, no manual cleanup needed.
  const [isRevealed, setIsRevealed] = useState(false);

  // Refs that the RAF tick closure reads on every frame without needing to
  // be recreated (avoids stale closures with [] deps).
  const isDarkRef = useRef(resolvedTheme === "dark");
  const showLabelsRef = useRef(showLabels);

  useEffect(() => {
    isDarkRef.current = resolvedTheme === "dark";
  }, [resolvedTheme]);
  useEffect(() => {
    showLabelsRef.current = showLabels;
  }, [showLabels]);

  // containerRef is the only React-managed DOM node. The canvas is created
  // imperatively so React's reconciler can never conflict with COBE v2's
  // own canvas-wrapping (COBE moves the canvas into its own <div> during init).
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);

  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiRef = useRef(0);
  const thetaOffsetRef = useRef(0);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (pointerInteracting.current !== null) {
      dragOffset.current = {
        phi: (e.clientX - pointerInteracting.current.x) / 150,
        theta: (e.clientY - pointerInteracting.current.y) / 300,
      };
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create the canvas imperatively — it never enters React's virtual DOM,
    // so React reconciliation can't move it back after COBE wraps it.
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const handlePointerDown = (e: PointerEvent) => {
      pointerInteracting.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = "grabbing";
    };
    canvas.addEventListener("pointerdown", handlePointerDown);

    let animationId = 0;
    let globe: ReturnType<typeof createGlobe> | null = null;

    // ── Pause / resume helpers ───────────────────────────────────────────
    // We track two independent signals: IntersectionObserver (#1) and the
    // Tab Visibility API (#5). The RAF stops when either fires and restarts
    // as soon as both are clear.
    let isInView = false; // set true by IO on first intersect
    let isTabVisible =
      typeof document !== "undefined" ? !document.hidden : true;

    const maybePause = () => {
      if (animationId !== 0) {
        cancelAnimationFrame(animationId);
        animationId = 0;
      }
    };

    const maybeResume = () => {
      if (isInView && isTabVisible && animationId === 0 && globe) {
        animationId = requestAnimationFrame(tick);
      }
    };
    // ─────────────────────────────────────────────────────────────────────

    const tick = () => {
      if (!globe) return;
      const colors = isDarkRef.current ? DARK_COLORS : LIGHT_COLORS;
      phiRef.current += AUTO_ROTATE_SPEED;
      globe.update({
        phi: PHI + phiRef.current + dragOffset.current.phi,
        theta: THETA + thetaOffsetRef.current + dragOffset.current.theta,
        width: canvas.offsetWidth,
        height: canvas.offsetWidth,
        dark: colors.dark,
        diffuse: colors.diffuse,
        mapBrightness: colors.mapBrightness,
        mapBaseBrightness: colors.mapBaseBrightness,
        baseColor: colors.baseColor,
        markerColor: colors.markerColor,
        glowColor: colors.glowColor,
        arcColor: colors.arcColor,
      });
      animationId = requestAnimationFrame(tick);
    };

    // #3 – CSS animation pausing: the cobe canvas itself is WebGL, not a
    // CSS animation, so we handle it via the RAF stop/start above.

    const mountGlobe = () => {
      if (globe) return;
      const canvasWidth = canvas.offsetWidth;
      if (canvasWidth < 1) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const colors = isDarkRef.current ? DARK_COLORS : LIGHT_COLORS;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      globe = (createGlobe as any)(canvas, {
        devicePixelRatio: dpr,
        width: canvasWidth,
        height: canvasWidth,
        phi: phiRef.current,
        theta: THETA,
        dark: colors.dark,
        diffuse: colors.diffuse,
        mapSamples: MAP_SAMPLES,
        mapBrightness: colors.mapBrightness,
        mapBaseBrightness: colors.mapBaseBrightness,
        baseColor: colors.baseColor,
        markerColor: colors.markerColor,
        glowColor: colors.glowColor,
        scale: SCALE,
        offset: OFFSET,
        markers: DATA_CENTER_MARKERS.map((m) => ({
          id: m.id,
          location: m.location,
          size: MARKER_SIZE,
          color: colors.markerDotRgb,
        })),
        arcs: DATA_CENTER_ARCS,
        arcColor: colors.arcColor,
        arcWidth: ARC_WIDTH,
        arcHeight: ARC_HEIGHT,
        markerElevation: MARKER_ELEVATION,
      });

      globeRef.current = globe;

      // Marker labels via CSS anchor positioning.
      // canvas.parentElement is now COBE's wrapper div (COBE moved the canvas there).
      if (showLabelsRef.current) {
        const wrap = canvas.parentElement;
        if (wrap) {
          for (const m of DATA_CENTER_MARKERS) {
            const el = document.createElement("div");
            el.className = "cobe-marker-label";
            el.textContent = m.name;
            el.style.position = "absolute";
            el.style.setProperty("position-anchor", `--cobe-${m.id}`);
            el.style.setProperty("top", "anchor(bottom)");
            el.style.setProperty("left", "anchor(center)");
            el.style.translate = "-50% 4px";
            el.style.whiteSpace = "nowrap";
            el.style.pointerEvents = "none";
            el.style.setProperty("opacity", `var(--cobe-visible-${m.id}, 0)`);
            el.style.setProperty(
              "filter",
              `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 6px))`,
            );
            el.style.setProperty("transition", "opacity 0.3s, filter 0.3s");
            wrap.appendChild(el);
          }
        }
      }

      // Start the render loop, then reveal after two frames so the globe has
      // painted at least once before the opacity transition begins.
      animationId = requestAnimationFrame(tick);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsRevealed(true);
        });
      });
    };

    // Try immediately (canvas already has layout after first paint).
    mountGlobe();

    // Fallback: some layouts defer sizing (e.g. flex/grid children).
    const ro = new ResizeObserver(() => {
      if (!globe) mountGlobe();
    });
    ro.observe(container);

    // #1 – IntersectionObserver: stop the RAF when the globe scrolls off-screen.
    // #2 – Reset is intentionally skipped here — the globe's rotation angle is
    //       kept so it resumes exactly where it left off (no disorienting jump).
    const io = new IntersectionObserver(
      ([entry]) => {
        isInView = entry.isIntersecting;
        isInView ? maybeResume() : maybePause();
      },
      { threshold: 0.05 },
    );
    io.observe(container);

    // #5 – Tab Visibility API: pause when the user switches tabs.
    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      isTabVisible ? maybeResume() : maybePause();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      globe = null; // stop tick guard before anything else
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.remove();
      canvasRef.current = null;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      container
        .querySelectorAll(".cobe-marker-label")
        .forEach((el) => el.remove());
      globeRef.current?.destroy();
      globeRef.current = null;
    };
  }, []); // globe lives for the component lifetime; theme via isDarkRef

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Rotating WebGL globe with data center markers and arcs"
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        position: "relative",
        opacity: isRevealed ? 1 : 0,
        transition: "opacity 1s ease",
      }}
    />
  );
}
