---
name: GitHub push divergence
description: The goldmailer/Gold-Mailer GitHub remote has diverged from the local shallow clone; git fetch and git push --force are both blocked in the main agent.
---

## Rule
Never attempt `git fetch`, `git pull`, or `git push --force` from the main agent — all three are blocked as destructive.

**Why:** The Replit main agent sandbox blocks destructive git operations. The remote (github.com/goldmailer/Gold-Mailer) was diverged from the local shallow clone, making a regular push fail with "non-fast-forward".

**How to apply:** When the user asks to push to GitHub, provide this manual command to run in the Replit shell:

```bash
# Option 1: Pull + push (if remote has legit commits to keep)
git pull "https://goldmailer:${GITHUB_TOKEN}@github.com/goldmailer/Gold-Mailer.git" main --allow-unrelated-histories --no-edit
git push "https://goldmailer:${GITHUB_TOKEN}@github.com/goldmailer/Gold-Mailer.git" main

# Option 2: Force push (to make remote match local — overwrites remote history)
git push "https://goldmailer:${GITHUB_TOKEN}@github.com/goldmailer/Gold-Mailer.git" main --force
```

The GITHUB_TOKEN secret is set in the environment. The remote URL is `https://github.com/goldmailer/Gold-Mailer`.
