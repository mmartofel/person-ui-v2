# Lessons

Patterns learned from user corrections. Review at session start; add a rule after every correction.

<!-- Format:
## <short title>
- **Mistake:** what went wrong
- **Rule:** what to do instead
-->

## Commit a subset only from a clean index
- **Mistake:** `blueprint-upgrade.sh` stages its changes; `git add contract src/api/generated && git commit` then
  committed the whole upgrade under "Pull Person API".
- **Rule:** before committing a subset, check `git diff --cached --name-only`; commit it with
  `git commit -- <paths>` or unstage the rest first.
