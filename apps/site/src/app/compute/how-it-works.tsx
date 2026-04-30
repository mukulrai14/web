"use client";

import { useEffect, useRef, useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Action,
  Separator,
  ChartContainer,
  type ChartConfig,
} from "@prisma/eclipse";
import { BarChart, Bar, YAxis } from "recharts";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// StatefulExecutionCard
// ---------------------------------------------------------------------------

const TRAFFIC_DATA = [
  { v: 65 },
  { v: 45 },
  { v: 25 },
  { v: 55 },
  { v: 75 },
  { v: 40 },
  { v: 80 },
  { v: 65 },
  { v: 90 },
  { v: 50 },
  { v: 35 },
  { v: 55 },
  { v: 45 },
  { v: 25 },
  { v: 70 },
  { v: 60 },
  { v: 50 },
  { v: 85 },
  { v: 40 },
  { v: 65 },
  { v: 95 },
  { v: 75 },
  { v: 50 },
  { v: 60 },
  { v: 45 },
  { v: 80 },
  { v: 35 },
  { v: 90 },
  { v: 55 },
  { v: 70 },
];

const CHART_CONFIG: ChartConfig = { v: { color: "#2DD4BF" } };
const BASE_UPTIME_SECS = 6 * 86400 + 14 * 3600 + 22 * 60 + 2;

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 font-mono text-xs">
      <span className="text-foreground-neutral-weak">{label}</span>
      <span className="text-foreground-ppg-reverse-weak">{value}</span>
    </div>
  );
}

export function StatefulExecutionCard() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  const t = BASE_UPTIME_SECS + elapsed;
  const uptime = `UP ${Math.floor(t / 86400)}d ${Math.floor((t % 86400) / 3600)}h ${Math.floor((t % 3600) / 60)}m ${String(t % 60).padStart(2, "0")}s`;

  return (
    <div className="rounded-xl border border-stroke-neutral bg-background-neutral-weak overflow-hidden w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-2 font-mono text-2xs">
          <div className="w-2 h-2 rounded-full bg-foreground-ppg-reverse-weak animate-pulse shrink-0" />
          <span className="text-foreground-neutral">api.ts</span>
          <span className="text-foreground-neutral">·</span>
          <span className="text-foreground-neutral">process #4f2a</span>
        </div>
        <span className="font-mono text-2xs text-foreground-neutral-weaker tabular-nums">
          {uptime}
        </span>
      </div>

      {/* Traffic chart */}
      <div className="px-6">
        <ChartContainer
          config={CHART_CONFIG}
          className="h-32 w-full aspect-auto"
        >
          <BarChart
            data={TRAFFIC_DATA}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
            barCategoryGap="25%"
          >
            <YAxis domain={[0, 100]} hide />
            <Bar
              dataKey="v"
              fill="var(--color-v)"
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Metrics */}
      <div className="px-6 pb-8 pt-4 mt-1">
        <Separator />
        <MetricRow label="websocket connections" value="1,289 open" />
        <Separator />
        <MetricRow label="in-process cache" value="hot · 42 MB" />
        <Separator />
        <MetricRow label="last cold start" value="never" />
        <Separator />
        <MetricRow label="p95 latency" value="42ms" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeployTerminal — types & data
// ---------------------------------------------------------------------------

type TerminalLine =
  | { type: "command"; cmd: string }
  | { type: "step"; prefix: "├" | "└"; label: string; detail: string }
  | { type: "success"; text: string }
  | { type: "service"; name: string; value: string; isLink: boolean };

const LINES: TerminalLine[] = [
  { type: "command", cmd: "prisma deploy" },
  { type: "step", prefix: "├", label: "Detecting services", detail: "3 found" },
  {
    type: "step",
    prefix: "├",
    label: "Provisioning Postgres",
    detail: "iad1 · 12ms",
  },
  { type: "step", prefix: "├", label: "Building bun bundle", detail: "1.3 MB" },
  { type: "step", prefix: "├", label: "Uploading artifacts", detail: "" },
  { type: "step", prefix: "└", label: "Rolling out", detail: "3 replicas" },
  { type: "success", text: "Live in 4.2s" },
  {
    type: "service",
    name: "api",
    value: "https://api-h8e2.prisma.run",
    isLink: true,
  },
  {
    type: "service",
    name: "agent",
    value: "https://agent-h8e2.prisma.run",
    isLink: true,
  },
  {
    type: "service",
    name: "worker",
    value: "every 5 min · next at 14:35 UTC",
    isLink: false,
  },
];

// ms after mount each line appears
const DELAYS = [300, 750, 1200, 1750, 2250, 2800, 3500, 3800, 4100, 4400];
const LOOP_PAUSE = 6000; // ms after last line before restart

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Mounts invisible, then transitions to visible on next frame */
function AnimatedLine({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className="transition-all duration-300 ease-out text-2xs"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
      }}
    >
      {children}
    </div>
  );
}

function BlinkingCursor() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 530);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="w-1.5 h-3.5 bg-foreground-ppg"
      style={{ opacity: on ? 1 : 0, transition: "none" }}
    />
  );
}

function renderLine(line: TerminalLine) {
  switch (line.type) {
    case "command":
      return (
        <div className="flex items-baseline gap-2">
          <span className="text-foreground-ppg select-none">$</span>
          <span className="text-foreground-neutral">{line.cmd}</span>
        </div>
      );
    case "step":
      return (
        <div className="flex items-baseline">
          <span className="text-gray-600 w-4 shrink-0 select-none">
            {line.prefix}
          </span>
          <span className="flex-1">
            <span className="text-foreground-neutral">{line.label}</span>
            {line.detail && (
              <span className="text-gray-500"> {line.detail}</span>
            )}
          </span>
          <span className="text-foreground-ppg text-xs ml-6 shrink-0">
            done
          </span>
        </div>
      );
    case "success":
      return (
        <div className="flex items-baseline gap-2">
          <span className="text-foreground-ppg select-none">✓</span>
          <span className="text-foreground-neutral font-medium">
            {line.text}
          </span>
        </div>
      );
    case "service":
      return (
        <div className="flex items-baseline gap-3 pl-4">
          <span className="text-foreground-neutral w-10 shrink-0">
            {line.name}
          </span>
          {line.isLink ? (
            <span className="text-foreground-ppg underline underline-offset-2">
              {line.value}
            </span>
          ) : (
            <span className="text-gray-500">{line.value}</span>
          )}
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// DeployTerminal
// ---------------------------------------------------------------------------

export function DeployTerminal() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    function schedule() {
      // Clear any pending timeouts from previous run
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];

      setVisibleCount(0);

      DELAYS.forEach((delay, i) => {
        timeoutsRef.current.push(
          setTimeout(() => setVisibleCount(i + 1), delay),
        );
      });

      // Loop: reset then restart
      const loopAt = DELAYS[DELAYS.length - 1] + LOOP_PAUSE;
      timeoutsRef.current.push(setTimeout(schedule, loopAt));
    }

    schedule();
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  function handleCopy() {
    void navigator.clipboard.writeText("prisma deploy");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full rounded-xl border border-stroke-neutral overflow-hidden bg-background-default font-mono leading-6 select-text">
      {/* ── Tab bar ── */}
      <div className="flex items-stretch border-b border-stroke-neutral bg-background-neutral-weak">
        {/* Active tab */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background-default text-foreground-neutral">
          <i className="fa-regular fa-terminal text-foreground-ppg text-[11px]" />
          <span className="text-[10px]">~/my-app</span>
        </div>
        {/* Spacer */}
        <div className="flex-1" />
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="px-3 text-foreground-neutral-weak hover:text-foreground-neutral transition-colors"
          aria-label="Copy command"
        >
          {copied ? (
            <i className="fa-regular fa-check text-foreground-ppg-strong text-sm" />
          ) : (
            <i className="fa-regular fa-copy text-sm" />
          )}
        </button>
      </div>

      {/* ── Content ── */}
      <div className="p-5 space-y-1 min-h-70">
        {LINES.slice(0, visibleCount).map((line, i) => (
          <AnimatedLine key={i}>{renderLine(line)}</AnimatedLine>
        ))}
        <div className="pt-0.5">
          <BlinkingCursor />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const TABS = [
  {
    value: "deploy",
    label: "Deploy",
    icon: "fa-regular fa-rocket",
    title: "Push code, it runs",
    description: (
      <>
        Connect a repo and run{" "}
        <code className="font-mono text-foreground-ppg">prisma deploy</code>.{" "}
        Prisma Compute builds your application, discovers your services, and
        brings them live with URLs attached.
        <br />
        <br />
        No build pipeline to configure. No deployment scripts to maintain. No
        dashboard state that drifts from what&apos;s in your repo.
      </>
    ),
  },
  {
    value: "config",
    label: "Config",
    icon: "fa-regular fa-file-binary",
    title: "Zero config, total control.",
    description: (
      <>
        A single{" "}
        <code className="font-mono text-foreground-ppg">prisma.config.ts</code>{" "}
        file. Define services, environment, and routing in TypeScript — no YAML,
        no platform-specific DSL, no hidden defaults to fight.
        <br />
        <br />
        What&apos;s in the file is what runs. No surprises.
      </>
    ),
  },
  {
    value: "runtime",
    label: "Runtime",
    icon: "fa-regular fa-microchip",
    title: "Long-lived by default.",
    description: (
      <>
        Standard TypeScript on Bun. No cold starts, no execution timeouts, no
        connection limits. In-process caches, open sockets, and streaming
        responses work exactly as you&apos;d expect.
        <br />
        <br />
        Because your code never stops running, neither do your connections.
      </>
    ),
  },
  {
    value: "co-located",
    label: "Co-Located",
    icon: "fa-regular fa-database",
    title: "Database right next to your code.",
    description: (
      <>
        Compute and Prisma Postgres run in the same region, connected
        automatically. No connection strings to copy, no networking to
        configure, built-in connection pooling for long-lived processes.
        <br />
        <br />
        Works with any database — no lock-in.
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HowItWorks() {
  return (
    <div className="w-full rounded-xl border border-stroke-neutral overflow-hidden">
      <Tabs
        defaultValue="deploy"
        className="my-0 overflow-visible flex flex-col"
      >
        {/* Tab list */}
        <TabsList
          className={cn(
            "gap-px p-0 rounded-none w-full overflow-hidden",
            "bg-stroke-neutral", // 1px gap colour between tabs
          )}
        >
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                // Reset Eclipse defaults & build panel style
                "group flex items-center justify-left",
                "sm:flex-1 flex-row gap-2",
                "px-2! py-3! sm:px-4 sm:py-3 h-auto rounded-none",
                // Backgrounds
                "bg-background-neutral-weaker data-[state=active]:bg-background-neutral-weak",
                // Border — bottom acts as active indicator
                "border-b border-stroke-neutral",
                "data-[state=active]:border-foreground-ppg data-[state=active]:max-sm:w-full",
                // Text colour handled per child
                "transition-all duration-150",
                // Mobile inactive: shrink to icon-only width
                "data-[state=inactive]:max-sm:shrink-0",
              )}
            >
              <Action
                color="ppg"
                size="lg"
                className="shrink-0 pointer-events-none"
              >
                <i className={cn(tab.icon, "text-xs")} />
              </Action>

              {/* Label: always visible on sm+; only when active on mobile */}
              <span
                className={cn(
                  "font-sans-display font-bold text-xl leading-tight text-center",
                  "text-foreground-neutral-weak group-data-[state=active]:text-foreground-neutral",
                  // Hide on mobile unless active
                  "hidden group-data-[state=active]:inline sm:inline",
                )}
              >
                {tab.label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab content */}
        {TABS.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="m-0 mt-0 data-[state=inactive]:hidden"
          >
            <div className="flex flex-col lg:flex-row min-h-64">
              {/* Description pane */}
              <div className="bg-background-neutral-weaker flex-1">
                <div className="p-6 flex flex-col gap-4">
                  <h3 className="font-sans-display font-black text-2xl text-foreground-neutral m-0 leading-8">
                    {tab.title}
                  </h3>
                  <p className="text-sm text-foreground-neutral leading-relaxed m-0 text-pretty">
                    {tab.description}
                  </p>
                </div>
              </div>

              {/* Visual pane — placeholder for code block / screenshot */}
              <div
                className={cn(
                  "flex-3 flex items-start justify-center",
                  "bg-background-default min-h-48 lg:min-h-0",
                  "border-t border-stroke-neutral lg:border-t-0 lg:border-l",
                )}
              ></div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
