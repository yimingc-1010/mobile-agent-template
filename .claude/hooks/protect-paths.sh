#!/usr/bin/env bash
# PreToolUse hook (Edit|Write|MultiEdit|NotebookEdit): block edits to paths that define
# the process, its gates and agent permissions. See CLAUDE.md, 受保護路徑.
#
# Base paths are listed below; platform templates add their own globs, one per line,
# in .claude/protected-paths.platform (lines starting with # are ignored).
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

block() {
  echo "protect-paths: '$rel' is a protected path (see CLAUDE.md). Do not edit it." >&2
  echo "Open a ticket describing the change instead; a human will apply it." >&2
  exit 2
}

case "$rel" in
  .github/workflows/* | .github/actions/* | .github/CODEOWNERS | \
  .claude/settings.json | .claude/hooks/* | .claude/skills/* | .claude/agents/* | \
  .claude/protected-paths.platform | \
  CLAUDE.md | docs/process.md | docs/platform.md | docs/template.md)
    block
    ;;
esac

platform_list="$project_dir/.claude/protected-paths.platform"
if [[ -f "$platform_list" ]]; then
  while IFS= read -r pattern || [[ -n "$pattern" ]]; do
    pattern="${pattern%%#*}"
    pattern="${pattern//[[:space:]]/}"
    [[ -z "$pattern" ]] && continue
    # shellcheck disable=SC2053 # glob match is intended
    [[ "$rel" == $pattern ]] && block
  done <"$platform_list"
fi
exit 0
