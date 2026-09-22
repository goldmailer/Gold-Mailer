---
name: Drizzle workspace versions
description: Shared Drizzle type identity across the monorepo
---

All workspace packages that import shared database tables must resolve the same Drizzle ORM catalog version, including the root package and `lib/db`.

**Why:** Separate semver ranges can install multiple Drizzle copies or make TypeScript treat identical table types as incompatible, producing hundreds of misleading query errors.

**How to apply:** Keep the root package, API server, and database library on the workspace catalog entry; reinstall the affected filtered workspace after changing the dependency.