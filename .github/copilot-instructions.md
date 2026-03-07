# Copilot Instructions

## MUST

- Keep edits minimal, focused, and consistent with existing style.
- Update all related code needed to keep behavior and consistency correct.
- Read the full chain of related files (not just first match).
- Check architecture conflicts early before editing.
- Assume Windows development, but keep code cross-platform.
- Limit code changes to `src/` unless explicitly requested otherwise.
- After code edits, run `npm run typecheck` and `npm run lint`.
- Ask for clarification before editing when requirements are conflicting, risky, or broader than requested scope.
- If the same issue fails twice, switch to full end-to-end tracing: *main -> IPC -> preload -> renderer*.
- Remove temporary debug logs before finalizing unless explicitly asked to keep them.
- Update `CHANGELOG.md` with one-line description of each change, categorized by type (Added, Changed, Fixed, etc.) and area (e.g. Renderer, Main, etc.).

## MUST NOT

- Never read, inspect, or modify `sdnext/`.
- Do not touch `portable/`, `dist/`, or other generated/runtime data unless explicitly requested.
