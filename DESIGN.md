# Design Rules — Todo App (with guardrails)

This document defines the design rules for the application. All code in this
repo is expected to follow it. The agent (and humans) should consult this
file before adding features or refactoring.

## Architecture

- **Layered architecture**, with strict one-way dependencies:
  1. `domain/` — pure types, value objects, domain rules. No I/O. No imports
     from any other layer.
  2. `application/` — use cases / orchestrators. Depend only on `domain/` and
     on **port interfaces** declared inside `application/ports/`.
  3. `infrastructure/` — concrete adapters (storage, clock, id generator,
     logger). Implement the ports from `application/`.
  4. `interface/` — entry points (CLI, HTTP handler, etc.). Wires
     infrastructure into application use cases.
- **Dependency rule:** dependencies always point inward. `domain` knows
  nothing. `application` knows `domain`. `infrastructure` and `interface`
  know `application` and `domain`.
- **No singletons, no module-level mutable state.** Everything that has
  identity or state is constructed at the composition root in `interface/`.

## Domain rules

- A `Todo` has: `id` (string), `title` (non-empty, ≤200 chars), `completed`
  (boolean), `createdAt` (ISO timestamp).
- `Todo` is an **immutable** value. Mutations return a new value.
- Invalid inputs throw a domain error (`DomainError` subclass) — never
  `undefined`/`null` returns to signal failure.

## Code style

- **TypeScript strict mode** (already enforced by `tsconfig.json`).
- **No `any`.** No non-null assertions (`!`). No `as` casts except at I/O
  boundaries with a runtime check next to them.
- **Explicit return types** on all exported functions.
- **Pure functions by default.** Side effects live in adapters, not in
  domain or application code.
- **Errors are typed.** Define and throw `DomainError`, `ValidationError`,
  `NotFoundError` — not raw `Error` strings.
- **Naming:** `camelCase` for values and functions, `PascalCase` for types
  and classes, `SCREAMING_SNAKE_CASE` for constants. Files in `kebab-case`.
- **No barrel files** (`index.ts` re-exports) — they hide dependency
  direction and break tree-shaking.

## File and function size

Enforced by ESLint (see `eslint.config.mjs`):

- Max **300 lines per file**.
- Max **50 lines per function**.
- Max **cyclomatic complexity 10** per function.
- Max **4 parameters** per function — group into an object if more are
  needed.
- Max nesting **depth 3**. Use early returns and small helpers.

If a file is approaching the limit, that is a signal to split it, not a
signal to raise the limit.

## Testing

- **Jest** is the test framework. Tests live next to the code as
  `<name>.test.ts`, or in `tests/` for cross-cutting integration tests.
- **Coverage threshold: ≥90%** for lines, branches, functions, and
  statements. CI fails below that.
- **Unit tests** for `domain/` and `application/` — no mocks of own code,
  use real implementations of value objects.
- **Adapter tests** for `infrastructure/` — exercise the real adapter
  against an in-memory or temp-file double of the external dependency.
- Tests must be **deterministic**: inject the clock and the id generator
  via ports; never call `Date.now()` or `Math.random()` directly in
  production code.

## Quality gates

A change is only complete when **all three gates pass**:

1. `npm run lint` — zero errors, zero warnings.
2. `npm run typecheck` — zero TypeScript errors.
3. `npm test` — all tests green, coverage ≥90%.

Husky runs the linter on every commit. The full set is the bar for
"ready to merge".
