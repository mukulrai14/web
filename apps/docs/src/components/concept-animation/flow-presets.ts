import type { ConceptName } from "./presets";

/**
 * A flow scene is a fixed box-and-arrow diagram drawn in a viewBox. Every node
 * and edge is laid out once; each step only chooses which of them are visible
 * and which are emphasized. Because the SVG keeps the same viewBox across
 * steps, the diagram scales with its container and never shifts the layout as
 * a reader steps through it.
 *
 * Coordinates are in viewBox units (roughly pixels at full width).
 */

/** Color role for a box. Mapped to theme-aware classes in flow.tsx. */
export type FlowVariant =
  | "project"
  | "branch"
  | "vars"
  | "infra"
  | "source"
  | "scope"
  | "neutral"
  | "production"
  | "resolved";

/** Where a resolved variable came from. Drives the colored bar on each row. */
export type RowOrigin = "production" | "preview" | "override";

/** One key=value line inside a node, color-coded by where the value came from. */
export interface FlowRow {
  key: string;
  value: string;
  origin: RowOrigin;
}

/** A small labelled pill rendered inside an `infra` node. */
export interface FlowChip {
  label: string;
  variant: FlowVariant;
}

export interface FlowNode {
  id: string;
  label: string;
  /** Smaller secondary line under the label. */
  sub?: string;
  /** Tint the sub line to a scope color (used by the resolved branch boxes). */
  subOrigin?: RowOrigin;
  variant: FlowVariant;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Chips laid out in a row inside the box (used for the infrastructure box). */
  chips?: FlowChip[];
  /** Variable rows rendered inside the box. */
  rows?: FlowRow[];
  /** Row slots to reserve, so per-step row changes never resize the box. */
  maxRows?: number;
}

export type Side = "l" | "r" | "t" | "b";

export interface FlowEdge {
  id: string;
  from: string;
  fromSide: Side;
  to: string;
  toSide: Side;
  /** Nudge the start/end anchor along the box edge, to fan out parallel edges. */
  fromDy?: number;
  toDy?: number;
  /** Dashed lines read as "applies to" / "wires into" rather than "contains". */
  dashed?: boolean;
  /** Optional label drawn on the edge. */
  label?: string;
}

export interface FlowStep {
  title: string;
  caption: string;
  /** Node ids visible in this step. */
  nodes: string[];
  /** Edge ids visible in this step. */
  edges: string[];
  /** Node ids drawn brighter, to pull the eye to what changed. */
  emphasize?: string[];
  /** Replace a node's rows for this step (used to compose the resolved set). */
  rowOverrides?: Record<string, FlowRow[]>;
}

export interface FlowScene {
  label: string;
  /** viewBox width / height. */
  width: number;
  height: number;
  /** Column captions, e.g. "Branch", "Infrastructure". */
  groupLabels?: { text: string; x: number; y: number }[];
  /** Color key for row origins, drawn along the bottom. */
  legend?: { origin: RowOrigin; label: string }[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  steps: FlowStep[];
}

// Shared three-row band used by the model scene.
const ROW = [30, 116, 202];
const BOX_H = 64;

const computeModel: FlowScene = {
  label: "How Compute organizes resources and isolates branches",
  width: 656,
  height: 286,
  groupLabels: [
    { text: "Branch", x: 200, y: 18 },
    { text: "Infrastructure", x: 404, y: 18 },
  ],
  nodes: [
    { id: "project", label: "Project", sub: "my-app", variant: "project", x: 16, y: 116, w: 92, h: 64 },

    { id: "b-main", label: "main", sub: "default · production", variant: "branch", x: 200, y: ROW[0], w: 160, h: BOX_H },
    { id: "b-feature", label: "feature/new-feature", sub: "preview", variant: "branch", x: 200, y: ROW[1], w: 160, h: BOX_H },
    { id: "b-bug", label: "bug/fix-issue", sub: "preview", variant: "branch", x: 200, y: ROW[2], w: 160, h: BOX_H },

    {
      id: "i-main",
      label: "",
      variant: "infra",
      x: 404,
      y: ROW[0],
      w: 236,
      h: BOX_H,
      chips: [
        { label: "Variables", variant: "vars" },
        { label: "App", variant: "scope" },
        { label: "DB", variant: "scope" },
      ],
    },
    {
      id: "i-feature",
      label: "",
      variant: "infra",
      x: 404,
      y: ROW[1],
      w: 236,
      h: BOX_H,
      chips: [
        { label: "Variables", variant: "vars" },
        { label: "App", variant: "scope" },
        { label: "DB", variant: "scope" },
      ],
    },
    {
      id: "i-bug",
      label: "",
      variant: "infra",
      x: 404,
      y: ROW[2],
      w: 236,
      h: BOX_H,
      chips: [
        { label: "Variables", variant: "vars" },
        { label: "App", variant: "scope" },
        { label: "DB", variant: "scope" },
      ],
    },
  ],
  edges: [
    { id: "e-main", from: "project", fromSide: "r", to: "b-main", toSide: "l" },
    { id: "e-feature", from: "project", fromSide: "r", to: "b-feature", toSide: "l" },
    { id: "e-bug", from: "project", fromSide: "r", to: "b-bug", toSide: "l" },
    { id: "c-main", from: "b-main", fromSide: "r", to: "i-main", toSide: "l" },
    { id: "c-feature", from: "b-feature", fromSide: "r", to: "i-feature", toSide: "l" },
    { id: "c-bug", from: "b-bug", fromSide: "r", to: "i-bug", toSide: "l" },
  ],
  steps: [
    {
      title: "1. First deploy",
      caption:
        "Your first deploy creates the project, its default production branch, and the infrastructure that runs it: environment variables, an app, and a database.",
      nodes: ["project", "b-main", "i-main"],
      edges: ["e-main", "c-main"],
      emphasize: ["b-main", "i-main"],
    },
    {
      title: "2. Branch off",
      caption:
        "Deploy a new branch name and Compute provisions a full, isolated copy of that infrastructure. The new preview branch gets its own app, database, and variables, and production keeps running untouched.",
      nodes: ["project", "b-main", "i-main", "b-feature", "i-feature"],
      edges: ["e-main", "c-main", "e-feature", "c-feature"],
      emphasize: ["b-feature", "i-feature"],
    },
    {
      title: "3. Many branches",
      caption:
        "Every branch is its own environment under one project, so you and your agents can run features and fixes in parallel without them colliding.",
      nodes: ["project", "b-main", "i-main", "b-feature", "i-feature", "b-bug", "i-bug"],
      edges: ["e-main", "c-main", "e-feature", "c-feature", "e-bug", "c-bug"],
      emphasize: ["b-bug", "i-bug"],
    },
  ],
};

// Resolved-set rows reused across env steps, so the composition is explicit:
// each row carries the scope it resolved from.
const PROD_DB: FlowRow = { key: "DATABASE_URL", value: "…/prod", origin: "production" };
const PREVIEW_DB: FlowRow = { key: "DATABASE_URL", value: "…/preview", origin: "preview" };
const PREVIEW_STRIPE: FlowRow = { key: "STRIPE_KEY", value: "sk_test_…", origin: "preview" };
const OVERRIDE_DB: FlowRow = { key: "DATABASE_URL", value: "…/branch-db", origin: "override" };
const OVERRIDE_FLAG: FlowRow = { key: "FEATURE_FLAG", value: "on", origin: "override" };

const envLayers: FlowScene = {
  label: "How a deploy composes its environment variables",
  width: 720,
  height: 388,
  groupLabels: [
    { text: "What you set, by scope", x: 16, y: 26 },
    { text: "What a deploy resolves to", x: 430, y: 26 },
  ],
  legend: [
    { origin: "production", label: "from production" },
    { origin: "preview", label: "from preview" },
    { origin: "override", label: "from branch override" },
  ],
  nodes: [
    // Left: the scopes you write to.
    {
      id: "s-prod",
      label: "Production",
      sub: "--role production",
      variant: "production",
      x: 16,
      y: 46,
      w: 212,
      h: 64,
      rows: [PROD_DB],
    },
    {
      id: "s-preview",
      label: "Preview",
      sub: "--role preview",
      variant: "source",
      x: 16,
      y: 140,
      w: 212,
      h: 88,
      rows: [PREVIEW_DB, PREVIEW_STRIPE],
    },
    {
      id: "s-override",
      label: "Branch override",
      sub: "--branch feature/search",
      variant: "branch",
      x: 16,
      y: 258,
      w: 212,
      h: 88,
      rows: [OVERRIDE_DB, OVERRIDE_FLAG],
    },

    // Right: the set each branch actually deploys with.
    {
      id: "r-main",
      label: "main",
      sub: "production deploy",
      subOrigin: "production",
      variant: "resolved",
      x: 430,
      y: 46,
      w: 274,
      h: 64,
      rows: [PROD_DB],
      maxRows: 1,
    },
    {
      id: "r-feature",
      label: "feature/search",
      sub: "preview deploy",
      subOrigin: "preview",
      variant: "resolved",
      x: 430,
      y: 176,
      w: 274,
      h: 116,
      rows: [OVERRIDE_DB, PREVIEW_STRIPE, OVERRIDE_FLAG],
      maxRows: 3,
    },
  ],
  edges: [
    { id: "d-prod", from: "s-prod", fromSide: "r", to: "r-main", toSide: "l", dashed: true },
    { id: "d-preview", from: "s-preview", fromSide: "r", to: "r-feature", toSide: "l", dashed: true, toDy: -24 },
    { id: "d-override", from: "s-override", fromSide: "r", to: "r-feature", toSide: "l", dashed: true, toDy: 24 },
  ],
  steps: [
    {
      title: "1. Production",
      caption:
        "Your default branch deploys as production, and resolves to the production variables only. Nothing else is mixed in.",
      nodes: ["s-prod", "r-main"],
      edges: ["d-prod"],
      emphasize: ["s-prod", "r-main"],
    },
    {
      title: "2. Preview inherits",
      caption:
        "Here's the part that looks like magic: every preview branch automatically inherits the shared preview set. You don't configure feature/search, it just resolves to preview. Production variables are never included.",
      nodes: ["s-prod", "r-main", "s-preview", "r-feature"],
      edges: ["d-prod", "d-preview"],
      emphasize: ["s-preview", "r-feature"],
      rowOverrides: { "r-feature": [PREVIEW_DB, PREVIEW_STRIPE] },
    },
    {
      title: "3. Override layers on top",
      caption:
        "A branch override composes key by key on top of the inherited set: it replaces DATABASE_URL and adds FEATURE_FLAG for this one branch, while STRIPE_KEY still flows through from preview.",
      nodes: ["s-prod", "r-main", "s-preview", "r-feature", "s-override"],
      edges: ["d-prod", "d-preview", "d-override"],
      emphasize: ["s-override", "r-feature"],
    },
  ],
};

const githubConnection: FlowScene = {
  label: "How a GitHub connection deploys on push",
  width: 648,
  height: 220,
  nodes: [
    { id: "repo", label: "GitHub", sub: "acme/shop", variant: "neutral", x: 20, y: 78, w: 150, h: 64 },
    { id: "project", label: "Project", sub: "my-app", variant: "project", x: 245, y: 78, w: 150, h: 64 },
    { id: "d-feature", label: "Preview deploy", sub: "feature/login", variant: "scope", x: 468, y: 24, w: 160, h: 56 },
    { id: "d-main", label: "Production deploy", sub: "main", variant: "scope", x: 468, y: 140, w: 160, h: 56 },
  ],
  edges: [
    { id: "connect", from: "repo", fromSide: "r", to: "project", toSide: "l", label: "git connect" },
    { id: "push-f", from: "project", fromSide: "r", to: "d-feature", toSide: "l", dashed: true, label: "push" },
    { id: "push-m", from: "project", fromSide: "r", to: "d-main", toSide: "l", dashed: true, label: "merge" },
  ],
  steps: [
    {
      title: "1. Connect the repo",
      caption:
        "Run git connect once to link a project to a GitHub repository. After that you stop deploying by hand.",
      nodes: ["repo", "project"],
      edges: ["connect"],
      emphasize: ["repo", "project"],
    },
    {
      title: "2. Push a branch",
      caption:
        "Push any branch and Compute builds that commit and deploys a matching preview, so feature/login gets its own URL automatically.",
      nodes: ["repo", "project", "d-feature"],
      edges: ["connect", "push-f"],
      emphasize: ["d-feature"],
    },
    {
      title: "3. Merge to main",
      caption:
        "Merge to your default branch and the same flow deploys to production. Nothing about the process changes.",
      nodes: ["repo", "project", "d-feature", "d-main"],
      edges: ["connect", "push-f", "push-m"],
      emphasize: ["d-main"],
    },
  ],
};

/**
 * Names that render as visual flow diagrams. Any name not listed here falls
 * back to the Code Hike token animation in presets.ts.
 */
export const FLOW_SCENES = {
  "compute-model": computeModel,
  "env-layers": envLayers,
  "github-connection": githubConnection,
} satisfies Partial<Record<ConceptName, FlowScene>>;
