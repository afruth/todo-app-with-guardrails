# PRD — Task Dependencies

**Status:** Draft
**Author:** Andreas Fruth
**Last updated:** 2026-04-28

## 1. Summary

Allow a todo (the *dependent*) to declare that it depends on one or
more other todos (its *prerequisites*). A dependent task cannot be
marked complete until all of its prerequisites are complete. The UI
must surface prerequisites clearly on the dependent task, and the
backend must enforce the rule independently of the UI.

## 2. Problem & motivation

Today, every todo is independent. Users with multi-step work have no
way to express "do A before B." They either close tasks out of order
(losing the signal that work was sequenced) or track ordering in their
heads. Capturing the relationship in the model:

- Prevents closing a follow-up task before its prerequisite is done.
- Makes the sequence visible — a user opening task B can see that it
  is waiting on task A.
- Gives the backend a single source of truth so future features
  (blocked-task reports, critical-path views) can build on it.

## 3. Goals

- A todo can declare zero or more prerequisite todos.
- Closing a todo is rejected if any of its prerequisites are still
  open. The rejection reaches the user as a meaningful error message,
  not a generic 500.
- The UI for a todo lists its prerequisites with their current status,
  and links to them.
- The system never permits a dependency cycle (A → B → A).

## 4. Non-goals

- No transitive auto-completion (closing A does not auto-close B).
- No scheduling, due-date propagation, or critical-path calculation.
- No bulk dependency editor; users add/remove one prerequisite at a
  time in v1.
- No cross-user dependencies beyond what the existing ownership model
  already allows. Dependencies follow the same visibility rules as the
  todos themselves.

## 5. User stories

1. **Add a prerequisite.** As a user editing todo B, I can pick one of
   my existing todos A and declare B depends on A.
2. **See prerequisites.** As a user viewing todo B, I see a
   "Depends on" section listing A with its status (open / done) and a
   link to A's detail view.
3. **Blocked close.** As a user trying to mark B done while A is still
   open, I get a clear error: *"Can't close 'B' — it depends on 'A',
   which is still open."* B stays open.
4. **Unblocked close.** Once A is done, closing B succeeds normally.
5. **Remove a prerequisite.** As a user, I can remove a prerequisite
   from B at any time.
6. **Cycle prevented.** If I try to make A depend on B while B already
   depends on A (directly or transitively), the system rejects the
   change with a clear error.

## 6. Functional requirements

### 6.1 Data model

- A new many-to-many relation `todo_dependencies` with
  `(dependent_id, prerequisite_id)`. Both columns reference `todos`,
  with `ON DELETE CASCADE` on each side.
- Composite primary key on `(dependent_id, prerequisite_id)`.
- Self-reference forbidden: `dependent_id <> prerequisite_id` enforced
  by a check constraint.
- Indexes on each column to support both directions of lookup.
- See `DATABASE.md` for naming/migration conventions; this feature
  must follow them.

### 6.2 Backend rules (authoritative)

The backend must enforce the following independently of any UI:

- **Close validation.** Marking a todo complete fails if any
  prerequisite is still open. The failure must be a domain-level error
  type (not a generic 500) so the HTTP layer can map it to a 409
  Conflict with a structured body (see §6.4).
- **Cycle prevention.** Adding a prerequisite must reject any edge
  that would create a cycle. Detection runs over the full transitive
  closure, not just direct edges.
- **Ownership / visibility.** A user can only declare a prerequisite
  on a todo they can already see. (Reuses existing authorization;
  no new rules.)
- **Self-dependency.** Adding `A → A` is rejected at the domain layer
  with a meaningful error, in addition to the DB check constraint.
- **Idempotency.** Adding the same prerequisite twice is a no-op, not
  an error.
- **Deletion.** Deleting a todo cascades and removes any dependency
  rows that reference it (handled by FK).

### 6.3 API

New endpoints (exact paths follow existing HTTP conventions in `src/`):

- `POST   /todos/:id/dependencies`   body: `{ prerequisiteId }`
- `DELETE /todos/:id/dependencies/:prerequisiteId`
- `GET    /todos/:id` — response now includes a `dependencies` array
  with `{ id, title, status }` for each prerequisite, sorted by
  creation order.

The existing `PATCH /todos/:id` (status change) gains the close-time
validation described in §6.2.

### 6.4 Error contract

All dependency-related failures return a JSON body of the form:

```json
{
  "error": {
    "code": "DEPENDENCY_BLOCKS_CLOSE" | "DEPENDENCY_CYCLE" | "DEPENDENCY_SELF" | "DEPENDENCY_NOT_FOUND",
    "message": "Human-readable, references task titles by name.",
    "details": { ... }
  }
}
```

Required error messages (verbatim wording is not required, but each
must name the offending task(s) so the user can act):

- **`DEPENDENCY_BLOCKS_CLOSE`** (HTTP 409): *"Can't close '{B}' — it
  depends on '{A}', which is still open."* If multiple prerequisites
  are open, list them all.
- **`DEPENDENCY_CYCLE`** (HTTP 409): *"Adding '{A}' as a prerequisite
  of '{B}' would create a cycle: {A} → … → {B} → {A}."* Include the
  cycle path in `details.cycle`.
- **`DEPENDENCY_SELF`** (HTTP 400): *"A task cannot depend on itself."*
- **`DEPENDENCY_NOT_FOUND`** (HTTP 404): *"Prerequisite task not
  found."*

### 6.5 UI

On the todo detail view:

- A **"Depends on"** section listing each prerequisite with title,
  status badge (Open / Done), and a link to that todo.
- An **"Add prerequisite"** control that lets the user pick from their
  other todos (excluding self and any todo that already depends on the
  current one — the latter prevents cycles client-side as a courtesy,
  but the backend remains the source of truth).
- A **remove** action on each listed prerequisite.
- When the user clicks **Mark done** on a blocked task, the
  `DEPENDENCY_BLOCKS_CLOSE` message is shown inline on the task — not
  as a toast that disappears — and names the blocking prerequisite(s)
  with links.

On any todo list view: a small **"blocked"** indicator on todos that
have at least one open prerequisite, so users can see the state
without opening the detail view.

## 7. Acceptance criteria

- [ ] Schema migration adds `todo_dependencies` per §6.1; `npm test`
      and `npm run typecheck` pass.
- [ ] Domain layer rejects close, cycle, self-dependency with typed
      errors; covered by unit tests at ≥90% (per `CLAUDE.md`).
- [ ] HTTP layer maps each domain error to the status/body in §6.4;
      covered by integration tests in `tests/`.
- [ ] Detail view renders prerequisites with status and links.
- [ ] Blocked close in the UI shows an inline, persistent error that
      names the blocking task(s).
- [ ] List view shows a blocked indicator for tasks with open
      prerequisites.
- [ ] All three quality gates (lint, typecheck, tests with ≥90%
      coverage) green.

## 8. Open questions

1. Should completing the last open prerequisite send any kind of
   "now unblocked" notification, or is the visual change enough for
   v1? (Lean: enough for v1.)
2. Is there a soft cap on the number of prerequisites per task to
   keep the UI legible? (Lean: no cap in v1; revisit if abused.)
3. Should the cycle-prevention error include the *full* cycle path,
   or just the two endpoints? Full path is more useful but more
   expensive to compute on large graphs.
