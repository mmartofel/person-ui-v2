#!/usr/bin/env bash
# PostToolUse hook: after Claude edits a .ts/.tsx file, run ESLint on that file (next to typecheck.sh).
# Exit code 2 sends the errors back to Claude so it fixes them before moving on; warnings pass, as in CI.
# Does nothing until package.json has a "lint" script (i.e. before the scaffold exists).

input=$(cat)
file=$(printf '%s' "$input" | node -e '
  let d = "";
  process.stdin.on("data", c => (d += c)).on("end", () => {
    try { process.stdout.write(JSON.parse(d).tool_input?.file_path ?? ""); } catch {}
  });')

case "$file" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR" || exit 0
grep -q '"lint"' package.json 2>/dev/null || exit 0
[ -x node_modules/.bin/eslint ] || exit 0

if ! out=$(node_modules/.bin/eslint --no-warn-ignored "$file" 2>&1); then
  echo "ESLint failed after editing $file:" >&2
  printf '%s\n' "$out" | head -40 >&2
  exit 2
fi
exit 0
