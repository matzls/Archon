#!/usr/bin/env python3
"""Conservative Codex compatibility lint for Archon workflow YAML.

This helper is not a YAML parser and does not replace `archon validate
workflows`. It catches common Codex-safety mistakes before runtime.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable


CLAUDE_ALIASES = {"sonnet", "opus", "haiku", "inherit"}
CODEX_TUNING = {"modelReasoningEffort", "webSearchMode", "additionalDirectories"}
CODEX_UNSUPPORTED = {
    "hooks",
    "mcp",
    "skills",
    "agents",
    "allowed_tools",
    "denied_tools",
    "effort",
    "thinking",
    "maxBudgetUsd",
    "systemPrompt",
    "fallbackModel",
    "betas",
    "sandbox",
}
AI_FIELDS = CODEX_UNSUPPORTED | CODEX_TUNING | {"provider", "model", "output_format", "context"}


@dataclass
class Issue:
    level: str
    file: str
    line: int
    code: str
    message: str


@dataclass
class NodeBlock:
    node_id: str
    start_line: int
    text: str


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def first_top_level_value(text: str, key: str) -> str | None:
    pattern = re.compile(rf"^{re.escape(key)}:\s*(.+?)\s*$", re.MULTILINE)
    match = pattern.search(text)
    if not match:
        return None
    return match.group(1).strip().strip("\"'")


def has_local_tags_support(repo_root: Path | None) -> bool | None:
    if repo_root is None:
        return None
    schema = repo_root / "packages/workflows/src/schemas/workflow.ts"
    if not schema.exists():
        return None
    return "tags:" in schema.read_text(encoding="utf-8")


def split_nodes(text: str) -> list[NodeBlock]:
    matches = list(re.finditer(r"^  - id:\s*([A-Za-z0-9_-]+)\s*$", text, re.MULTILINE))
    nodes: list[NodeBlock] = []
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        start_line = text.count("\n", 0, start) + 1
        nodes.append(NodeBlock(match.group(1), start_line, text[start:end]))
    return nodes


def line_number(base: int, block_text: str, offset: int) -> int:
    return base + block_text.count("\n", 0, offset)


def node_fields(block: NodeBlock) -> dict[str, int]:
    fields: dict[str, int] = {}
    for match in re.finditer(r"^    ([A-Za-z_][A-Za-z0-9_]*):", block.text, re.MULTILINE):
        fields[match.group(1)] = line_number(block.start_line, block.text, match.start())
    return fields


def node_type(fields: dict[str, int]) -> str | None:
    modes = ["command", "prompt", "bash", "script", "loop", "approval", "cancel"]
    present = [mode for mode in modes if mode in fields]
    return present[0] if present else None


def node_provider(block: NodeBlock, top_provider: str | None) -> str | None:
    provider = re.search(r"^    provider:\s*([^\s#]+)", block.text, re.MULTILINE)
    if provider:
        return provider.group(1).strip().strip("\"'")
    return top_provider


def node_model(block: NodeBlock, top_model: str | None) -> str | None:
    model = re.search(r"^    model:\s*([^\s#]+)", block.text, re.MULTILINE)
    if model:
        return model.group(1).strip().strip("\"'")
    return top_model


def lint_file(path: Path, repo_root: Path | None) -> list[Issue]:
    text = read_text(path)
    rel = str(path)
    issues: list[Issue] = []
    top_provider = first_top_level_value(text, "provider")
    top_model = first_top_level_value(text, "model")
    name = first_top_level_value(text, "name") or path.stem

    if top_provider == "codex" and not name.endswith("-codex") and not name.startswith("e2e-"):
        issues.append(
            Issue(
                "warning",
                rel,
                1,
                "codex-name",
                "Codex-native workflows should usually use a -codex suffix.",
            )
        )

    if top_provider == "codex" and top_model:
        if top_model in CLAUDE_ALIASES or top_model.startswith("claude-"):
            issues.append(
                Issue(
                    "error",
                    rel,
                    1,
                    "codex-model",
                    f"Model '{top_model}' is not compatible with provider codex.",
                )
            )

    tags_support = has_local_tags_support(repo_root)
    if re.search(r"^tags:\s*", text, re.MULTILINE) and tags_support is False:
        issues.append(
            Issue(
                "warning",
                rel,
                1,
                "local-tags-unsupported",
                "This local schema did not expose top-level tags when checked; verify before using upstream tags.",
            )
        )

    for marker in ("$other-node.output", "$<nodeId>.output"):
        idx = text.find(marker)
        if idx >= 0:
            issues.append(
                Issue(
                    "error",
                    rel,
                    text.count("\n", 0, idx) + 1,
                    "placeholder-output-ref",
                    f"Placeholder reference '{marker}' can be parsed as a real node output reference.",
                )
            )

    node_blocks = split_nodes(text)
    node_ids = {block.node_id for block in node_blocks}
    for match in re.finditer(r"\$([A-Za-z_][A-Za-z0-9_-]*)\.output", text):
        ref_node_id = match.group(1)
        if ref_node_id not in node_ids:
            issues.append(
                Issue(
                    "error",
                    rel,
                    text.count("\n", 0, match.start()) + 1,
                    "unknown-output-ref",
                    f"Output reference '${ref_node_id}.output' does not match any node id in this workflow.",
                )
            )

    for block in node_blocks:
        fields = node_fields(block)
        kind = node_type(fields)
        provider = node_provider(block, top_provider)
        model = node_model(block, top_model)
        is_codex = provider == "codex"

        if is_codex and model:
            if model in CLAUDE_ALIASES or model.startswith("claude-"):
                issues.append(
                    Issue(
                        "error",
                        rel,
                        block.start_line,
                        "codex-node-model",
                        f"Node '{block.node_id}' resolves to codex but uses Claude model '{model}'.",
                    )
                )

        if kind in {"bash", "script"}:
            ignored = sorted((set(fields) & AI_FIELDS) - {"provider", "model"})
            for field in ignored:
                issues.append(
                    Issue(
                        "warning",
                        rel,
                        fields[field],
                        "non-ai-field-ignored",
                        f"Node '{block.node_id}' is {kind}; AI field '{field}' is ignored.",
                    )
                )

        if kind == "loop":
            if "retry" in fields:
                issues.append(
                    Issue(
                        "error",
                        rel,
                        fields["retry"],
                        "loop-retry",
                        f"Node '{block.node_id}' is a loop; retry is a hard parse error.",
                    )
                )
            for field in sorted(set(fields) & CODEX_TUNING):
                issues.append(
                    Issue(
                        "warning",
                        rel,
                        fields[field],
                        "loop-codex-tuning-ignored",
                        f"Node '{block.node_id}' is a loop; set Codex tuning at workflow/config level.",
                    )
                )
            if "output_format" in fields:
                issues.append(
                    Issue(
                        "warning",
                        rel,
                        fields["output_format"],
                        "loop-output-format",
                        f"Node '{block.node_id}' is a loop; output_format is not a loop structured-output contract.",
                    )
                )

        if is_codex:
            for field in sorted(set(fields) & CODEX_UNSUPPORTED):
                issues.append(
                    Issue(
                        "warning",
                        rel,
                        fields[field],
                        "codex-unsupported-field",
                        f"Node '{block.node_id}' uses '{field}', which Codex does not support as a workflow node contract.",
                    )
                )

    return issues


def iter_paths(args: Iterable[str]) -> list[Path]:
    paths: list[Path] = []
    for raw in args:
        path = Path(raw)
        if path.is_dir():
            paths.extend(sorted(path.rglob("*.yaml")))
            paths.extend(sorted(path.rglob("*.yml")))
        else:
            paths.append(path)
    return paths


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", help="Workflow YAML file(s) or directories.")
    parser.add_argument("--repo-root", help="Archon repo root for local schema checks.")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero on warnings too.")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve() if args.repo_root else None
    all_issues: list[Issue] = []
    for path in iter_paths(args.paths):
        if not path.exists():
            all_issues.append(Issue("error", str(path), 0, "missing-file", "File does not exist."))
            continue
        all_issues.extend(lint_file(path, repo_root))

    if args.format == "json":
        print(json.dumps([asdict(issue) for issue in all_issues], indent=2))
    else:
        if not all_issues:
            print("No Codex workflow lint issues found.")
        for issue in all_issues:
            loc = f"{issue.file}:{issue.line}" if issue.line else issue.file
            print(f"{issue.level.upper()} {loc} [{issue.code}] {issue.message}")

    has_error = any(issue.level == "error" for issue in all_issues)
    has_warning = any(issue.level == "warning" for issue in all_issues)
    return 1 if has_error or (args.strict and has_warning) else 0


if __name__ == "__main__":
    sys.exit(main())
