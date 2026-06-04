import { ConceptPlayer } from "./player";
import { CONCEPT_PRESETS, type ConceptName, parseStepTokens } from "./presets";

/**
 * Animated concept diagram for the Compute docs, e.g.
 * `<ConceptAnimation name="compute-model" />` in MDX. Steps are defined in
 * presets.ts; Code Hike token transitions morph between them without
 * shifting the surrounding layout.
 */
export function ConceptAnimation({ name }: { name: ConceptName }) {
  const preset = CONCEPT_PRESETS[name];
  if (!preset) throw new Error(`Unknown concept animation: ${String(name)}`);
  const steps = preset.steps.map((step) => ({
    ...parseStepTokens(step.code),
    caption: step.caption,
  }));
  return <ConceptPlayer label={preset.label} steps={steps} />;
}
