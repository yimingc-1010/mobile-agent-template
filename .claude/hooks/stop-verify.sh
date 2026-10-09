#!/usr/bin/env bash
# Stop hook: keep the agent working while T1 checks (`npm run verify`) fail.
#
# Runs only when code or config changed. Blocks at most MAX_BLOCKS times in a row per
# session, then lets the agent stop; the implement skill requires it to label the
# ticket `blocked` in that case (docs/process.md, 例外處理).
set -uo pipefail

MAX_BLOCKS=3
input=$(cat)
session_id=$(printf '%s' "$input" | node -e '
  let s = "";
  process.stdin.on("data", (c) => (s += c));
  process.stdin.on("end", () => {
    try { process.stdout.write(String(JSON.parse(s).session_id || "unknown")); }
    catch { process.stdout.write("unknown"); }
  });
')
counter_file="${TMPDIR:-/tmp}/claude-stop-verify-${session_id}"

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

if git rev-parse --verify HEAD >/dev/null 2>&1; then
  changed=$({ git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null)
else
  changed=$(git ls-files --cached --others --exclude-standard 2>/dev/null)
fi
if ! printf '%s\n' "$changed" | grep -qE '\.(ts|tsx|js|jsx|mjs|cjs|json|yaml|yml)$'; then
  rm -f "$counter_file"
  exit 0
fi

if [[ ! -d node_modules ]]; then
  echo "stop-verify: node_modules is missing. Run \`npm install\`, then \`npm run verify\`." >&2
  exit 2
fi

if output=$(npm run --silent verify 2>&1); then
  rm -f "$counter_file"
  exit 0
fi

count=$(($(cat "$counter_file" 2>/dev/null || echo 0) + 1))
echo "$count" >"$counter_file"
if ((count > MAX_BLOCKS)); then
  rm -f "$counter_file"
  exit 0
fi

{
  echo "T1 verification (\`npm run verify\`) failed (attempt ${count}/${MAX_BLOCKS}). Fix it before finishing."
  echo "If it is a formatting failure, run \`npm run format\`."
  echo "After ${MAX_BLOCKS} failed attempts, stop and label the ticket \`blocked\` with the error output."
  echo "--- last lines of output ---"
  printf '%s\n' "$output" | tail -60
} >&2
exit 2
