#!/usr/bin/env bash
# PreToolUse hook (Edit|Write|MultiEdit|NotebookEdit): block edits to paths that define
# the process, its gates and agent permissions. See CLAUDE.md, 受保護路徑.
#
# A human making an approved change can bypass it for one session:
#   CLAUDE_ALLOW_PROTECTED_EDITS=1 claude
# The real enforcement is CODEOWNERS + branch protection; this hook is the early warning.
set -uo pipefail

[[ "${CLAUDE_ALLOW_PROTECTED_EDITS:-}" == "1" ]] && exit 0

file_path=$(node -e '
  let s = "";
  process.stdin.on("data", (c) => (s += c));
  process.stdin.on("end", () => {
    try {
      const i = JSON.parse(s).tool_input || {};
      process.stdout.write(String(i.file_path || i.notebook_path || ""));
    } catch { process.stdout.write(""); }
  });
')
[[ -z "$file_path" ]] && exit 0

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
rel="${file_path#"$project_dir"/}"

case "$rel" in
  .github/workflows/* | .github/CODEOWNERS | \
  .claude/settings.json | .claude/hooks/* | .claude/skills/* | .claude/agents/* | \
  CLAUDE.md | apps/mobile/eas.json | docs/process.md)
    echo "protect-paths: '$rel' is a protected path (see CLAUDE.md). Do not edit it." >&2
    echo "Open a ticket describing the change instead; a human will apply it." >&2
    exit 2
    ;;
esac
exit 0
