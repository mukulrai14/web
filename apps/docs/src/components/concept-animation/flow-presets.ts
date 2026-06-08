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
export type FlowVariant = "project" | "branch" | "vars" | "infra" | "source" | "scope" | "neutral";

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
  variant: FlowVariant;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Chips laid out in a row inside the box (used for the infrastructure box). */
  chips?: FlowChip[];
}

export type Side = "l" | "r" | "t" | "b";

export interface FlowEdge {
  id: string;
  from: string;
  fromSide: Side;
  to: string;
  toSide: Side;
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
}

export interface FlowScene {
  label: string;
  /** viewBox width / height. */
  width: number;
  height: number;
  /** Column captions, e.g. "Branch", "Infrastructure". */
  groupLabels?: { text: string; x: number; y: number }[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  steps: FlowStep[];
}

// Shared three-row band used by the model and env scenes.
const ROW = [30, 116, 202];
const BOX_H = 64;
const center = (y: number) => y + BOX_H / 2;

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

const envLayers: FlowScene = {
  label: "How environment variables resolve per branch",
  width: 648,
  height: 286,
  groupLabels: [
    { text: "Branch", x: 16, y: 18 },
    { text: "Variables", x: 210, y: 18 },
    { text: "Scope", x: 470, y: 18 },
  ],
  nodes: [
    { id: "b-main", label: "main", sub: "production", variant: "branch", x: 16, y: ROW[0], w: 150, h: BOX_H },
    { id: "b-feature", label: "feature/search", sub: "preview", variant: "branch", x: 16, y: ROW[1], w: 150, h: BOX_H },
    { id: "b-bug", label: "bug/fix-issue", sub: "preview", variant: "branch", x: 16, y: ROW[2], w: 150, h: BOX_H },

    { id: "v-main", label: "Variables", sub: "DATABASE_URL", variant: "vars", x: 210, y: ROW[0], w: 150, h: BOX_H },
    { id: "v-feature", label: "Variables", sub: "DATABASE_URL", variant: "vars", x: 210, y: ROW[1], w: 150, h: BOX_H },
    { id: "v-bug", label: "Variables", sub: "DATABASE_URL", variant: "vars", x: 210, y: ROW[2], w: 150, h: BOX_H },

    { id: "s-prod", label: "Production", sub: "--role production", variant: "source", x: 470, y: ROW[0], w: 162, h: BOX_H },
    { id: "s-preview", label: "Preview", sub: "--role preview", variant: "source", x: 470, y: ROW[1], w: 162, h: BOX_H },
    { id: "s-override", label: "Branch override", sub: "--branch feature/search", variant: "branch", x: 470, y: ROW[2], w: 162, h: BOX_H },
  ],
  edges: [
    { id: "c-main", from: "b-main", fromSide: "r", to: "v-main", toSide: "l" },
    { id: "c-feature", from: "b-feature", fromSide: "r", to: "v-feature", toSide: "l" },
    { id: "c-bug", from: "b-bug", fromSide: "r", to: "v-bug", toSide: "l" },

    { id: "d-prod", from: "s-prod", fromSide: "l", to: "v-main", toSide: "r", dashed: true },
    { id: "d-preview-f", from: "s-preview", fromSide: "l", to: "v-feature", toSide: "r", dashed: true },
    { id: "d-preview-b", from: "s-preview", fromSide: "l", to: "v-bug", toSide: "r", dashed: true },
    { id: "d-override", from: "s-override", fromSide: "l", to: "v-feature", toSide: "r", dashed: true },
  ],
  steps: [
    {
      title: "1. Production",
      caption:
        "Variables set with --role production resolve on your default branch, so main always deploys with exactly the production values.",
      nodes: ["b-main", "b-feature", "b-bug", "v-main", "v-feature", "v-bug", "s-prod"],
      edges: ["c-main", "c-feature", "c-bug", "d-prod"],
      emphasize: ["s-prod", "v-main"],
    },
    {
      title: "2. Preview",
      caption:
        "Preview-scoped variables apply to every preview branch at once, so test traffic stays off your production data without configuring each branch.",
      nodes: ["b-main", "b-feature", "b-bug", "v-main", "v-feature", "v-bug", "s-prod", "s-preview"],
      edges: ["c-main", "c-feature", "c-bug", "d-prod", "d-preview-f", "d-preview-b"],
      emphasize: ["s-preview", "v-feature", "v-bug"],
    },
    {
      title: "3. Branch override",
      caption:
        "A branch override adds or replaces a single value for one branch. feature/search keeps the shared preview variables and layers its override on top; no other branch sees it.",
      nodes: [
        "b-main",
        "b-feature",
        "b-bug",
        "v-main",
        "v-feature",
        "v-bug",
        "s-prod",
        "s-preview",
        "s-override",
      ],
      edges: ["c-main", "c-feature", "c-bug", "d-prod", "d-preview-f", "d-preview-b", "d-override"],
      emphasize: ["s-override", "v-feature"],
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
