#!/usr/bin/env bash
set -euo pipefail

# Partitions the current Git repository into 3 isolated directories/branches
# for concurrent execution across 3 Google AI Pro Antigravity accounts.

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: Run this script inside the root of a Git repository." >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# Ensure an initial commit exists on main
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  git checkout -b main
  git add -A
  git commit -m "chore: bootstrap repository for hyperxagent swarm" --allow-empty
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [ "$CURRENT_BRANCH" != "main" ]; then
  git checkout -B main
fi

WT_BACKEND="../wt-account2-backend"
WT_FRONTEND="../wt-account3-ui"

create_or_reset_worktree() {
  local wt_path="$1"
  local branch_name="$2"

  if git worktree list --porcelain | grep -Fq "worktree $(realpath -m "$wt_path")"; then
    echo "Worktree already exists at $wt_path ($branch_name)"
  else
    if git show-ref --verify --quiet "refs/heads/$branch_name"; then
      git worktree add "$wt_path" "$branch_name"
    else
      git worktree add -b "$branch_name" "$wt_path" main
    fi
    echo "Created worktree: $wt_path -> branch $branch_name"
  fi
}

create_or_reset_worktree "$WT_BACKEND" "feat/backend"
create_or_reset_worktree "$WT_FRONTEND" "feat/frontend"

echo ""
echo "=== 3-Account Antigravity Worktree Matrix Ready ==="
echo "Account 1 (main)          : $REPO_ROOT"
echo "Account 2 (feat/backend)  : $(realpath -m "$WT_BACKEND")"
echo "Account 3 (feat/frontend) : $(realpath -m "$WT_FRONTEND")"
