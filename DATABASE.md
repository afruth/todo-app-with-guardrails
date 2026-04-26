# Database Rules — Todo App (with guardrails)

Generic best practices for data modeling and database access in this
project. The application is not yet defined; these rules apply to any
schema we end up with.

## ORM and tooling

- **ORM:** [Drizzle ORM](https://orm.drizzle.team). Schema is defined in
  TypeScript under `src/infrastructure/db/schema/`. Drizzle is the only
  way the application talks to the database — no raw SQL strings outside
  `src/infrastructure/db/`.
- **Migrations:** managed by `drizzle-kit`. Migration files live in
  `drizzle/` at the repo root and are checked into git. They are
  **append-only** — never edit a migration that has been merged. To
  change a shipped table, write a new migration.
- **One source of truth:** the Drizzle schema is the source of truth.
  The runtime database structure is derived from it via migrations. Do
  not hand-edit the database; do not introspect it back into the
  schema.

## Schema conventions

### Naming
- Tables: **`snake_case`**, **plural** (`todos`, `users`, `audit_events`).
- Columns: **`snake_case`** (`created_at`, `is_completed`).
- TypeScript identifiers (table objects, types): **`camelCase`** /
  **`PascalCase`** (`todos`, `Todo`, `NewTodo`).
- Primary keys: always named `id`.
- Foreign keys: `<referenced_table_singular>_id` (`user_id`, `todo_id`).
- Booleans: prefixed with `is_`, `has_`, `was_` — never ambiguous nouns
  like `active` (use `is_active`).
- Timestamps: `created_at`, `updated_at`, `deleted_at` — past tense, UTC.

### Identifiers
- Use **UUID v7** (or ULID) for primary keys, not auto-increment
  integers. Reasons: globally unique, generated client-side without a
  round-trip, time-sortable, safe to expose in URLs.
- IDs are **opaque strings** in TypeScript. Wrap them in branded types
  (`type TodoId = string & { readonly __brand: 'TodoId' }`) so a
  `UserId` cannot be silently passed where a `TodoId` is expected.

### Required fields on every table
- `id` — primary key.
- `created_at timestamptz NOT NULL DEFAULT now()`.
- `updated_at timestamptz NOT NULL DEFAULT now()` — updated on write
  (via trigger, ORM hook, or explicit set; pick one and stay
  consistent).
- For user-owned data: `user_id` (or equivalent owner) with a foreign
  key and an index.

### Types
- **Timestamps:** always `timestamptz` (timestamp with time zone).
  Never `timestamp` without TZ. Store UTC; format on display only.
- **Money:** `numeric(precision, scale)` with explicit precision (e.g.
  `numeric(12, 2)`) — never `float`/`double`.
- **Enums:** use Drizzle `pgEnum` (or the equivalent) so the set of
  values is enforced at the DB level. Don't store enum values as free
  `text`.
- **JSON:** use `jsonb` (Postgres). Always pair with a Zod (or similar)
  schema validated at the application boundary. `jsonb` is for
  genuinely variable shape; if the shape is fixed, model it as columns.
- **Strings:** prefer `text` over `varchar(n)` unless there is a real
  business limit. Encode limits as `CHECK` constraints when they exist.

### Constraints
- **`NOT NULL` is the default.** Make a column nullable only when
  "missing" is a meaningful state, distinct from a sentinel value.
- Use **`CHECK` constraints** for invariants the database can enforce
  cheaply (`length(title) between 1 and 200`, `amount >= 0`).
- Use **`UNIQUE` constraints** on natural keys (e.g. `users.email`),
  not application-level "I'll check first then insert" logic.
- Foreign keys **always** declare `ON DELETE` / `ON UPDATE` behavior
  explicitly — `cascade`, `set null`, or `restrict`. No defaults.

### Indexing
- Index every foreign key.
- Index columns used in `WHERE`, `ORDER BY`, or `JOIN` predicates that
  appear in hot paths.
- Composite indexes: order columns by selectivity (most selective
  first) and match the query's predicate order.
- Don't index everything by default — each index costs writes.

## Soft delete vs. hard delete

- **Hard delete by default.** Soft delete (`deleted_at`) is opt-in,
  per-table, and only when there is a real auditing or undo
  requirement. If a table uses soft delete:
  - Every query must filter `deleted_at IS NULL` — wrap this in a
    repository helper, never rely on every caller to remember.
  - `UNIQUE` constraints on soft-deleted tables must be partial
    (`WHERE deleted_at IS NULL`).

## Transactions and consistency

- Any operation that touches more than one row across more than one
  table runs inside a **transaction**. Use Drizzle's `db.transaction`.
- Keep transactions **short**: open, do the work, commit. No external
  HTTP calls, no waiting on user input, no expensive computation
  inside a transaction.
- For multi-step workflows that must be atomic *and* slow, use the
  outbox pattern: write the work item to a table inside the
  transaction, process it asynchronously.
- **No application-level locking.** Use the database (`SELECT ... FOR
  UPDATE`, advisory locks, unique constraints) — it is the consistency
  authority.

## Migrations

- One migration per change. Small, focused, reviewable.
- Migrations are **forward-only in production**. Don't rely on
  `down` migrations to recover; design the change so it can be rolled
  back by a new forward migration.
- **Backwards-compatible deploy order** for any breaking change:
  1. Migration adds the new shape (new column nullable, new table,
     new index `CONCURRENTLY`).
  2. Application code is deployed reading both old and new shape.
  3. Backfill runs.
  4. Application code is deployed writing only the new shape.
  5. Migration removes the old shape.
- Long-running operations (`CREATE INDEX`, large backfill) must be
  run `CONCURRENTLY` / in batches, not inside the main migration
  transaction, to avoid locking production tables.

## Application-side access rules

- **No raw SQL outside `src/infrastructure/db/`.** Domain and
  application layers depend on **repository ports** (interfaces), not
  on Drizzle directly. The Drizzle-backed repository lives in
  `infrastructure/db/`.
- **Validate at the boundary.** Inputs from HTTP/CLI are parsed with
  Zod (or equivalent) into domain types before they reach the
  repository. The repository trusts its inputs are valid.
- **N+1 is a defect.** Fetch related data in one query (`with: {}` in
  Drizzle) or with an explicit join. Add a test that fails if a code
  path issues more queries than expected.
- **Pagination is mandatory** on any list endpoint. Use keyset
  (cursor) pagination on tables that can grow unbounded; offset
  pagination is acceptable only for small, bounded lists.
- **Never log row contents** that may contain personal data. Log
  IDs and counts.

## Testing the data layer

- Repository tests run against a **real database** (Postgres in a
  container or an ephemeral local instance), not a mock. Mocks of the
  ORM mask schema and query bugs.
- Each test gets a clean database state — wrap each test in a
  transaction that rolls back, or truncate before each test.
- Time and IDs are injected via ports (see `DESIGN.md`); tests pass a
  fixed clock and a deterministic ID generator so assertions are
  stable.
