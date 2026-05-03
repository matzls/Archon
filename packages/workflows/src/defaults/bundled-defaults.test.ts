import { describe, it, expect } from 'bun:test';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  isBinaryBuild,
  BUNDLED_COMMANDS,
  BUNDLED_WORKFLOWS,
  BUNDLED_SCRIPTS,
} from './bundled-defaults';

// Resolve the on-disk defaults directories relative to this test file so the
// tests work regardless of cwd. From packages/workflows/src/defaults go up
// four levels to the repo root, then into .archon/.
const REPO_ROOT = join(import.meta.dir, '..', '..', '..', '..');
const COMMANDS_DIR = join(REPO_ROOT, '.archon/commands/defaults');
const WORKFLOWS_DIR = join(REPO_ROOT, '.archon/workflows/defaults');

describe('bundled-defaults', () => {
  describe('isBinaryBuild', () => {
    it('should return false in dev/test mode', () => {
      // `isBinaryBuild()` reads the build-time constant `BUNDLED_IS_BINARY` from
      // `@archon/paths`. In dev/test mode it is `false`. It is only rewritten to
      // `true` by `scripts/build-binaries.sh` before `bun build --compile`.
      // Coverage of the `true` branch is via local binary smoke testing (see #979).
      expect(isBinaryBuild()).toBe(false);
    });
  });

  describe('bundle completeness', () => {
    // These assertions are the canary for bundle drift: if someone adds a
    // default file without regenerating bundled-defaults.generated.ts, the
    // bundle would be missing in compiled binaries (see #979 context). The
    // generator is `scripts/generate-bundled-defaults.ts`, and
    // `bun run check:bundled` verifies the generated file is up to date.

    it('BUNDLED_COMMANDS contains every .md file in .archon/commands/defaults/', () => {
      const onDisk = readdirSync(COMMANDS_DIR)
        .filter(f => f.endsWith('.md'))
        .map(f => f.slice(0, -'.md'.length))
        .sort();
      expect(Object.keys(BUNDLED_COMMANDS).sort()).toEqual(onDisk);
    });

    it('BUNDLED_WORKFLOWS contains every .yaml/.yml file in .archon/workflows/defaults/', () => {
      const onDisk = readdirSync(WORKFLOWS_DIR)
        .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
        .map(f => f.replace(/\.ya?ml$/, ''))
        .sort();
      expect(Object.keys(BUNDLED_WORKFLOWS).sort()).toEqual(onDisk);
    });

    it('bundled content matches on-disk file content (defense against generator corruption)', () => {
      // Bundled content is LF-normalized by the generator so it stays identical
      // regardless of the checkout's line-ending policy. Match that here.
      const readLF = (path: string): string => readFileSync(path, 'utf-8').replace(/\r\n/g, '\n');

      for (const [name, content] of Object.entries(BUNDLED_COMMANDS)) {
        const diskContent = readLF(join(COMMANDS_DIR, `${name}.md`));
        expect(content).toBe(diskContent);
      }
      for (const [name, content] of Object.entries(BUNDLED_WORKFLOWS)) {
        // Workflows may be .yaml or .yml — prefer .yaml, fall back.
        let diskContent: string;
        try {
          diskContent = readLF(join(WORKFLOWS_DIR, `${name}.yaml`));
        } catch {
          diskContent = readLF(join(WORKFLOWS_DIR, `${name}.yml`));
        }
        expect(content).toBe(diskContent);
      }
    });
  });

  describe('BUNDLED_COMMANDS', () => {
    it('every command has meaningful content (>50 chars)', () => {
      for (const content of Object.values(BUNDLED_COMMANDS)) {
        expect(content.length).toBeGreaterThan(50);
      }
    });

    it('archon-pr-review-scope should read .pr-number before other discovery', () => {
      const content = BUNDLED_COMMANDS['archon-pr-review-scope'];
      expect(content).toContain('$ARTIFACTS_DIR/.pr-number');
      expect(content).toContain('PR_NUMBER=$(cat $ARTIFACTS_DIR/.pr-number');
    });

    it('archon-create-pr should write .pr-number to artifacts', () => {
      const content = BUNDLED_COMMANDS['archon-create-pr'];
      expect(content).toContain('echo "$PR_NUMBER" > "$ARTIFACTS_DIR/.pr-number"');
    });
  });

  describe('BUNDLED_WORKFLOWS', () => {
    it('every workflow has meaningful content (>50 chars)', () => {
      for (const content of Object.values(BUNDLED_WORKFLOWS)) {
        expect(content.length).toBeGreaterThan(50);
      }
    });

    it('archon-workflow-builder should have validate-before-save node ordering and key constraints', () => {
      const content = BUNDLED_WORKFLOWS['archon-workflow-builder'];
      expect(content).toContain('id: validate-yaml');
      expect(content).toContain('depends_on: [validate-yaml]');
      expect(content).toContain('denied_tools: [Edit, Bash]');
      expect(content).toContain('output_format:');
      expect(content).toContain('workflow_name');
    });

    it('archon-adversarial-dev init-workspace should avoid non-portable sed -i', () => {
      const content = BUNDLED_WORKFLOWS['archon-adversarial-dev'];
      expect(content).toContain('STATE_TMP="$ARTIFACTS/state.json.tmp"');
      expect(content).toContain(
        'sed "s/SPRINT_COUNT_PLACEHOLDER/$SPRINT_COUNT/" "$ARTIFACTS/state.json" > "$STATE_TMP"'
      );
      expect(content).not.toContain('sed -i "s/SPRINT_COUNT_PLACEHOLDER/$SPRINT_COUNT/"');
    });

    it('archon-piv-loop-codex-v2 should preserve Slice 2 focused-plan contracts', () => {
      const content = BUNDLED_WORKFLOWS['archon-piv-loop-codex-v2'];
      expect(content).toContain('name: archon-piv-loop-codex-v2');
      expect(content).toContain('id: intake-classifier');
      expect(content).toContain('id: mode-b-design-doc');
      expect(content).toContain('id: mode-b-slice-map');
      expect(content).toContain('id: mode-b-intake-summary');
      expect(content).toContain('Mode B must select exactly one slice');
      expect(content).toContain('import re');
      expect(content).toContain('Mode B slice map must contain exactly one selected marker');
      expect(content).toContain('docs/plans/{slug}_plan.md');
      expect(content).toContain('PLAN_FILE=docs/plans/{slug}_plan.md');
      expect(content).toContain('## ELI5 Summary');
      expect(content).toContain('## Problem Statement');
      expect(content).toContain('## Solution Concept');
      expect(content).toContain('## Current Inputs');
      expect(content).toContain('## Slice Metadata');
      expect(content).toContain('## Plan Status & Controls');
      expect(content).toContain('## Peer Review Gate');
      expect(content).toContain('## Documentation Surface Map');
      expect(content).toContain('## Risks');
      expect(content).toContain('ERROR: PLAN_FILE missing from create-plan output');
      expect(content).toContain('ERROR: PLAN_FILE missing from implement-setup output');
      expect(content).not.toContain('.claude/archon/plans');
      expect(content).not.toContain('ls -t ');
    });

    it('archon-piv-loop-codex-v2 should require live validation before finalization', () => {
      const content = BUNDLED_WORKFLOWS['archon-piv-loop-codex-v2'];
      const liveValidateIndex = content.indexOf('id: live-validate');
      const composeFinalizeIndex = content.indexOf('id: compose-finalize');

      expect(liveValidateIndex).toBeGreaterThan(-1);
      expect(composeFinalizeIndex).toBeGreaterThan(liveValidateIndex);
      expect(content).toContain('depends_on: [live-validate, implement-setup]');
      expect(content).toContain('$ARTIFACTS_DIR/e2e-reports');
      expect(content).toContain('e2e_report_manager.py');
      expect(content).toContain('waiver_reason');
      expect(content).toContain('ERROR: live validation evidence or waiver missing');
      expect(content).not.toContain('depends_on: [fix-feedback, implement-setup]');
      expect(content).not.toContain('deferred to later V2 slices');
    });

    it('archon-piv-loop-codex-v2 should preserve Slice 6 review-gate contracts', () => {
      const content = BUNDLED_WORKFLOWS['archon-piv-loop-codex-v2'];

      expect(content).toContain('id: planning-review');
      expect(content).toContain('depends_on: [refine-plan, create-plan]');
      expect(content).toContain('id: implementation-review');
      expect(content).toContain('depends_on: [code-review, implement-setup, detect-project]');
      expect(content).toContain('peer_review:');
      expect(content).toContain('advisory_sidecar: ""');
      expect(content).toContain('frozen_plan_sidecar: ""');
      expect(content).toContain('implementation_review_artifact: ""');
      expect(content).toContain('docs/plans/_advisory-reviews/');
      expect(content).toContain('docs/plans/_peer-reviews/');
      expect(content).toContain('review_needed');
      expect(content).toContain('review_revisions');
      expect(content).toContain('complete_on_user_input:');
      expect(content).toContain('gate_message: |');
      expect(content).toContain('max_iterations: 3');
    });

    it('S7 pr-review-handoff fixture', () => {
      const content = BUNDLED_WORKFLOWS['archon-piv-loop-codex-v2'];

      expect(content).toContain('id: pr-review-handoff');
      expect(content).toContain(
        'depends_on: [finalize, compose-finalize, live-validate, planning-review, implementation-review, implement-setup]'
      );
      expect(content).toContain('$ARTIFACTS_DIR/pr-review-handoff.json');
      expect(content).toContain('schema_version');
      expect(content).toContain('handoff_type');
      expect(content).toContain('branch');
      expect(content).toContain('base');
      expect(content).toContain('validation');
      expect(content).toContain('evidence_path');
      expect(content).toContain('waiver_reason');
      expect(content).toContain('review');
      expect(content).toContain('planning_status');
      expect(content).toContain('implementation_status');
      expect(content).toContain('implementation_review_artifact');
      expect(content).toContain('PLANNING_REVIEW_DECISION');
      expect(content).toContain('IMPLEMENTATION_REVIEW_ARTIFACT');
      expect(content).toContain('implementation review artifact path missing');
      expect(content).toContain('unsupported {review_name} decision');
      expect(content).toContain('{review_name} did not advance');
      expect(content).toContain('"planning-review": planning_review_decision');
      expect(content).toContain('"implementation-review": implementation_review_decision');
      expect(content).toContain('url');
      expect(content).toContain('number');
      expect(content).toContain('state');
      expect(content).toContain('next_action');
      expect(content).toContain('remote_codex_pr_review_recommended');
      expect(content).toContain('remote Codex PR review');
      expect(content).toContain('autonomous_merge_claim');
      expect(content).toContain('pr-result.json');
      expect(content).toContain('pr-ready.md');
      expect(content).toContain('required_pr_fields');
      expect(content).toContain('pr-result.json missing required field');
      expect(content).toContain('"isDraft": bool');
      expect(content).toContain('artifact_path');
      expect(content).toContain('implementation review artifact missing');

      const artifactsDir =
        process.env.ARTIFACTS_DIR ??
        join(REPO_ROOT, 'artifacts', 'workflow', 'tmp', 'r001-s7-handoff-fixture');

      mkdirSync(artifactsDir, { recursive: true });
      const handoffPath = join(artifactsDir, 'pr-review-handoff.json');
      const payload = {
        schema_version: 'archon.pr-review-handoff.v1',
        handoff_type: 'pr_ready',
        branch: 'slice/r001-archon-piv-loop-codex-v2/s7',
        base: 'dev',
        validation: {
          status: 'pass',
          evidence_path: 'artifacts/workflow/e2e-reports/r001-s7-pass.json',
          waiver_reason: '',
          summary: 'fixture handoff coverage',
        },
        review: {
          planning_status: 'advance',
          implementation_status: 'advance',
          implementation_review_artifact:
            'artifacts/workflow/code-review-and-ship/slice-review-iterate/r001-archon-piv-loop-codex-v2/s7/round-02-20260428T171026Z/codex-review.md',
        },
        pr: {
          url: 'https://github.com/matzls/Archon/pull/123',
          number: 123,
          state: 'draft',
        },
        next_action:
          'Review the PR-ready packet and decide whether to run the downstream remote Codex PR review workflow.',
        remote_codex_pr_review_recommended: false,
        autonomous_merge_claim: false,
      };

      writeFileSync(handoffPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

      const written = JSON.parse(readFileSync(handoffPath, 'utf8')) as typeof payload;
      expect(written.schema_version).toBe('archon.pr-review-handoff.v1');
      expect(written.handoff_type).toBe('pr_ready');
      expect(written.branch).toBe('slice/r001-archon-piv-loop-codex-v2/s7');
      expect(written.base).toBe('dev');
      expect(written.validation.status).toBe('pass');
      expect(written.validation.evidence_path).toBe(
        'artifacts/workflow/e2e-reports/r001-s7-pass.json'
      );
      expect(written.validation.waiver_reason).toBe('');
      expect(written.validation.summary).toBe('fixture handoff coverage');
      expect(written.review.planning_status).toBe('advance');
      expect(written.review.implementation_status).toBe('advance');
      expect(written.review.implementation_review_artifact).toBe(
        'artifacts/workflow/code-review-and-ship/slice-review-iterate/r001-archon-piv-loop-codex-v2/s7/round-02-20260428T171026Z/codex-review.md'
      );
      expect(written.pr.url).toBe('https://github.com/matzls/Archon/pull/123');
      expect(written.pr.number).toBe(123);
      expect(written.pr.state).toBe('draft');
      expect(written.next_action).toContain('remote Codex PR review workflow');
      expect(written.remote_codex_pr_review_recommended).toBe(false);
      expect(written.autonomous_merge_claim).toBe(false);
    });

    it('should have valid YAML structure', () => {
      for (const content of Object.values(BUNDLED_WORKFLOWS)) {
        expect(content).toContain('name:');
        expect(content).toContain('description:');
        expect(content.includes('nodes:')).toBe(true);
      }
    });
  });

  describe('BUNDLED_SCRIPTS', () => {
    // Fork-only feature: `script:` nodes in default workflows reference these
    // by short name. Kept in the hand-written facade (not the generator)
    // because the generator produces a flat `Record<string, string>` and
    // scripts need the richer `{ content, runtime, extension }` shape.
    it('should include the detect-project helper used by default workflows', () => {
      expect(BUNDLED_SCRIPTS).toHaveProperty('detect-project');
      expect(BUNDLED_SCRIPTS['detect-project'].runtime).toBe('bun');
      expect(BUNDLED_SCRIPTS['detect-project'].extension).toBe('.ts');
      expect(BUNDLED_SCRIPTS['detect-project'].content).toContain('PROJECT_TYPE=');
    });

    it('should include the github-pr helper used by default workflows', () => {
      expect(BUNDLED_SCRIPTS).toHaveProperty('github-pr');
      expect(BUNDLED_SCRIPTS['github-pr'].runtime).toBe('bun');
      expect(BUNDLED_SCRIPTS['github-pr'].extension).toBe('.ts');
      expect(BUNDLED_SCRIPTS['github-pr'].content).toContain('pr-request.json');
    });
  });
});
