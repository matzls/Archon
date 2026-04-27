/**
 * Zod schema for loop node configuration.
 */
import { z } from '@hono/zod-openapi';

export const loopDecisionGateDecisionSchema = z
  .object({
    id: z.string().trim().min(1, "'loop.decision_gate.decisions[].id' must be non-empty"),
    resume_reason: z.string().trim().min(1).optional(),
    transition_intent: z.string().trim().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.resume_reason && !data.transition_intent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "'loop.decision_gate.decisions[]' must include either 'resume_reason' or 'transition_intent'",
      });
    }
  });

export const loopDecisionGateSchema = z
  .object({
    gate_kind: z.string().trim().min(1).optional(),
    decisions: z
      .array(loopDecisionGateDecisionSchema)
      .nonempty("'loop.decision_gate.decisions' must include at least one decision"),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    for (const [index, decision] of data.decisions.entries()) {
      if (seen.has(decision.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `'loop.decision_gate.decisions[].id' must be unique: ${decision.id}`,
          path: ['decisions', index, 'id'],
        });
      }
      seen.add(decision.id);
    }
  });

export const loopNodeConfigSchema = z
  .object({
    /** Inline prompt text executed each iteration. */
    prompt: z.string().min(1, "loop node requires 'loop.prompt' (non-empty string)"),
    /** Completion signal string detected in AI output (e.g., "COMPLETE"). */
    until: z.string().min(1, "loop node requires 'loop.until' (completion signal string)"),
    /** Maximum iterations allowed; exceeding this fails the node. */
    max_iterations: z.number().int().positive("'loop.max_iterations' must be a positive integer"),
    /** Whether to start fresh session each iteration (default: false). */
    fresh_context: z.boolean().default(false),
    /** Optional bash script run after each iteration; exit 0 = complete. */
    until_bash: z.string().optional(),
    /** Optional typed decision contract for structured continue/advance loop gates. */
    decision_gate: loopDecisionGateSchema.optional(),
    /** Optional progress file used to detect durable task completion across iterations. */
    progress_file: z.string().optional(),
    /** Fail early when this many consecutive iterations make no durable progress. */
    stuck_after_no_progress_iterations: z.number().int().min(2).optional(),
    /** When true, pause between iterations for user input via /workflow approve. */
    interactive: z.boolean().optional(),
    /** Exact user replies that complete an interactive loop without another AI turn. */
    complete_on_user_input: z
      .array(
        z.string().trim().min(1, "'loop.complete_on_user_input' entries must be non-empty strings")
      )
      .nonempty("'loop.complete_on_user_input' must include at least one entry")
      .optional(),
    /** Message shown to user when paused (required when interactive is true). */
    gate_message: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.interactive === true && !data.gate_message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "interactive loop requires 'loop.gate_message' (non-empty string)",
        path: ['gate_message'],
      });
    }
  });

export type LoopNodeConfig = z.infer<typeof loopNodeConfigSchema>;
export type LoopDecisionGate = z.infer<typeof loopDecisionGateSchema>;
