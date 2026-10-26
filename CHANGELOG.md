# Changelog

Changes to the blueprint that projects created from it can take over with the `blueprint-upgrade` skill
(`docs/UPGRADE.md`). The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/):

- **MAJOR**: a project must adapt by hand: a manifest key renamed or removed, a generic component or helper removed
  or changed in a way feature code notices, a new contract rule an API must meet. Each such change has a line under
  "Migration".
- **MINOR**: a new generic feature, manifest key or rule that existing projects need not act on.
- **PATCH**: fixes, dependency updates and docs.

Every change to `.claude/`, `docs/API-*.md` or generic code gets a line under `[Unreleased]`. A release renames that
section to the version and date and tags the commit `v<version>`.

## [Unreleased]

## [1.1.0] - 2026-10-26

Claude Code tooling (issue #1, step P3). No migration needed.

### Added
- Context7 MCP server in `.mcp.json` (current docs of the stack's libraries); `CLAUDE.md` asks to check it before
  using a library API not yet used in the repo.
- Hook `.claude/hooks/lint.sh`: ESLint on each edited TypeScript file, next to the typecheck.
- Evals in the skill-creator format for the `crud-resource` skill (`.claude/skills/crud-resource/evals/`) and the
  `contract-auditor` agent (`.claude/agents/evals/contract-auditor/`), on fixture contracts in
  `src/test/fixtures/contract/`; README "Skill evals" says how to run them after editing a skill.
- README "Claude Code setup" with the recommended plugins (`frontend-design`, `pr-review-toolkit`, `skill-creator`,
  `spring-boot-template` for API repos).
- `.claude/worktrees/` (Claude Code worktrees, e.g. eval runs) is ignored by git and ESLint; `eslint .` failed on them.

### Changed
- Renovate raises the ranges in `package.json` with each update (`rangeStrategy: bump`), so they name the tested
  minimum instead of moving only the lockfile.

### Fixed
- `contract-auditor` puts the per-resource verdict lines first, with nothing before them (found by its evals).

## [1.0.0] - 2026-10-26

The modern look, the production image and the upgrade path (issue #1, steps D1-P2).

### Added
- Theme tokens in `src/styles/theme.css`: one brand colour (calm blue) with tinted neutrals, layered surfaces in
  light and dark, `success`/`warning`/`info` status colours, radius, shadow and type scales; Inter Variable,
  self-hosted, with tabular numbers in tables and number inputs. Visual rules in `docs/DESIGN.md`.
- Dev-only component gallery at `/__gallery` on the persons/tasks fixtures (no env, API or login; not in the build).
- App shell on the shadcn Sidebar (collapsible to icons, sheet below `lg`, Cmd/Ctrl+B), app mark, breadcrumbs from
  the route and the manifest's `display`, user menu holding language, theme and logout.
- `ResourceList` and `ResourceDetail`: list card with toolbar, record count, active-filter chips, sticky header and a
  row menu for writers; detail with section cards and related lists in cards. `EmptyState` and layout-shaped
  skeletons. Form groups as section cards with a sticky action bar below `md`.
- Manifest: `detail.status` (a badge next to the record name); badge variants `success`, `warning`, `info`.
- `useDeleteRecord`: delete with confirmation shared by list and detail.
- Screenshot tests of every gallery section (`npm run test:visual`, Playwright image, docker or podman) and axe on
  the gallery and every e2e page (`expectAccessible`); CircleCI job `gallery`.
- `ui-reviewer` checks visual quality against `docs/DESIGN.md` and the gallery.
- Production image (`Dockerfile`, unprivileged nginx): runtime configuration in `/config.js` written from container
  environment variables, `/api` proxied to `API_UPSTREAM`, CSP and security headers; `k8s/`, `skaffold.yaml`,
  CircleCI job `image`.
- Blueprint versioning: this changelog, `.blueprint-version` written by `crud-ui-init`, `docs/UPGRADE.md`, the
  `blueprint-upgrade` skill and `scripts/blueprint-upgrade.sh`.
- Renovate (`renovate.json`): grouped weekly updates, automerge of dev dependency patches with green CI;
  `npm audit --audit-level=high` in the CircleCI job `build`.

### Changed
- OIDC settings are read through `src/config.ts` (`/config.js` in the image, `.env.local` in dev).
- `src/api/sources.ts`: every resource is registered and each line also carries `getKey` (the breadcrumbs use it).
- `crud-ui-init` asks for a brand colour, project name and image name.
- orval 8.45 (security fix in its dependencies).

### Removed
- `DetailList`, `LanguageSwitcher` and `ThemeToggle` (replaced by `ResourceDetail` and the user menu).

### Migration
- Rebuild each feature's list and detail pages on `ResourceList` / `ResourceDetail`, following
  `.claude/skills/crud-resource/references/examples/` (a list or detail page is about 35 lines).
- Add `getKey` to every line of `src/api/sources.ts` and register every resource there.
- Read OIDC settings only through `src/config.ts`; set `OIDC_*` and `API_UPSTREAM` for the image (README "Deploy").
- Regenerate the screenshot baselines (`npm run test:visual:update`) and add `expectAccessible` to resource specs.

## [0.9.0] - 2026-10-24

The blueprint before the modern look (also tagged `stable-1.0`): manifest-driven CRUD screens, OIDC login, Polish
and English, the `crud-ui-init` and `crud-resource` skills and the API kickstart. Projects created before versioning
record this version.

[Unreleased]: https://github.com/mmartofel/crud-ui-blueprint/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/mmartofel/crud-ui-blueprint/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/mmartofel/crud-ui-blueprint/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/mmartofel/crud-ui-blueprint/releases/tag/v0.9.0
