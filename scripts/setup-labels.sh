#!/usr/bin/env bash
# Creates (or updates) the label state machine described in docs/process.md.
# Usage: scripts/setup-labels.sh [owner/repo]   (defaults to the current gh repo)
set -euo pipefail

repo_args=()
if [[ $# -gt 0 ]]; then
  repo_args=(--repo "$1")
fi

label() {
  gh label create "$1" --color "$2" --description "$3" --force ${repo_args[@]+"${repo_args[@]}"}
}

# Workflow state
label ready              0E8A16 "Ticket can be implemented; triggers the Implementer"
label in-progress        FBCA04 "Implementer is working on it"
label in-review          1D76DB "PR open, waiting for review"
label changes-requested  D93F0B "Reviewer asked for changes"
label blocked            B60205 "Same problem failed 3 times; needs a human"
label needs-spec         C5DEF5 "Requirement unclear; back to PM agent"
label needs-design       C5DEF5 "Design does not work; back to Architect agent"
label needs-human        B60205 "Needs a human decision; automation paused"

# Ticket attributes
label contract           5319E7 "Changes a shared interface, schema or navigation; merge first"
label native-change      5319E7 "Touches the native layer; run iOS verification early"
label bug                D73A4A "Defect"

# Metrics
label human-intervention 000000 "A human had to step in (log it in docs/agent-log.md)"
label escaped            000000 "Bug found only on device or after release"
