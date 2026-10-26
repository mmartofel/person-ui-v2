# Wiring a resource, file by file

Reference code: `references/examples/persons/feature/` (and `tasks/feature/` for relations, see
[examples/README.md](examples/README.md)). Copy it into `src/features/<key>/`, rename, and keep the structure. Everything not listed under
"Resource-specific code" below is generic and driven by `ui-manifest.yaml`; if a resource needs more, extend the
generic code and the manifest, not the feature folder.

Example below: resource key `orders`, tag `Orders`, record name `Order`.

## Renames

orval generates per tag into `src/api/generated/endpoints/<tag-lowercase>/`.

Rename with word boundaries (`person` must not touch `persons`, and longer names go first). BSD `sed` on macOS has
no `\b` and skips them silently; use `perl -pe 's/\bPersonDetail\b/OrderDetail/g'` or a short Python script, then
`grep -n -i person src/features/<key>/` must find nothing but the enum lines you change by hand.

| persons | orders | From |
|---|---|---|
| `useListPersons`, `useGetPerson`, `useCreatePerson`, `useUpdatePerson`, `useDeletePerson` | `useListOrders`, … | `endpoints/orders/orders.ts` |
| `getListPersonsQueryKey`, `getGetPersonQueryKey` | `getListOrdersQueryKey`, `getGetOrderQueryKey` | same file |
| `CreatePersonBody`, `UpdatePersonBody` | `CreateOrderBody`, `UpdateOrderBody` | `endpoints/orders/orders.zod.ts` |
| `PersonResponse`, `PersonCreateRequestGender` | `OrderResponse`, `OrderCreateRequest<Enum>` | `src/api/generated/model` |
| `ListPersonsStatus` (select filter values), `ListPersonsQueryParams` | `ListOrders<Param>`, `ListOrdersQueryParams` | `model`, `orders.zod.ts` |
| `getResource('persons')` | `getResource('orders')` | `src/manifest` |
| `PersonsListPage`, `PersonDetailPage`, `PersonCreatePage`, `PersonEditPage`, `personsRoutes` | `OrdersListPage`, … | file and export names |

## Feature files

| File | What it wires |
|---|---|
| `routes.tsx` | Lazy routes under `resource.route`. `RequireRole` with `permissions.read` around everything, `permissions.write` around `new` and `:id/edit`. |
| `<Resource>sListPage.tsx` | `useListState(resource, List<Resource>sQueryParams)` (the generated query schema validates filter values from the URL) → generated list hook with `list.apiParams` and `placeholderData: keepPreviousData` → `ResourceList` with `filterValues` (select filters, from `List<Resource>s<Param>`), `remove` (the generated delete mutation) and `onDeleted` (remove the detail query, invalidate the lists). `ResourceList` does the rest: header with New (writers), the toolbar card (search, filters, count, chips), states, table/cards with the row menu (writers), delete confirmation, paging, `clampPage`. |
| `<Resource>DetailPage.tsx` | `useIdParam` (bad id → `NotFoundPage`) → generated get hook → `ResourceDetail` with `remove` and `onDeleted` (same cache update as the list). `ResourceDetail` does the rest: 403/404 pages, states, back link, title with the `detail.status` badge, Edit/Delete (writers) with confirmation (a 404 counts as success, a 409 `in-use` gets its own toast), section cards, related lists. |
| `<Resource>FormPage.tsx` | Create and edit pages around `ResourceForm`. `useOnSaved` sets the detail cache and invalidates lists. Edit uses `UpdateBody.omit({ version: true })` as schema and sends `version` from `ResourceForm`'s `save(data, version)`; `reload` refetches for the stale-version dialog; its `DataState` loads with `FormSkeleton`. `enumValues` maps each enum field to the generated enum's values. |

## Registration (one line each)
- `src/manifest/index.ts`: add the key to `ResourceKey`.
- `src/api/sources.ts`: `<key>: { list, get, listKey, getKey }` from the generated client (relations, related lists,
  breadcrumbs).
- `src/manifest/icons.ts`: add a new lucide icon name used by `nav.icon`.
- `src/i18n/resources.ts`: import `src/locales/{pl,en}/<key>.json` and add it to both languages.
- `src/router.tsx`: spread `<key>Routes` into the root children before the `*` route.
- Navigation and breadcrumbs need no change: `AppNav` lists every manifest resource the user can read, and
  `AppBreadcrumbs` names records by `display` through the `sources` line (`getKey`).

## Shared pieces (use, do not copy)

| Need | Use |
|---|---|
| List page, detail page | `list/ResourceList`, `components/app/ResourceDetail` (everything but the generated hooks and the cache update) |
| Page title + actions | `components/app/PageHeader` (also sets `document.title`; `badge` slot) |
| Loading / empty / error with retry | `components/app/DataState` (`empty` takes an `EmptyState`: icon, title, text, action), `list/ListSkeleton`, `DetailSkeleton`, `form/FormSkeleton` |
| Delete with confirmation | `useDeleteRecord` from `components/app/useDeleteRecord` (used by both composites) |
| 403/404 from a query error | `components/app/errorPageFor` |
| URL list state, back-to-list link | `list/listState` (`useListState`, `useListHref`) |
| Search, filters, table/cards, paging | `list/SearchInput`, `list/ListFilters`, `list/DataTable`, `list/Pagination` |
| Detail fields | `components/app/DetailSections` (section cards from `detailSections`: main fields, one per nested object, `form.readOnly` metadata; formatting via `formatValue`) |
| Country picker | `components/app/CountrySelect` (`input: country`); never put country names in locale files |
| Relation picker, related records | `components/app/RelationSelect` (`input: relation`), `RelatedLists` from `components/app/RelatedList` (keep it in every detail page; it renders nothing without `detail.related`) |
| Delete failure toast | `toastDeleteError(t, error, name)` from `components/app/deleteError` (`in-use` gets its own message) |
| Nested values | `getPath`, `objectFields`, `formFieldPaths` from `@/manifest` |
| Form | `form/ResourceForm` (fields, resolver, server errors, stale reload, unsaved guard, toasts) |
| Confirmation dialog | `components/app/ConfirmDialog` |
| Roles | `useRoles` from `@/auth`, `canRead`/`canWrite` from `@/manifest` |
| Record name | `formatDisplay(resource.display, record)` |
| Labels built at runtime | `tDynamic`, `fieldLabelKey`, `enumLabelKey`, `groupLabelKey`, `filterLabelKey` from `@/i18n/dynamic` |
| Route id | `useIdParam` from `@/lib/ids` |
| HTTP, errors | `src/api/fetcher.ts` (`ApiError`, `isApiError`); never call `fetch` directly |

## Resource-specific code (the only allowed kinds)
- The feature files above: they wire per-resource generated hooks to shared components (type safety needs the
  real names).
- `useOnSaved` and the `remove` / `onDeleted` props: cache updates need the per-resource query key getters.
- `enumValues` (form) and `filterValues` (list filters): allowed enum values come from the generated model; the
  manifest only names the i18n enum.
- The generated `List<Resource>sQueryParams` passed to `useListState`.
- `UpdateBody.omit({ version: true })`.
- Registration lines, locale files and enum labels.

Anything else (a new input type, column format, filter, relation) goes into `src/components/app/` or
`src/manifest/`, driven by a new manifest key, with a unit test.

## Updating an existing resource after a contract change
Usually touched:
- `src/api/generated/` (regenerated, committed with `contract/openapi.json`; `npm run contract:check` passes);
- `ui-manifest.yaml` (columns, `detail.fields`, `form.groups`/`fields`, `list.filters`);
- `src/locales/{pl,en}/<key>.json` (`fields.*`, nested `fields.<object>.*`, `groups.<object>`, `filters.<param>`),
  `enums.json` (new enum values), `common.json` (`common.validation.<code>` for new error codes);
- `enumValues` in `<Resource>FormPage.tsx` for a new enum field, `filterValues` in the list page for a new select filter;
- New query params in the contract are filters only once the manifest's `list.filters` names them.
- A contract `default` needs no UI code: the form starts with it.
- `contract:pull` brings the whole contract: other tags' changes are regenerated too, but are built in their own run;
- A version-only change (an API bug fix) still regenerates every file header: commit them with the contract, or
  `npm run contract:check` fails in CI;
- `e2e/<key>.spec.ts` for the new fields and their error cases.

A removed field must leave the manifest, the locales and the tests; `npm test` and `npm run typecheck` find leftovers.

## Tests
- E2E: `test.use({ storageState: authFile('writer') })` (`'reader'` for read-only checks) and `openAs`; create data through the API with a unique tag
  (`callApi`, `deleteViaApi`, `unique`, `expectListParams` from `e2e/support/data.ts`); clean up in `afterEach`, newest
  first (a record referenced by another must go last), even after a failure. Scope picker searches to their dialog:
  the list's own search box has the same placeholder. Never
  edit or delete existing records. When a relation input's label is a prefix of the related resource's title ("Author" / "Authors"),
  wait for the picker dialog to be hidden before asserting the input: its search box matches the same name. After adding fields, re-run the old tests: text matchers shared by many fields
  (e.g. "Not provided") become ambiguous; assert next to the field's label instead.
- Quick list changes in a row (filter, chip, sort, clear): the URL changes before the page re-renders, and the next
  change starts from the params of the last render. Between two changes wait for the rendered state (the chip, the
  header's `aria-sort`, the input value, "Clear filters" hidden), not only `expectListParams`.
- Accessibility: `expectAccessible(page)` (`e2e/support/a11y.ts`, axe; serious and critical violations fail) on every
  distinct page the spec opens (list, form, detail, empty list, reader view) and `expectAccessible(page, '[role=alertdialog]')`
  on the delete confirmation, as in the examples.
- Unit tests only for new generic code; `src/i18n/locales.test.ts` checks labels the manifest needs.

## The look
A resource gets the look from the generic components (`ResourceList`, `ResourceDetail`, `ResourceForm`, `DataState`):
the feature folder has no markup or classes of its own, so it looks like `/__gallery`. Compare each screen with its
gallery section at 375, 768 and 1440 px in light and dark (`docs/DESIGN.md`). If it needs something the gallery does
not show, extend the generic component, add the case to `src/gallery/GalleryPage.tsx` and update the screenshot
baselines (`npm run test:visual:update`, README "Visual regression").
