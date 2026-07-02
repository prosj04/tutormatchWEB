# AI Development Guide

This document applies to every AI coding agent working in this repository.

Responsibilities

- Understand the project before making changes.
- Read the README before implementing features.
- Reuse existing components whenever possible.
- Avoid duplicated logic.
- Follow the existing architecture.
- Prefer minimal, safe changes.
- Do not introduce breaking changes without discussion.

Workflow

1. Analyze
2. Plan
3. Implement
4. Test
5. Review
6. Update documentation

Testing

Every completed feature should:

- Build successfully.
- Pass existing tests.
- Avoid introducing console errors.
- Avoid lint errors.

Git

Use Conventional Commits.

Examples:

feat:
fix:
refactor:
docs:
test:
chore:

Never commit secrets or generated files.

Quality

Always prioritize:

- Readability
- Maintainability
- Performance
- Security

If you discover technical debt, create a TODO rather than making unrelated changes.
