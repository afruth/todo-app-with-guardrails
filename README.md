# Todo App — with guardrails

A small todo application built with **strict guardrails** in place from day one:

- **TypeScript** in strict mode
- **ESLint** with strict rules (errors, not warnings) on top of `@eslint/js` recommended and `typescript-eslint` strict-type-checked
- **Code-complexity limits** enforced at lint time:
  - Max **300 lines** per file
  - Max cyclomatic **complexity of 10** per function
  - Max **50 lines** per function
  - Max **4 parameters** per function
  - Max nesting **depth of 3**
- **Husky** pre-commit hook runs the linter on staged files. A failing lint blocks the commit.

This codebase is one half of a workshop exercise for the Metycle dev team
(27–30 April 2026). The other half is `../todo app without guardrails`,
which has no guardrails at all. The two are built side-by-side to show how
guardrails shape what an agentic coding tool produces.

## Scripts

```bash
npm run lint         # check the codebase
npm run lint:fix     # auto-fix what can be auto-fixed
npm run typecheck    # tsc --noEmit
```

## Pre-commit

Husky is wired to run `lint-staged`, which lints any staged `.ts` files
before the commit completes. If any rule errors, the commit is rejected.
