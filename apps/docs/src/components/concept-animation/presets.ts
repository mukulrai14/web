import type { CSSProperties } from "react";

/**
 * A concept animation is a sequence of plain-text "diagram" states.
 * Code Hike's token transitions morph one state into the next, so tokens
 * that survive between steps slide to their new position instead of
 * re-rendering.
 *
 * Wrap tokens in `[[...]]` to emphasize them in the current step.
 */
export interface ConceptStep {
  code: string;
  caption: string;
}

export interface ConceptPreset {
  label: string;
  steps: ConceptStep[];
}

export const CONCEPT_PRESETS = {
  "compute-model": {
    label: "How Compute organizes resources",
    steps: [
      {
        code: "[[workspace]]",
        caption: "A workspace owns access, billing, and integrations.",
      },
      {
        code: "workspace → [[project]]",
        caption: "A project groups one product or codebase.",
      },
      {
        code: "workspace → project → [[branch]]",
        caption: "A branch is an isolated environment for one line of work.",
      },
      {
        code: "workspace → project → branch → [[{ apps, databases }]]",
        caption: "Each branch owns its own apps and databases.",
      },
    ],
  },
  "github-connection": {
    label: "How the GitHub connection is layered",
    steps: [
      {
        code: "[[workspace  →  installs the Prisma GitHub App]]\nproject    →  maps to one repository",
        caption: "The workspace owns the GitHub App installation.",
      },
      {
        code: "workspace  →  installs the Prisma GitHub App\n[[project    →  maps to one repository]]",
        caption: "Each project points at a single repository.",
      },
    ],
  },
  "env-layers": {
    label: "How environment variables resolve",
    steps: [
      {
        code: "deploy --branch [[main]]\nvalues: [[production]] variables",
        caption: "Production deploys get the production variables.",
      },
      {
        code: "deploy --branch [[feature/search]]\nvalues: [[preview]] variables",
        caption: "Every preview deploy gets the preview variables.",
      },
      {
        code: "deploy --branch [[feature/search]]\nvalues: preview variables [[+ branch overrides]]",
        caption: "An override replaces a preview value for one specific branch.",
      },
    ],
  },
} satisfies Record<string, ConceptPreset>;

export type ConceptName = keyof typeof CONCEPT_PRESETS;

/** Code Hike token: plain text, or [text, color, style?]. */
export type ConceptToken = string | [string, string, CSSProperties?];

const EMPHASIS_COLOR = "var(--color-fd-primary)";

function pushWords(tokens: ConceptToken[], text: string, emphasized: boolean) {
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      tokens.push(part);
    } else {
      tokens.push([part, emphasized ? EMPHASIS_COLOR : "currentColor"]);
    }
  }
}

/**
 * Turn a `[[...]]`-annotated step into word-level Code Hike tokens.
 * Word-level granularity is what lets token transitions move each word
 * independently; Code Hike's own highlighter would merge same-colored
 * neighbors into one token and the animation would lose its shape.
 */
export function parseStepTokens(code: string): { tokens: ConceptToken[]; plain: string } {
  const tokens: ConceptToken[] = [];
  const emphasis = /\[\[(.+?)\]\]/g;
  let lastIndex = 0;
  for (const match of code.matchAll(emphasis)) {
    pushWords(tokens, code.slice(lastIndex, match.index), false);
    pushWords(tokens, match[1], true);
    lastIndex = match.index + match[0].length;
  }
  pushWords(tokens, code.slice(lastIndex), false);
  return { tokens, plain: code.replace(emphasis, "$1") };
}
