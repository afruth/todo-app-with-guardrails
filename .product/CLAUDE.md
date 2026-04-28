# Product Documentation

This directory holds **all general product documentation** for the
todo app: product requirements, feature specs, user-facing behavior
notes, roadmap items, and any other durable product knowledge that
should be checked into the repository and shared across contributors.

## Where things go

- **`.product/`** — durable product documentation. Anything here is
  committed to git and is meant to be read by anyone working on the
  project, now or in the future.
- **`.local/`** — transient, throwaway, or personal documentation:
  scratch notes, in-progress drafts, exploratory write-ups, agent
  working files. This directory is **gitignored** and never committed.
  Use it freely; do not rely on its contents being shared with others.

## Rule of thumb

If a document is worth keeping and worth sharing, it belongs in
`.product/`. If it's a working note that may be discarded tomorrow,
it belongs in `.local/`.
