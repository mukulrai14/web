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
const AUTO_ROTATE_SPEED = 0.003;

// ─── Theme presets ─────────────────────────────────────────────────────────────

const LIGHT_COLORS = {
  dark: 0,
  diffuse: 1,
  mapBrightness: 6,
  mapBaseBrightness: MAP_BASE_BRIGHTNESS,
  baseColor: hexToRgb01(light.colorForegroundNeutralWeak) as [
    number,
    number,
    number,
  ],
  markerColor: hexToRgb01(light.colorForegroundPpg) as [number, number, number],
  glowColor: hexToRgb01(light.colorBackgroundDefault) as [
    number,
    number,
    number,
  ],
  arcColor: hexToRgb01(light.colorForegroundPpg) as [number, number, number],
  markerDotRgb: hexToRgb01(light.colorForegroundPpg) as [
    number,
    number,
    number,
  ],
};

const DARK_COLORS = {
  dark: 1,
  diffuse: 0.6,
  mapBrightness: 12,
  mapBaseBrightness: MAP_BASE_BRIGHTNESS,
  baseColor: cobeGlobe.baseColor as [number, number, number],
  markerColor: cobeGlobe.markerColor as [number, number, number],
  glowColor: cobeGlobe.glowColor as [number, number, number],
  arcColor: cobeGlobe.arcColor as [number, number, number],
  markerDotRgb: COBE_MARKER_DOT_RGB,
};

export function CobeGlobe({ showLabels = true }: { showLabels?: boolean }) {
  const { resolvedTheme } = useTheme();

  // Starts hidden; set to true after the globe renders its first frame.
  // Resets to false automatically on unmount — React StrictMode safe.
  const [isRevealed, setIsRevealed] = useState(false);

  const showLabelsRef = useRef(showLabels);
  useEffect(() => {
    showLabelsRef.current = showLabels;
  }, [showLabels]);

  // Store theme in a ref so the RAF tick closure always reads the latest value
  // without needing to be recreated. Theme changes take effect on the next frame.
  const isDarkRef = useRef(resolvedTheme === "dark");
  useEffect(() => {
    isDarkRef.current = resolvedTheme === "dark";
  }, [resolvedTheme]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiRef = useRef(0);
  const thetaOffsetRef = useRef(0);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (pointerInteracting.current !== null) {
      const deltaX = e.clientX - pointerInteracting.current.x;
      const deltaY = e.clientY - pointerInteracting.current.y;
      dragOffset.current = { phi: deltaX / 150, theta: deltaY / 300 };
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationId = 0;
    let globe: ReturnType<typeof createGlobe> | null = null;

    // Only push time-varying values every frame; static config (mapSamples,
    // scale, markers, arcs) is set once at creation time.
    const tick = () => {
      if (!globe) return;
      const colors = isDarkRef.current ? DARK_COLORS : LIGHT_COLORS;
      phiRef.current += AUTO_ROTATE_SPEED;
      globe.update({
        phi: PHI + phiRef.current + dragOffset.current.phi,
        theta: THETA + thetaOffsetRef.current + dragOffset.current.theta,
        width: canvas.offsetWidth,
        height: canvas.offsetWidth,
        // Push current theme colors every frame — this is how cobe v2 handles
        // live theme updates without recreating the globe.
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

      // Inject marker labels using CSS anchor positioning.
      if (showLabelsRef.current) {
        const wrap = canvas.parentElement;
        if (wrap) {
          for (const m of DATA_CENTER_MARKERS) {
            const nameEl = document.createElement("div");
            nameEl.className = "cobe-marker-label";
            nameEl.textContent = m.name;
            // Pins the label to the anchor div that cobe creates inside the wrapper.
            nameEl.style.position = "absolute";
            nameEl.style.setProperty("position-anchor", `--cobe-${m.id}`);
            nameEl.style.setProperty("top", "anchor(bottom)");
            nameEl.style.setProperty("left", "anchor(center)");
            nameEl.style.translate = "-50% 4px";
            nameEl.style.whiteSpace = "nowrap";
            nameEl.style.pointerEvents = "none";
            nameEl.style.setProperty(
              "opacity",
              `var(--cobe-visible-${m.id}, 0)`,
            );
            nameEl.style.setProperty(
              "filter",
              `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 6px))`,
            );
            nameEl.style.setProperty("transition", "opacity 0.3s, filter 0.3s");
            wrap.appendChild(nameEl);
          }
        }
      }

      // Kick off the render loop, then use a double-rAF to reveal the globe
      // only after it has painted at least one real frame — this guarantees a
      // smooth 0→1 opacity transition with no blank-canvas flash.
      animationId = requestAnimationFrame(tick);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsRevealed(true);
        });
      });
    };

    // Mount immediately if the canvas already has layout dimensions (the common
    // case). The ResizeObserver below acts as a fallback for deferred layouts.
    mountGlobe();

    const ro = new ResizeObserver(() => {
      if (!globe) mountGlobe();
    });
    ro.observe(canvas.parentElement ?? canvas);

    return () => {
      // Null out first so the in-flight tick sees no globe and bails immediately.
      globe = null;
      cancelAnimationFrame(animationId);
      ro.disconnect();
      canvas.parentElement
        ?.querySelectorAll(".cobe-marker-label")
        .forEach((el) => el.remove());
      globeRef.current?.destroy();
      globeRef.current = null;
    };
  }, []); // globe lives for the component lifetime; theme handled via isDarkRef

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        position: "relative",
        opacity: isRevealed ? 1 : 0,
        transition: "opacity 1s ease",
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.style.cursor = "grabbing";
        }}
        style={{ width: "100%", height: "100%", display: "block" }}
        role="img"
        aria-label="Rotating WebGL globe with data center markers and arcs"
      />
    </div>
  );
}
