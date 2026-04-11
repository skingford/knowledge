#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/merge-to-main.sh [--source <branch>] [--target <branch>] [--dry-run]

Create a clean merge from the source branch into the target branch while excluding
tracked AI tooling files from the target branch.

Examples:
  scripts/merge-to-main.sh
  scripts/merge-to-main.sh --source dev --target main
  scripts/merge-to-main.sh --dry-run
EOF
}

SOURCE_BRANCH="dev"
TARGET_BRANCH="main"
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source)
      SOURCE_BRANCH="${2:?missing value for --source}"
      shift 2
      ;;
    --target)
      TARGET_BRANCH="${2:?missing value for --target}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown argument: %s\n\n' "$1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

readonly REPO_ROOT="$(git rev-parse --show-toplevel)"
readonly CURRENT_BRANCH="$(git -C "$REPO_ROOT" branch --show-current)"
readonly GITIGNORE_BEGIN="# BEGIN managed AI tooling ignore block"
readonly GITIGNORE_END="# END managed AI tooling ignore block"

AI_ITEMS=(
  # AI agent platforms
  ".claude"
  ".codex"
  ".augment"
  ".devin"
  ".bolt"
  ".v0"
  ".replit"
  # AI-enhanced IDEs
  ".cursor"
  ".windsurf"
  ".trae"
  ".kiro"
  ".junie"
  ".aide"
  # AI coding assistants
  ".cline"
  ".roo"
  ".continue"
  ".cody"
  ".aider"
  ".copilot"
  ".tabnine"
  ".codeium"
  ".gemini"
  ".amazonq"
  # Repo-specific AI tooling mirrors
  ".codebuddy"
  ".qoder"
  "skills"
  # Config and rules files
  "openspec"
  "skills-lock.json"
  "AGENTS.md"
  ".cursorrules"
  ".cursorignore"
  ".windsurfrules"
  ".clinerules"
  ".roomodes"
  ".aider.conf.yml"
  ".aiderignore"
)

die() {
  printf '%s\n' "$*" >&2
  exit 1
}

require_branch() {
  local branch="$1"
  git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$branch" \
    || die "Local branch '$branch' does not exist."
}

ensure_gitignore_block() {
  local gitignore_path="$1/.gitignore"

  if [[ -f "$gitignore_path" ]] && grep -Fqx "$GITIGNORE_BEGIN" "$gitignore_path"; then
    return
  fi

  if [[ -f "$gitignore_path" && -s "$gitignore_path" ]]; then
    printf '\n' >> "$gitignore_path"
  fi

  cat >> "$gitignore_path" <<EOF
$GITIGNORE_BEGIN
# AI tooling (kept on $SOURCE_BRANCH, excluded from $TARGET_BRANCH)

# AI Agent Platforms
.claude/
.codex/
.augment/
.devin/
.bolt/
.v0/
.replit/

# AI-Enhanced IDEs
.cursor/
.windsurf/
.trae/
.kiro/
.junie/
.aide/

# AI Coding Assistants
.cline/
.roo/
.continue/
.cody/
.aider/
.copilot/
.tabnine/
.codeium/
.gemini/
.amazonq/

# Repo-Specific AI Tooling Mirrors
.codebuddy/
.qoder/
skills/

# Config & Rules Files
openspec/
skills-lock.json
AGENTS.md
.cursorrules
.cursorignore
.windsurfrules
.clinerules
.roomodes
.aider.conf.yml
.aiderignore
$GITIGNORE_END
EOF
}

remove_ai_items() {
  local worktree="$1"
  local item

  for item in "${AI_ITEMS[@]}"; do
    git -C "$worktree" rm -rf --ignore-unmatch -- "$item" >/dev/null 2>&1 || true
    rm -rf -- "$worktree/$item" 2>/dev/null || true
  done
}

remaining_conflicts() {
  local worktree="$1"
  git -C "$worktree" diff --name-only --diff-filter=U
}

require_branch "$SOURCE_BRANCH"
require_branch "$TARGET_BRANCH"

[[ "$SOURCE_BRANCH" != "$TARGET_BRANCH" ]] \
  || die "Source and target branches must be different."

[[ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]] \
  || die "Switch off '$TARGET_BRANCH' before running this script."

worktree_path="$(mktemp -d "${TMPDIR:-/tmp}/merge-to-main.XXXXXX")"
worktree_added=0
cleanup_mode="remove"

cleanup() {
  if [[ "$cleanup_mode" == "remove" ]]; then
    if [[ "$worktree_added" -eq 1 ]]; then
      git -C "$REPO_ROOT" worktree remove --force "$worktree_path" >/dev/null 2>&1 || true
    fi
    rm -rf "$worktree_path" >/dev/null 2>&1 || true
    return
  fi

  printf 'Temporary worktree kept at %s\n' "$worktree_path" >&2
}

trap cleanup EXIT

git -C "$REPO_ROOT" worktree add "$worktree_path" "$TARGET_BRANCH" >/dev/null
worktree_added=1

merge_failed=0
if ! git -C "$worktree_path" merge "$SOURCE_BRANCH" --no-commit --no-ff; then
  merge_failed=1
fi

if [[ ! -f "$(git -C "$worktree_path" rev-parse --git-path MERGE_HEAD)" ]]; then
  printf '%s is already up to date with %s.\n' "$TARGET_BRANCH" "$SOURCE_BRANCH"
  exit 0
fi

ensure_gitignore_block "$worktree_path"
git -C "$worktree_path" add .gitignore
remove_ai_items "$worktree_path"

unresolved_paths="$(remaining_conflicts "$worktree_path")"
if [[ -n "$unresolved_paths" ]]; then
  git -C "$worktree_path" merge --abort >/dev/null 2>&1 || true
  printf 'Unresolved merge conflicts remain after AI cleanup:\n%s\n' "$unresolved_paths" >&2
  die "Resolve those conflicts manually and retry."
fi

if [[ "$merge_failed" -eq 1 ]]; then
  printf 'Resolved merge conflicts that only affected excluded AI tooling files.\n'
fi

if git -C "$worktree_path" diff --cached --quiet; then
  git -C "$worktree_path" merge --abort >/dev/null 2>&1 || true
  printf 'No non-AI changes to merge from %s into %s.\n' "$SOURCE_BRANCH" "$TARGET_BRANCH"
  exit 0
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  printf 'Dry run staged changes for %s <- %s:\n' "$TARGET_BRANCH" "$SOURCE_BRANCH"
  git -C "$worktree_path" diff --cached --name-status
  git -C "$worktree_path" merge --abort >/dev/null 2>&1 || true
  exit 0
fi

git -C "$worktree_path" commit -m "merge $SOURCE_BRANCH into $TARGET_BRANCH (AI tooling excluded)" >/dev/null

printf 'Created clean merge commit on %s from %s.\n' "$TARGET_BRANCH" "$SOURCE_BRANCH"
printf 'Inspect with: git log --oneline %s -1\n' "$TARGET_BRANCH"
printf 'Push when ready: git push origin %s\n' "$TARGET_BRANCH"
