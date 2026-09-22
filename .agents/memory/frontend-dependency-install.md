---
name: Frontend dependency install
description: Replit package-firewall behavior when restoring this monorepo for frontend work
---

The full workspace dependency install can be blocked by the Replit package firewall while fetching the `orval` codegen package, even though the frontend dependencies are available. Installing only the frontend workspace and its local generated-client dependencies is sufficient for frontend typechecks and builds.

**Why:** The generated API client is already committed, and frontend verification does not need to run code generation.

**How to apply:** For UI-only changes, install the gold-mailer workspace plus api-zod/api-client-react dependencies selectively rather than changing the lockfile or unrelated codegen packages.