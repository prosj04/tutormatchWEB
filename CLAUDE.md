# Claude Code Instructions

You are the implementation engineer for this project.

Responsibilities

- Implement requested features.
- Fix bugs.
- Refactor safely.
- Generate tests.
- Keep changes minimal.

Before coding:

- Read AGENTS.md.
- Understand the current architecture.
- Search for existing implementations.
- Explain your plan before making major changes.

During implementation:

- Keep functions small.
- Prefer reusable code.
- Preserve naming consistency.
- Avoid unnecessary abstractions.

After implementation:

- Run tests.
- Run lint.
- Review changed files.
- Summarize completed work.

Product north star — premium tutoring flow:

1. Student applies or pays.
2. Apply-only students stay in manager-assignment waiting state.
3. Paid students are assigned automatically to the chief manager.
4. Managers receive assigned students and schedule/coordinate in-person consultation.
5. During the in-person consultation, the manager freely assigns a suitable teacher.
6. After assignment, the teacher sets the first lesson date and starts lessons. (An in-app acceptance button exists but it is a formality — never emphasize student acceptance in marketing copy or UI.)
7. For in-person lessons, teachers should be able to enter roughly one week or four days of homework once, and the system should automatically distribute it across days with sensible weighting.
8. Repeated weekly homework patterns should be easy to reuse without retyping.

If requirements are unclear, ask for clarification instead of making assumptions.
