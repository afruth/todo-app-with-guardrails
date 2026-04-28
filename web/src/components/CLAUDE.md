# CLAUDE.md — `web/src/components/`

Conventions for shared React components in this folder. The root
`CLAUDE.md` and `DESIGN.md` still apply; this file specialises them
for the component layer. If a rule here conflicts with `DESIGN.md`,
update `DESIGN.md` in the same change rather than diverging silently.

## Scope

- Components in this folder are **shared, route-agnostic** UI used by
  more than one page (or by `Layout`).
- One-off UI that belongs to a single page lives next to the page in
  `web/src/pages/`, not here. Promote to `components/` only on the
  second use site.
- Pages compose components — components must not import from
  `pages/`.

## File and naming

- One component per file, file name matches the export:
  `TodoItem.tsx` exports `TodoItem`. **PascalCase `.tsx`** here is
  the established convention; do not switch to kebab-case.
- **Named exports only.** No `export default`.
- No barrel `index.ts` (root `DESIGN.md` rule).

## Component shape

- Function components, declared as `const Name = (...): React.ReactElement => {}`
  (or `React.ReactElement | null` when the component may render
  nothing).
- **Explicit return type** on every exported component, hook, and
  helper. No `any`, no `!`, no `as` outside I/O boundaries.
- Props go in a typed object parameter:
  - Up to ~3 props: inline type literal is fine
    (`({ a, b }: { a: string; b: number })`).
  - More than that, or reused: declare an `interface FooProps`
    above the component.
- Read-only collections are typed `readonly T[]` (see
  `TodoItem`'s `projects: readonly ProjectView[]`).
- Event-handler props use the `on` prefix (`onSave`, `onDelete`,
  `onMove`, `onAdd`, `onToggle`). They may return `void` or
  `Promise<void>`.
- Respect the file/function size limits from `DESIGN.md`
  (300 lines / 50 lines / complexity 10 / 4 params / depth 3). If
  a component is approaching them, split — don't relax the limit.

## Hooks and state

- `useState` / `useEffect` for local state. No global stores; cross-
  cutting state lives in the existing contexts (`auth/AuthContext`,
  `org/OrgContext`).
- Component-private hooks (e.g. `useTags`, `useOverdueCount`) live in
  the same file as their consumer until a second consumer appears.
- Async data loading inside `useEffect` uses the **`alive` flag**
  pattern to avoid setting state after unmount:

  ```ts
  useEffect(() => {
    let alive = true;
    api.listX(orgId)
      .then((data) => alive && setX(data))
      .catch(() => alive && setX([]));
    return () => { alive = false; };
  }, [orgId]);
  ```

- To react to data changes from elsewhere in the app, subscribe to
  the existing `*_CHANGED_EVENT` constants from `../api`
  (`TODOS_CHANGED_EVENT`, `PROJECTS_CHANGED_EVENT`,
  `TAGS_CHANGED_EVENT`, `ORGS_CHANGED_EVENT`). Do not invent a new
  event channel — extend `api.ts` if a new one is genuinely needed.
- Always clean up listeners and intervals in the effect's return.

## Side effects in handlers

- For fire-and-forget async calls inside event handlers, prefix with
  `void`:  `onClick={() => void save()}`. Don't `await` inside an
  event handler signature.
- Guard submits behind a `busy` flag (see `QuickAddTodo`) so the
  button can't be double-clicked while a request is in flight.

## Domain rules in the UI

- Never reach past `../api`. All server access goes through the
  `api` object and the `*View` types it exports.
- Normalise user input at the edge of the component:
  - Trim titles before send (`title.trim()`).
  - Empty string deadline → `null`; non-empty → `new Date(...).toISOString()`.
  - Tags: split on `,`, `trim()`, `toLowerCase()`, drop empties.
  Reuse the helpers already in `QuickAddTodo` / `TodoItem` rather
  than duplicating.
- Comparisons against `null`/empty are **explicit**: `iso === null`,
  `name.trim().length === 0`. No truthy shortcuts on strings or
  nullables (matches the strict tsconfig).

## Styling

- **MUI is the only UI library.** Use components from `@mui/material`
  and icons from `@mui/icons-material`. Do not pull in another UI
  kit, and do not write CSS modules or styled-components.
- Layout via `Stack`, `Box`, `Paper`, `sx`. No inline `style={{}}`
  except for one-off dynamic values that `sx` can't express.
- Use MUI tokens (`color="primary"`, theme spacing units) instead of
  hard-coded colors and pixel values.

## Accessibility

- Every `IconButton` has an `aria-label`.
- Form controls have a visible `label` (or `aria-label` if visually
  hidden is required).
- Don't remove the `aria-*` attributes you find — they're load-
  bearing for tests and screen readers.

## Testing

- Tests live next to the component as `ComponentName.test.tsx`.
- Coverage gate is **≥90%** (root `CLAUDE.md`); a new component
  without tests will fail the gate. Cover: the happy render, each
  conditional branch (`editing` vs read-only, `count === 0` vs
  banner shown, etc.), and each `on*` callback firing with the
  expected payload.
- Prefer `@testing-library/react` queries by role/label/text over
  test ids. Use `aria-label`s the component already exposes.
- Don't mock `api` deeper than necessary — stub the specific method
  the test needs and assert on the rendered DOM, not on internal
  state.

## Quality gates (reminder)

Before declaring a component change done, all three must be green:

1. `npm run lint` — zero errors, zero warnings.
2. `npm run typecheck` — zero type errors.
3. `npm test` — all pass, coverage ≥90%.
