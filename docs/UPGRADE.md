# Upgrading a project from the blueprint

A project created with `gh repo create --template` starts as a copy of the blueprint with no shared git history, so
it never receives later fixes by itself and the blueprint cannot simply be merged in. Instead, the project records
the blueprint version it was made from in `.blueprint-version` (written by `crud-ui-init`). An upgrade then applies
the blueprint's diff between that version and a newer release as a 3-way merge. Fetching the blueprint brings in the
old files, so git merges the blueprint's changes with the project's own edits line by line, exactly as a merge
would, and marks conflicts the same way.

In Claude Code, say "upgrade from the blueprint". The `blueprint-upgrade` skill runs the steps below and the
Definition of Done. By hand:

```bash
scripts/blueprint-upgrade.sh            # to the newest release; or e.g. scripts/blueprint-upgrade.sh 1.2.0
```

The script needs a clean working tree. It adds the remote `blueprint` (`BLUEPRINT_REMOTE` overrides the URL, e.g. for a
fork) and fetches its release tags under `refs/blueprint-tags/`, so they never clash with the project's own tags.
It then prints the CHANGELOG entries between the two versions, applies the diff to the index and lists the
conflicts. The patch is kept in `.git/blueprint-upgrade.patch`.

## After the script
1. **Read the CHANGELOG output.** A MAJOR version has "Migration" lines: changes the project must make by hand,
   usually in `src/features/` following `.claude/skills/crud-resource/references/examples/`.
2. **Resolve conflicts** (`git diff --name-only --diff-filter=U`) with the rules in the table below.
3. `npm install` (the lockfile is the project's own and is regenerated, never patched); `npm run api:generate` when
   orval or `orval.config.ts` changed (then `npm run contract:check` must pass).
4. `npm run test:visual:update` and review the new baselines: the project's gallery uses its own brand, so the
   blueprint's screenshots are never taken over.
5. The full Definition of Done in `CLAUDE.md`, including `npm run e2e` against the API.
6. Write the new version into `.blueprint-version` and commit everything as one commit, `Upgrade blueprint to vX.Y.Z`.

To undo an upgrade before committing: `git reset --hard`.

## What an upgrade touches
| Class | Paths | On conflict |
|---|---|---|
| Generic: the blueprint's code | `src/components/{app,ui}`, `src/hooks`, `src/manifest`, `src/auth`, `src/i18n`, `src/lib`, `src/api/{fetcher,queryClient}.ts`, `src/config.ts`, `src/gallery`, `src/test`, `src/main.tsx`, `src/index.css`, `.claude/`, `docs/API-*.md`, `docs/DESIGN.md`, `docs/UPGRADE.md`, `e2e/support`, `e2e/gallery*.spec.ts`, `e2e/auth.setup.ts`, `scripts/`, `docker/`, `Dockerfile`, tool configs (`vite`, `tsconfig*`, `eslint`, `playwright`, `orval`, `components.json`) | Take the blueprint's side, then re-apply a local change only if the project needs it. A local change to generic code is better sent back to the blueprint. |
| Shared: blueprint structure, project values | `CLAUDE.md`, `README.md`, `docs/PATTERNS.md`, `package.json`, `src/router.tsx`, `src/api/sources.ts`, `src/locales/*/{common,enums}.json`, `src/styles/theme.css`, `ui-manifest.yaml`, `e2e/shell.spec.ts`, `.circleci/`, `k8s/`, `skaffold.yaml`, `.env.example`, `renovate.json`, `.mcp.json` | Keep both: the blueprint's new structure, keys and rules, and the project's names, routes, resources, role labels, brand colour and settings. |
| Project-owned: never changed | `src/features/`, `contract/`, `src/api/generated/`, resource locale files, `e2e/<resource>.spec.ts`, `e2e/__screenshots__/`, `package-lock.json`, `tasks/`, `.blueprint-version` and the project's `CHANGELOG.md` | Not in the patch. |

The blueprint has no resources, so its diff never touches feature code, resource locales or resource specs. The
script excludes the project-owned paths the blueprint does have (`contract`, `package-lock.json`,
`e2e/__screenshots__`, `tasks`, `CHANGELOG.md`, `.blueprint-version`).

## Several versions at once
MINOR and PATCH releases can be skipped over in one step. Cross MAJOR versions one at a time
(`scripts/blueprint-upgrade.sh 2.0.0`, finish and commit, then the next): each has its own Migration lines.

## Projects created before versioning
A project made before v1.0.0 (the blueprint at tag `stable-1.0`) has no `.blueprint-version`. Write `0.9.0` into it
(the same commit, tagged `v0.9.0`), commit, and upgrade. Its first upgrade is MAJOR: list and detail pages move to
`ResourceList` / `ResourceDetail` (CHANGELOG 1.0.0 "Migration").

## For blueprint maintainers
Every change to `.claude/`, `docs/API-*.md` or generic code gets a line under `[Unreleased]` in `CHANGELOG.md`,
with a "Migration" line when a project must act. A release renames `[Unreleased]` to `[x.y.z] - <date>`, adds the
compare link, and tags the commit `vx.y.z`. Projects only see tagged releases.
