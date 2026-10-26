#!/usr/bin/env bash
# Applies the blueprint's changes between the version in .blueprint-version and a newer release (default: the
# newest) to this project, as a 3-way merge: docs/UPGRADE.md. Projects created from the GitHub template share no
# history with the blueprint, so the diff between two blueprint tags is applied instead of merging them.
# Usage: scripts/blueprint-upgrade.sh [version]   (e.g. 1.2.0 or v1.2.0)
# BLUEPRINT_REMOTE overrides the blueprint repository URL (a fork, or a local path for a dry run).
# Does not write .blueprint-version: that follows the Definition of Done (blueprint-upgrade skill).
set -euo pipefail

url=${BLUEPRINT_REMOTE:-https://github.com/mmartofel/crud-ui-blueprint.git}
# Paths the blueprint has but the project owns (docs/UPGRADE.md "What an upgrade touches"). Resource features,
# locales and specs need no entry: the blueprint has none.
excludes=(contract package-lock.json e2e/__screenshots__ tasks CHANGELOG.md .blueprint-version)

die() { echo "blueprint-upgrade: $*" >&2; exit 1; }

cd "$(git rev-parse --show-toplevel)"
[[ -f .blueprint-version ]] || die "no .blueprint-version. In the blueprint itself there is nothing to upgrade; a
project created before versioning records 0.9.0 (docs/UPGRADE.md)."
[[ -z "$(git status --porcelain)" ]] || die "commit or stash your changes first (the upgrade must be reviewable on its own)."
from=$(tr -d '[:space:]v' < .blueprint-version)

# Blueprint tags go to their own namespace so they never clash with the project's own release tags.
git remote get-url blueprint >/dev/null 2>&1 || git remote add --no-tags blueprint "$url"
git fetch --quiet --no-tags blueprint '+refs/tags/v*:refs/blueprint-tags/v*'

if [[ $# -gt 0 ]]; then
  to=${1#v}
else
  to=$(git for-each-ref --sort=-v:refname --count=1 --format='%(refname:lstrip=2)' 'refs/blueprint-tags/v*')
  to=${to#v}
fi
from_ref=refs/blueprint-tags/v$from
to_ref=refs/blueprint-tags/v$to
git rev-parse --quiet --verify "$from_ref" >/dev/null || die "the blueprint has no tag v$from (.blueprint-version)."
git rev-parse --quiet --verify "$to_ref" >/dev/null || die "the blueprint has no tag v$to."
[[ "$from" != "$to" && "$(printf '%s\n' "$from" "$to" | sort -V | tail -1)" == "$to" ]] \
  || die "already at v$from (target v$to)."

echo "Blueprint v$from -> v$to"
[[ "${from%%.*}" != "${to%%.*}" ]] && echo "MAJOR upgrade: apply the Migration lines below by hand."
echo
# The target's changelog, newest first, down to the recorded version.
git show "$to_ref:CHANGELOG.md" | awk -v from="$from" '
  /^## \[/ { v = substr($2, 2, length($2) - 2); if (v == from) exit; show = (v != "Unreleased") }
  /^\[[^]]+\]: / { exit }
  show'

patch=$(git rev-parse --git-path blueprint-upgrade.patch)
git diff --binary "$from_ref" "$to_ref" -- . "${excludes[@]/#/:(exclude)}" > "$patch"
echo "Applying $(git apply --numstat "$patch" | wc -l | tr -d ' ') changed files ($patch)"
# Only conflicts and errors are worth reading; git reports every file.
set +e
git apply --3way --index "$patch" 2>&1 | grep -v -e '^Falling back to direct application' -e ' cleanly\.$'
applied=${PIPESTATUS[0]}
set -e
if [[ $applied -eq 0 ]]; then
  echo "Applied without conflicts."
else
  conflicts=$(git diff --name-only --diff-filter=U)
  [[ -n "$conflicts" ]] || die "the patch did not apply (see the errors above); nothing was changed."
  echo "Conflicts to resolve (docs/UPGRADE.md):"
  printf '  %s\n' $conflicts
fi
echo "Next: resolve conflicts, npm install, Definition of Done, then write $to to .blueprint-version."
