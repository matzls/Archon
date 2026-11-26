#!/usr/bin/env bash
# Local to Mase's fork (matzls/Archon, branch mase/local-fixes); not part of upstream Archon.
# Rebuild the patched Codex provider (assistants.codex.execPolicyApprovals) from this
# checkout, and optionally install it. The procedure around it lives in the archon entry
# of ~/.codex/oss-fork-manager/registry.json.
#
#   rebuild-codex-provider.sh build   <version> <bun-version>   # e.g. build 0.15.0 1.4.5
#   rebuild-codex-provider.sh install <version>                 # needs Mase's go
#
# build:   runs on the checked-out mase/local-fixes (must be clean and already rebased onto
#          v<version>), uses Bun <bun-version> from $CACHE/bun-<bun-version> (the version the
#          release binary was built with: strings <release-binary> | grep 'Bun v1'),
#          writes $CACHE/builds/v<version>-<sha>/{archon-provider-codex,descriptor.json,receipt.json}.
# install: backs up the installed binary and receipt to ~/.archon/backups, then replaces both.
#          Run only with no active Archon runs. Rollback: copy the backup pair back.
set -euo pipefail

CACHE="${ARCHON_CODEX_PATCH_CACHE:-$HOME/.cache/archon-codex-patch}"
REPO="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
PLUGINS="$HOME/.archon/plugins"
RECEIPT="$PLUGINS/installed/coleam00/Archon/plugins/provider-codex/receipt.json"
mode="${1:?build|install}"
version="${2:?version, e.g. 0.15.0}"

out_dir() { echo "$CACHE/builds/v$version-$(git -C "$REPO" rev-parse --short=9 HEAD)"; }

if [ "$mode" = build ]; then
  bun_version="${3:?bun version, e.g. 1.4.5}"
  bun_dir="$CACHE/bun-$bun_version/bun-darwin-aarch64"
  if [ ! -x "$bun_dir/bun" ]; then
    mkdir -p "$CACHE/bun-$bun_version" && cd "$CACHE/bun-$bun_version"
    base="https://github.com/oven-sh/bun/releases/download/bun-v$bun_version"
    curl -fsSL -o bun.zip "$base/bun-darwin-aarch64.zip"
    curl -fsSL -o SHASUMS256.txt "$base/SHASUMS256.txt"
    want=$(grep 'bun-darwin-aarch64.zip$' SHASUMS256.txt | cut -d' ' -f1)
    [ "$(shasum -a 256 bun.zip | cut -d' ' -f1)" = "$want" ] || { echo "bun checksum mismatch" >&2; exit 1; }
    unzip -oq bun.zip
  fi
  export PATH="$bun_dir:$PATH"
  cd "$REPO"
  [ -z "$(git status --porcelain)" ] || { echo "checkout is dirty; stop" >&2; exit 1; }
  [ "$(git branch --show-current)" = mase/local-fixes ] || { echo "not on mase/local-fixes" >&2; exit 1; }
  bun install --frozen-lockfile
  node_modules/.bin/tsc -b packages/providers
  (cd packages/providers && bun run test)
  OUT="$(out_dir)"; mkdir -p "$OUT"
  release_commit=$(git rev-parse --short=8 "v$version")
  trap 'git -C "$REPO" checkout -- packages/paths/src/bundled-build.ts' EXIT
  VERSION="$version" GIT_COMMIT="$release_commit-local-execpolicy" WEB_DIST_SHA256= SERVER_SHA256= \
    BUNDLED_BUILD_FILE=packages/paths/src/bundled-build.ts \
    bash -c "$(sed -n '/^write_constants() {/,/^}/p' scripts/build-binaries.sh); write_constants"
  bun build --compile --minify --no-compile-autoload-dotenv --no-compile-autoload-bunfig \
    --target=bun-darwin-arm64 --outfile="$OUT/archon-provider-codex" packages/providers/src/codex/plugin.ts
  LC_ALL=C grep -aq execPolicyApprovals "$OUT/archon-provider-codex" || { echo "patch missing from binary" >&2; exit 1; }
  inspect='import { inspectProviderPlugin } from "./packages/core/src/providers/inspect-provider-plugin.ts"; console.log(JSON.stringify(await inspectProviderPlugin(process.argv[1])));'
  bun -e "$inspect" "$OUT/archon-provider-codex" > "$OUT/descriptor.json"
  python3 - "$RECEIPT" "$OUT/descriptor.json" "$(git rev-parse HEAD)" \
    "$(shasum -a 256 "$OUT/archon-provider-codex" | cut -d' ' -f1)" "$version" > "$OUT/receipt.json" <<'EOF'
import json, sys, datetime
receipt_path, descriptor_path, commit, sha, version = sys.argv[1:]
r = json.load(open(receipt_path))
d = json.load(open(descriptor_path))
assert d["version"] == version, f"descriptor version {d['version']} != {version}"
assert "execPolicyApprovals" in d["configSchema"]["properties"], "schema lacks execPolicyApprovals"
r.update(descriptor=d, tag=f"local-v{version}-execpolicy-{commit[:9]}", commit=commit,
         installedAt=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
         files=[{"path": "archon-provider-codex", "sha256": sha}])
print(json.dumps(r, indent=2))
EOF
  echo "built: $OUT"
elif [ "$mode" = install ]; then
  OUT="$(out_dir)"
  [ -f "$OUT/archon-provider-codex" ] && [ -f "$OUT/receipt.json" ] || { echo "no build in $OUT" >&2; exit 1; }
  BK="$HOME/.archon/backups/provider-codex-before-$(basename "$OUT")-$(date +%Y%m%d%H%M%S)"
  mkdir -p "$BK" && cp -p "$PLUGINS/archon-provider-codex" "$RECEIPT" "$BK/"
  cp "$OUT/archon-provider-codex" "$PLUGINS/archon-provider-codex"
  cp "$OUT/receipt.json" "$RECEIPT"
  echo "installed $(shasum -a 256 "$PLUGINS/archon-provider-codex"); backup: $BK"
  archon doctor
else
  echo "unknown mode $mode" >&2; exit 1
fi
