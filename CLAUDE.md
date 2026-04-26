# CLAUDE.md — Todo App (with guardrails)

Project-specific instructions for any agent working in this folder.

## Read this first

- **`DESIGN.md`** — the design rules for this application (architecture
  layers, domain rules, code style, file/function limits, testing rules).
  Consult it before adding or changing code. Do not introduce patterns
  that contradict it; if the design needs to evolve, update `DESIGN.md`
  in the same change.
- **`DATABASE.md`** — the database rules: ORM choice (Drizzle), schema
  conventions, constraints, indexing, transactions, migration policy,
  and how the application layer is allowed to access the database.
  Consult it before adding or changing any schema, migration, or query.
  Same rule applies: if the policy needs to evolve, update `DATABASE.md`
  in the same change.

## Quality gates — all must pass before a change is considered done

1. **Lint:** `npm run lint` — zero errors, zero warnings.
2. **TypeScript:** `npm run typecheck` — zero type errors.
3. **Tests:** `npm test` — all tests pass, **code coverage ≥90%** on
   lines, branches, functions, and statements.

A change is not complete until all three gates are green. Do not
commit, and do not report the task as done, while any gate is failing.

## Testing

- **Framework:** Jest (with `ts-jest` for TypeScript).
- **Layout:** unit tests live next to the code as `<name>.test.ts`;
  cross-cutting integration tests live in `tests/`.
- **Coverage threshold:** ≥90% across lines, branches, functions, and
  statements. Configured in `jest.config.ts` — do not lower it to make
  a change pass; write the missing tests instead.
- Run `npm test` for the full run, `npm run test:watch` while iterating,
  and `npm run test:coverage` to see the coverage report.

## Husky pre-commit

Husky runs `lint-staged` on every commit. A failing lint blocks the
commit. Do not bypass it with `--no-verify`.
