"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { useTheme } from "@prisma-docs/ui/components/theme-provider";
import { COBE_MARKER_DOT_RGB, cobeGlobe, hexToRgb01, light } from "./tokens";
import { cn } from "@/lib/cn";

// ─── Region Data ──────────────────────────────────────────────────────────────

const REGIONS = {
  SF01: {
    location: [37.37, -121.92] as [number, number],
    city: "San Francisco",
  },
  IAD1: { location: [39.04, -77.49] as [number, number], city: "Washington" },
  FRA1: { location: [50.11, 8.68] as [number, number], city: "Frankfurt" },
  SIN1: { location: [1.35, 103.82] as [number, number], city: "Singapore" },
} as const;

type RegionKey = keyof typeof REGIONS;
const REGION_KEYS = Object.keys(REGIONS) as RegionKey[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function locationToAngles(lat: number, long: number): [number, number] {
  return [
    Math.PI - ((long * Math.PI) / 180 - Math.PI / 2),
    (lat * Math.PI) / 180,
  ];
}

/** Find the equivalent target phi closest to current to avoid long-way-around spins. */
function nearestPhi(target: number, current: number): number {
  const TWO_PI = Math.PI * 2;
  return target + Math.round((current - target) / TWO_PI) * TWO_PI;
}

function getArcs(focused: RegionKey) {
  return REGION_KEYS.filter((k) => k !== focused).map((k) => ({
    from: REGIONS[focused].location,
    to: REGIONS[k].location,
  }));
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAP_SAMPLES = 16000;
const MAP_BASE_BRIGHTNESS = 0.025;
const MARKER_SIZE = 0.025;
const MARKER_ELEVATION = 0;
const ARC_HEIGHT = 0.5;
const ARC_WIDTH = 0.4;
const EASE = 0.08;

// ─── Colors ───────────────────────────────────────────────────────────────────

const LIGHT_COLORS = {
  dark: -2 as number,
  diffuse: 0.6,
  mapBrightness: 12,
  mapBaseBrightness: MAP_BASE_BRIGHTNESS,
  baseColor: cobeGlobe(true).baseColor as [number, number, number],
  markerColor: cobeGlobe(true).markerColor as [number, number, number],
  glowColor: cobeGlobe(true).glowColor as [number, number, number],
  arcColor: cobeGlobe(true).arcColor as [number, number, number],
  markerDotRgb: COBE_MARKER_DOT_RGB(true),
};

const DARK_COLORS = {
  dark: 1 as number,
  diffuse: 0.6,
  mapBrightness: 12,
  mapBaseBrightness: MAP_BASE_BRIGHTNESS,
  baseColor: cobeGlobe(false).baseColor as [number, number, number],
  markerColor: cobeGlobe(false).markerColor as [number, number, number],
  glowColor: cobeGlobe(false).glowColor as [number, number, number],
  arcColor: cobeGlobe(false).arcColor as [number, number, number],
  markerDotRgb: COBE_MARKER_DOT_RGB(false),
};

// Start centred on SF01
const [INIT_PHI, INIT_THETA] = locationToAngles(...REGIONS.SF01.location);

// ─── Component ────────────────────────────────────────────────────────────────

export function NetworkGlobe() {
  const { resolvedTheme } = useTheme();
  const [isRevealed, setIsRevealed] = useState(false);
  const [focused, setFocused] = useState<RegionKey>("SF01");

  const isDarkRef = useRef(resolvedTheme === "dark");
  const containerRef = useRef<HTMLDivElement>(null);

  // Rendered angles — updated every frame by the easing loop.
  const phiRef = useRef(INIT_PHI);
  const thetaRef = useRef(INIT_THETA);

  // Target angles — written by button clicks, read by the RAF tick.
  const targetPhiRef = useRef(INIT_PHI);
  const targetThetaRef = useRef(INIT_THETA);

  // Arcs for the currently-focused region — written by button clicks.
  const arcsRef = useRef(getArcs("SF01"));

  const state = { label: "Live", color: "ppg" };

  useEffect(() => {
    isDarkRef.current = resolvedTheme === "dark";
  }, [resolvedTheme]);

  const handleFocus = useCallback((key: RegionKey) => {
    setFocused(key);
    arcsRef.current = getArcs(key);
    const [rawPhi, rawTheta] = locationToAngles(...REGIONS[key].location);
    // Snap to the nearest equivalent angle so the globe takes the short path.
    targetPhiRef.current = nearestPhi(rawPhi, phiRef.current);
    targetThetaRef.current = rawTheta;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Canvas is created imperatively — keeps it out of React's reconciler and
    // safe from COBE v2's own canvas-wrapping behaviour.
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    container.appendChild(canvas);

    let animationId = 0;
    let globe: ReturnType<typeof createGlobe> | null = null;

    const tick = () => {
      if (!globe) return;
      const colors = isDarkRef.current ? DARK_COLORS : LIGHT_COLORS;

      // Ease phi and theta toward their targets each frame.
      phiRef.current += (targetPhiRef.current - phiRef.current) * EASE;
      thetaRef.current += (targetThetaRef.current - thetaRef.current) * EASE;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globe as any).update({
        phi: phiRef.current,
        theta: thetaRef.current,
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
        // Arcs are updated here each frame so switching regions is instant.
        arcs: arcsRef.current,
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
        phi: INIT_PHI,
        theta: INIT_THETA,
        dark: colors.dark,
        diffuse: colors.diffuse,
        mapSamples: MAP_SAMPLES,
        mapBrightness: colors.mapBrightness,
        mapBaseBrightness: colors.mapBaseBrightness,
        baseColor: colors.baseColor,
        markerColor: colors.markerColor,
        glowColor: colors.glowColor,
        scale: 1,
        offset: [0, 0],
        markers: REGION_KEYS.map((key) => ({
          id: key.toLowerCase(),
          location: REGIONS[key].location,
          size: MARKER_SIZE,
          color: colors.markerDotRgb,
        })),
        arcs: arcsRef.current,
        arcColor: colors.arcColor,
        arcWidth: ARC_WIDTH,
        arcHeight: ARC_HEIGHT,
        markerElevation: MARKER_ELEVATION,
      });

      animationId = requestAnimationFrame(tick);
      // Reveal after two frames so the globe has painted before fading in.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setIsRevealed(true)),
      );
    };

    mountGlobe();

    const ro = new ResizeObserver(() => {
      if (!globe) mountGlobe();
    });
    ro.observe(container);

    return () => {
      const g = globe;
      globe = null;
      cancelAnimationFrame(animationId);
      canvas.remove();
      ro.disconnect();
      g?.destroy();
    };
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-stroke-neutral bg-background-default">
      <div className="header uppercase font-mono text-foreground-neutral-weaker text-xs p-4 flex justify-between border-b border-stroke-neutral">
        <span>Global Data Plane · {REGION_KEYS.length} regions · 43 pops</span>
        <div className="flex gap-2 text-foreground-ppg">
          <span
            className={cn(
              `bg-foreground-${state.color} before:bg-foreground-${state.color}`,
              "h-3.5 w-3.5 block rounded-full relative",
              "before:content-'' before:absolute before:inset-0 rounded-full blur-xs pulse",
            )}
          ></span>
          <span>{state.label}</span>
        </div>
      </div>
      {/* Globe canvas */}
      <div
        ref={containerRef}
        role="img"
        aria-label="Interactive globe showing Prisma Compute data center locations"
        style={{
          width: "100%",
          maxWidth: `400px`,
          margin: `0 auto`,
          aspectRatio: "1 / 1",
          position: "relative",
          opacity: isRevealed ? 1 : 0,
          transition: "opacity 1s ease",
        }}
      />

      {/* Region selector */}
      <div className="grid grid-cols-4 border-t border-white/10">
        {REGION_KEYS.map((key, i) => {
          const active = focused === key;
          return (
            <button
              key={key}
              onClick={() => handleFocus(key)}
              className={cn(
                "group flex items-center gap-2 px-3 py-4 text-left",
                "cursor-pointer transition-colors duration-150 bg-background-neutral",
                i < REGION_KEYS.length - 1
                  ? "border-r border-stroke-neutral"
                  : "",
                active
                  ? "bg-background-neutral-weak"
                  : "hover:bg-background-neutral-weak",
              )}
            >
              <i
                className={cn(
                  "fa-regular relative fa-location-dot text-md transition-all duration-150",
                  active
                    ? "text-foreground-ppg-strong"
                    : "text-foreground-neutral-weaker group-hover:text-foreground-ppg group-hover:-translate-y-1",
                )}
              />
              <div className="flex flex-col gap-1">
                <span
                  className={cn(
                    "font-mono text-xs transition-colors duration-150",
                    active
                      ? "text-foreground-ppg-strong"
                      : "text-foreground-neutral-weak group-hover:text-foreground-ppg",
                  )}
                >
                  {key}
                </span>
                <span className="text-xs leading-none text-foreground-neutral">
                  {REGIONS[key].city}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
