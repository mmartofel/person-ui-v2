# Design

The reference for every screen and for the `ui-reviewer` agent. Every token is defined in `src/styles/theme.css`, and
`npm run dev` shows them all at http://localhost:5173/__gallery. The gallery needs no `.env.local`, API or login.
The gallery is locked by screenshot tests (every section at 375, 768 and 1440 px, light and dark) and axe checks,
in CI too: a change to the look updates the baselines on purpose (`npm run test:visual:update`, README "Visual
regression"). Every resource screen must look like its gallery section.

## Direction
A calm, modern business admin in the spirit of Linear, Vercel and Stripe dashboards. People open it to find, read
and change records quickly, often for hours, so readability and density matter more than decoration. The page is a
quiet, slightly blue-tinted grey. Content sits on white cards, and navigation sits on a slightly deeper surface.
Calm blue is the only colour that is not a status: it marks what can be clicked or is selected (the primary action,
links, the active nav item, focus). Status colours appear only where a value has a status. Structure comes from
borders and spacing, not shadows or gradients.

## Tokens
Use the Tailwind utilities (`bg-card`, `text-muted-foreground`, `border-border`...), never raw colours or arbitrary
values. Both themes come from the same tokens: dark mode redefines them under `.dark`.

| Token | Use |
|---|---|
| `background` | The page behind everything. |
| `sidebar` | Navigation surface (with `sidebar-foreground`, `sidebar-accent` for the hovered/active item, `sidebar-border`). |
| `card` | Every content surface: lists, details, forms, related lists. |
| `popover` | Everything that floats: menus, selects, popovers (`shadow-md`), dialogs and sheets (`shadow-lg`). |
| `foreground` | Body text and values. |
| `muted` / `muted-foreground` | Quiet fills (skeletons, inactive chips) / secondary text: labels, captions, helper text, empty values. |
| `accent` / `accent-foreground` | Hover and highlighted rows or items. Never for meaning. |
| `primary` / `primary-foreground` | The one primary action per view, links, active item, checked controls. |
| `secondary` | A neutral filled button or badge. |
| `border`, `input` | Hairlines between and around surfaces; control outlines (`input` is a step darker, about 1.5:1: a decision, since every control also has a visible label; see Accessibility). |
| `ring` | Focus ring (`focus-visible:ring-[3px] ring-ring`), at least 3:1 against every surface. |
| `destructive` | Delete, errors, a negative status. |
| `success`, `warning`, `info` | Positive, needs attention, neutral information. Each has a `-foreground` for text on a solid fill. |
| `chart-1..5` | Charts only. |

The overlay behind dialogs and sheets is shadcn's `bg-black/50`, the one raw colour allowed: it dims every theme
the same way.

Contrast was checked with a script (oklch to sRGB, WCAG 2.x). Every text pair, including each status colour as text
on a card and on its own 12% tint, is at least 4.5:1 in both themes. The focus ring is at least 4.1:1 in light and
7:1 in dark against every surface. Run the same check after changing a colour (see "Changing the brand").

## Typography
Inter Variable, self-hosted (`@fontsource-variable/inter`, no CDN), with alternates `cv05` and `cv08` so `l`, `I`
and `1` stay apart in record data.

| Role | Utility | Size / line | Weight |
|---|---|---|---|
| Page title (one `h1` per page) | `text-page-title` | 24 / 32, tracking -0.018em | 600 |
| Section title (card titles, `h2`) | `text-section-title` | 16 / 24 | 600 |
| Body, table cells, labels | `text-sm` | 14 / 20 | 400; 500 for labels and emphasis |
| Caption (helper text, metadata) | `text-caption` | 12 / 16 | 400, `text-muted-foreground` |

The gallery page itself (`src/gallery/`) is a developer tool: several `h1`s (one per demo page header) and English
chrome are allowed there, never in the app.

Inputs use `text-base` below `md`, so iOS does not zoom, and `text-sm` from `md`. Numbers in tables (`TableCell`) and
number inputs use `tabular-nums`, and numeric columns are right-aligned. Use sentence case everywhere: no all-caps
labels, no eyebrow text above headings.

Dialog titles use `text-section-title`.

## Accessibility
- Text at least 4.5:1 and focus rings (`ring-ring`, 3 px, full strength; never a `/20`-`/50` tint) at least 3:1
  on every surface, in both themes.
- Control outlines (`--input`) stay light, about 1.5:1, as shadcn's: every control has a visible label, focus
  is shown by the ring, and errors by text. A project that needs WCAG 1.4.11 for outlines darkens `--input`
  to about L 0.65 (light) / 0.5 (dark).
- Status is never colour alone: badges carry their label, errors carry text and an icon.

## Spacing and density
- 4 px grid (Tailwind spacing). Inside a card: `gap-4` to `gap-6` between fields, `p-6` padding (`CardContent`).
  Between page sections: `gap-6`, and `mt-6` for cards after the main one.
- Rows: table rows about 44-48 px (`p-2` cells, `text-sm`); controls are `h-9` from `md` and 44 px on touch.
- Line length up to about 80 characters for prose (`max-w-prose`).
- Prefer showing more data at once to adding whitespace. Do not add wrappers, dividers or icons that carry no
  information.

## Elevation
- Resting surfaces (cards, tables, inputs) are separated by a 1 px `border` and their surface colour. `shadow-xs` and
  `shadow-sm` are a hairline lift at most and are optional.
- Only layers that float above the page get a real shadow: `shadow-md` for menus, selects and popovers, `shadow-lg`
  for dialogs and sheets.
- Never use the same soft shadow under every card, coloured shadows or gradients.
- Radius: `--radius` 0.5rem. Controls and badges `rounded-md`/`rounded-full`, cards `rounded-xl`, menus `rounded-md`.

## App shell
- **Sidebar** (`AppSidebar`, shadcn Sidebar, `bg-sidebar` with a `sidebar-border` edge): from `lg` it sits beside the
  content and collapses to 60 px of icons (tooltips name them); the state is remembered (`localStorage` `sidebar`)
  and Ctrl/⌘+B toggles it. Below `lg` it is an off-canvas sheet behind the header's menu button.
- **Header of the sidebar**: the app mark, the initials of `app.name` in `bg-sidebar-primary`, and the name.
  **Content**: the navigation, the active item in `sidebar-accent`. **Footer**: the user menu (initials avatar, name,
  role labels), which holds language, theme and logout: submenus from `lg`, listed in the menu itself in the narrow
  sheet. Tooltips appear only on the icons of the collapsed sidebar.
- **Header** (`h-14`, `bg-background`, bottom border, sticky): the sidebar toggle and the breadcrumbs, list › record
  (by the manifest's `display`) › edit. Below `md` only the last two crumbs. Page actions stay in `PageHeader`.
- **Content**: `px-4 py-6`, `md:px-6`, `lg:px-8`, centred with a max width by page kind: lists `max-w-7xl`,
  detail `max-w-6xl`, forms `max-w-4xl`. A new page opens at the top, back and forward restore the position
  (`ScrollRestoration` in `AppShell`). A list's search, sort, filters and page size keep it; another page of the list
  scrolls the list card to the top and focuses it (a region named after the resource), so keyboard paging never leaves
  focus off screen. Mobile cards opt out of scroll anchoring, so new results do not jump the page.
- **Footer** (`AppFooter`, `bg-background`, top border): sticks to the bottom of the screen, so it is always in
  view, one line high (`--app-footer-height` in `src/index.css`: 52 px below `md`, 40 px from `md`); the form's mobile
  action bar and the toasts sit above it. The document's scroll padding (same file) keeps a focused element clear of
  the header, the footer and, below `md`, the form's action bar; below `md` a focused field scrolls clear with its
  label and message (`data-form-field`). The content's horizontal padding, `text-caption text-muted-foreground`. Left the blueprint release, right the API
  version (marked "contract" when the API does not report its own) and the API status: a 8 px dot (`success`,
  `warning`, `destructive`; `muted-foreground` while checking) with the status name, so colour is never the only
  signal. It is a ghost button (44 px below `md`) that opens a popover with the status, the problem, the running and
  contract versions and the time of the last check; the popover keeps the 16 px page gutter on narrow screens. The
  blueprint release truncates first when the line is too narrow.
- Menu buttons are 44 px high, also as icons, so the sidebar works on touch screens from `lg` too; the sheet's open
  and close buttons and the breadcrumb links are 44 px wherever they are the touch path (below `lg` / `md`).

## Resource screens
Built by the generic components from the manifest; a feature folder only passes the generated hooks. The gallery shows
each one with the persons and tasks fixtures.

- **List** (`ResourceList`): the page header with New (writers), then one card. Its toolbar (bottom border) holds the
  search, the record count (from `md`), the filters (a row from `md`, a sheet below) and the active filters as
  removable chips ("Status: Available ×", `bg-secondary`, `rounded-full`). Below it the table (from `md`) or a
  divided list of card rows, then paging in the card's footer. The table fills the card edge to edge; its first and
  last cells line up with the card padding. Its frame is at most the viewport height, scrolls both ways and keeps
  the header (`text-muted-foreground`, an inset hairline) sticky. Rows highlight in `accent/60` on hover. Number
  columns (`fieldFormat` `number`) are right-aligned with tabular figures. Writers get a row menu (`…`, the last
  column; beside each card below `md`): View, Edit, then Delete in `destructive` after a separator.
- **Detail** (`ResourceDetail`): back link, the record's name (`h1`) with its `detail.status` badge, Edit (`outline`)
  and Delete (`destructive`). The fields come in section cards with an `h2` title: "Details" for the top-level
  fields, one card per nested object, and "Record information" for `form.readOnly` fields, in a narrow column
  beside the others from `lg`. Related lists follow in their own cards, `gap-6` throughout.
- **Form** (`ResourceForm`): a caption "Fields marked * are required", then the same section cards ("Details", one
  `fieldset` card per nested object, its legend styled as the card title), the read-only metadata card when editing,
  and the actions. Below `md` the actions are a bar stuck to the bottom of the screen (`bg-background/95`, top border,
  Cancel and Save side by side); from `md` they sit right-aligned after the cards.
- **States** (`DataState`, `EmptyState`): empty and error states centre an icon in a soft circle (`bg-muted`;
  `bg-destructive/12` for errors), a `text-section-title` title, one muted line and the next step: New for writers on
  an empty list, Clear filters, Clear search, Retry. A related list's empty state is `compact`. Skeletons have the
  shape of the real page (`ListSkeleton` in the list card, `DetailSkeleton`, `FormSkeleton`).

## Motion
Motion only answers an action: a dialog, sheet, menu or toast opening or closing (`tw-animate-css` classes from shadcn,
150-300 ms). No entrance animations on page load, and no hover transitions beyond colour. Anything that moves must
stop under `prefers-reduced-motion` (`motion-reduce:` variants; shadcn components already respect it through
`tw-animate-css`).

## Status colours
- A status is a soft badge (`<Badge variant="success|warning|info|destructive">`): a 12% tint with the colour as text.
  It always carries a text label, never colour alone.
- The manifest chooses the variant per value (`format: badge`, `badge: { VALUE: variant }`); `detail.status` names
  the badge field shown beside the record's name in the detail header. Use `success` for a
  positive or done state, `warning` for attention, `info` for neutral information, `destructive` for a negative or
  blocking state, and `secondary`/`outline` for neutral values (for example "Unavailable", "Low").
- Errors in forms and data views use `destructive` text with an icon (`Alert variant="destructive"`).

## Icons
lucide-react, 16 px (`size-4`) in buttons, menus and tables, 12 px in badges, 24 px in the soft circle of empty and
error states. Icons sit next to a text label. An icon-only button needs an `aria-label`. Decorative icons get
`aria-hidden`.

## Do and don't
| Do | Don't |
|---|---|
| One primary button per view; others `outline`, `ghost` or `link`. | Several blue buttons competing in one toolbar. |
| Status as a labelled soft badge. | A coloured dot or coloured text without a label. |
| Cards with a border on the tinted page. | Cards on a white page with a heavy shadow. |
| Muted foreground for labels, foreground for values. | Grey values that look disabled. |
| Tokens only (`bg-warning/12`). | `bg-amber-100`, `#f59e0b`, `text-[13px]`. |
| Right-aligned, tabular numbers. | Centered numeric columns. |

## Changing the brand
Edit `src/styles/theme.css`:
1. `--primary`, `--ring`, `--sidebar-primary` and `--sidebar-ring` (light and dark) take the brand colour as oklch.
   Keep about L 0.50-0.55 in light mode (white text on it) and L 0.70-0.75 in dark mode (dark text on it).
2. Change the hue of the neutrals (`255`) to the brand's hue, keeping their low chroma.
3. Check contrast: every `-foreground` on its colour at least 4.5:1, `ring` on `background`, `card` and `sidebar` at
   least 3:1, in both themes (for example with https://oklch.com or the WebAIM contrast checker).
4. Open `/__gallery` in light and dark.

Using a theme from [tweakcn](https://tweakcn.com): export it as Tailwind v4 CSS and paste its `:root` and `.dark`
blocks over the same blocks in `theme.css`. Do not paste its `@theme inline` block, because `src/index.css` already
maps the tokens. Keep the tokens tweakcn does not have: `--destructive-foreground`, `--success`, `--warning`, `--info`
and their `-foreground`s. Keep the type scale `@theme` block at the end of the file. If the theme sets
`--font-sans` to another font, install it from `@fontsource-variable/*` and import it in `src/index.css` instead of
Inter.
