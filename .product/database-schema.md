# Database Schema

Derived from the Drizzle schema definitions in
`src/infrastructure/db/schema/`. The database is SQLite; all IDs are
opaque `text` values and most timestamps default to `CURRENT_TIMESTAMP`.

## Tables

- **users** — auth identities (email + password hash).
- **organizations** — top-level tenants.
- **organization_members** — join table linking users to orgs with a
  role (`owner` | `member`).
- **organization_invites** — invite tokens to join an org, with
  creator and optional acceptor.
- **projects** — owned by an organization.
- **todos** — belong to a project, created by a user, optional
  deadline.
- **tags** — scoped to an organization (unique by name within org).
- **todo_tags** — many-to-many between todos and tags (composite PK).

## Entity-relationship diagram

```mermaid
erDiagram
    users {
        text id PK
        text email UK
        text password_hash
        text created_at
        text updated_at
    }

    organizations {
        text id PK
        text name
        text logo_path
        text created_at
        text updated_at
    }

    organization_members {
        text id PK
        text organization_id FK
        text user_id FK
        text role "owner|member"
        text created_at
        text updated_at
    }

    organization_invites {
        text id PK
        text organization_id FK
        text token UK
        text email_hint
        text role "owner|member"
        text created_by_user_id FK
        text accepted_by_user_id FK "nullable"
        text accepted_at
        text revoked_at
        text created_at
        text updated_at
    }

    projects {
        text id PK
        text organization_id FK
        text name
        text created_at
        text updated_at
    }

    todos {
        text id PK
        text project_id FK
        text title
        integer is_completed "boolean"
        text deadline_at
        text created_by_user_id FK
        text created_at
        text updated_at
    }

    tags {
        text id PK
        text organization_id FK
        text name
        text created_at
        text updated_at
    }

    todo_tags {
        text todo_id PK,FK
        text tag_id PK,FK
    }

    organizations ||--o{ organization_members : "has"
    users         ||--o{ organization_members : "joins"

    organizations ||--o{ organization_invites : "issues"
    users         ||--o{ organization_invites : "created_by"
    users         |o--o{ organization_invites : "accepted_by"

    organizations ||--o{ projects : "owns"
    projects      ||--o{ todos    : "contains"
    users         ||--o{ todos    : "created_by"

    organizations ||--o{ tags     : "scopes"

    todos ||--o{ todo_tags : ""
    tags  ||--o{ todo_tags : ""
```

## Key constraints and indexes

- **Cascades**: deleting an organization cascades to members, invites,
  projects, and tags. Deleting a user cascades to memberships, todos
  they created, and invites they created. Deleting a project cascades
  to its todos. Deleting a todo or tag cascades to `todo_tags`.
- **Soft link**: `organization_invites.accepted_by_user_id` is
  `ON DELETE SET NULL`, preserving invite history if the accepting
  user is deleted.
- **Unique constraints**: `users.email`;
  `(organization_members.user_id, organization_id)`;
  `organization_invites.token`;
  `(tags.organization_id, tags.name)`.
- **Indexes**: `organization_members(organization_id)`,
  `organization_invites(organization_id)`,
  `projects(organization_id)`,
  `todos(project_id)`,
  `todos(project_id, deadline_at)`,
  `todo_tags(tag_id)`.
