---
name: blueprint-upgrade
description: Takes over a newer crud-ui-blueprint release into a project created from the template - generic components, skills, agents, API docs, tooling - while keeping the project's resources, theme and locales. Use when the user says "upgrade from the blueprint", "pull blueprint fixes", "update to blueprint vX.Y.Z", or asks which blueprint version the project is on.
---

# blueprint-upgrade

Applies the blueprint's changes between the version in `.blueprint-version` and a newer release as a 3-way merge,
then proves the project still works. The method, the path classes and the conflict rules are in `docs/UPGRADE.md`;
read it first. This skill runs in a project, never in the blueprint itself (no `.blueprint-version`).

## 1. Prepare
- [ ] `.blueprint-version` exists. If it is missing in a project made before versioning, propose `0.9.0`
      (`docs/UPGRADE.md`) and ask before writing it.
- [ ] The working tree is clean. Ask the user to commit or stash; never stash for them.
- [ ] Target: the version the user named, else the newest release. Crossing a MAJOR version goes one MAJOR at a time.

## 2. Apply
- [ ] `scripts/blueprint-upgrade.sh [version]`. Show the user the CHANGELOG part of the output.
- [ ] **MAJOR upgrade: stop.** List the Migration lines and what each means for this project's resources
      (`ui-manifest.yaml`, `src/features/`), and wait for the user's go-ahead.
- [ ] Resolve every conflict (`git diff --name-only --diff-filter=U`) by the table in `docs/UPGRADE.md`: generic
      paths take the blueprint's side, shared paths keep both (blueprint structure, project values). Name each
      local change to generic code that you dropped or kept, so the user can send it back to the blueprint.
- [ ] `npm install`; `npm run api:generate` when orval or `orval.config.ts` changed.
- [ ] Migration lines: apply them to every resource the way the updated
      `.claude/skills/crud-resource/references/examples/` and `references/wiring.md` do it.
- [ ] Check the files the blueprint changed that this project also customised: `CLAUDE.md` (keep the project's
      own rules), `README.md`, `src/styles/theme.css` (keep the brand; new tokens follow `docs/DESIGN.md`).

## 3. Verify
- [ ] `npm run test:visual:update`; review the changed baselines (expected: the blueprint's look changes, with the
      project's brand).
- [ ] The Definition of Done in `CLAUDE.md` for the whole app: every resource screen opened at 375/768/1440 px as
      both users in every language, `ui-reviewer`, `npm run e2e`, gallery and visual tests.
- [ ] A failure caused by the blueprint (not by this project) is reported to the user as a blueprint issue: symptom,
      blueprint version, the fix made here.

## 4. Finish
- [ ] Write the target version (without `v`) into `.blueprint-version`.
- [ ] Summary for the user: versions, CHANGELOG highlights, conflicts and how each was resolved, migrations done,
      open points.
- [ ] Commit only when asked, everything in one commit: `Upgrade blueprint to vX.Y.Z`.
