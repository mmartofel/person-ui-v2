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

## OpenShift runtime label for Spring Boot
- **Mistake:** proposed `app.openshift.io/runtime=spring-boot` for the Spring Boot API.
- **Rule:** label Spring Boot workloads `app.openshift.io/runtime=spring`.

## OpenShift runtime label for Keycloak
- **Mistake:** proposed `app.openshift.io/runtime=sso` (the Red Hat SSO icon) for Keycloak.
- **Rule:** label Keycloak workloads `app.openshift.io/runtime=keycloak`. The console (4.22) has no `keycloak` icon, so
  also set the annotation `app.openshift.io/custom-icon` to the Keycloak logo as a `data:image/svg+xml;base64,` URL
  (the console takes any URL there before the runtime label). Check a runtime value against the console's icon list
  (`catalog-item-icon.tsx`) before proposing it.
