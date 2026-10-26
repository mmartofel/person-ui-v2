# Reference resources

Two complete resources from the app this blueprint was extracted from (Person UI, contract `Person API 3.4.1`).
Copy from them, never import them: they reference generated code (`@/api/generated/...`) that only exists in that
app. Every key and pattern the generic code supports is used in one of them.

| Example | Shows |
|---|---|
| `persons/` | the simple resource: list with search, sort, paging and filters (select, date, country), a badge column, the detail header's status badge (`detail.status`), a nested object (`address`: its own section card in the form and the detail), a date range rule (`notBefore`), a contract default, related records under the detail (`detail.related`) |
| `tasks/` | relations: a relation input (`input: relation`, `from`), a relation column linking to the other record, boolean and relation filters, number / textarea / checkbox inputs, a boolean header badge (`detail.status: done`), read-only server fields (`form.readOnly`, `formats`; the detail's metadata card) |

The list and detail pages are thin: they pass the generated hooks to `ResourceList` and `ResourceDetail`, which build
the screens from the manifest; they look like the gallery (`/__gallery`).

Each folder has:

| File | Goes to |
|---|---|
| `manifest.yaml` | the `resources.<key>` entry of `ui-manifest.yaml` |
| `feature/*.tsx` | `src/features/<key>/` (renamed, see `../wiring.md`) |
| `locales/{pl,en}/<key>.json` | `src/locales/{pl,en}/<key>.json`, registered in `src/i18n/resources.ts` |
| `locales/{pl,en}/enums.json` | merged into `src/locales/{pl,en}/enums.json` |
| `<key>.spec.ts` | `e2e/<key>.spec.ts`; the specs use `e2e/support/data.ts` and the e2e users `writer` / `reader` |

The `src/api/sources.ts` lines were:

```ts
persons: { list: listPersons, get: getPerson, listKey: getListPersonsQueryKey, getKey: getGetPersonQueryKey },
tasks: { list: listTasks, get: getTask, listKey: getListTasksQueryKey, getKey: getGetTaskQueryKey },
```

and the routes in `src/router.tsx`: `...personsRoutes, ...tasksRoutes,` before the `*` route.

Persons is built first (tasks points to it), but its manifest names tasks in `detail.related` and one persons test
creates a task: leave both out until tasks is built.

With persons as the first resource, the `HOME` lines of `e2e/shell.spec.ts` became:

```ts
// the writer's home page
await expect(page).toHaveURL(/\/persons/)
await expect(page.getByRole('heading', { level: 1, name: 'Persons' })).toBeVisible()
// the language switch (twice)
await expect(page.getByRole('heading', { level: 1, name: 'Osoby' })).toBeVisible()
// the sign-in callback
await expect(page).toHaveURL('/persons')
// the mobile menu sheet: navigation lists the resources, a link closes the sheet
await expect(dialog.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
await dialog.getByRole('link', { name: 'Persons' }).click()
await expect(dialog).toBeHidden()
await expect(page).toHaveURL('/persons')
```
