---
name: code-validation
description: 'Validate TypeScript codebase for syntax errors, type safety, linting, builds, imports, and architecture. Use for: ensuring code quality before commits, detecting architecture violations, finding breaking changes, verifying logic correctness, suggesting improvements.'
argument-hint: 'Optional: file path or pattern to validate (e.g., src/main, src/renderer/components)'
user-invocable: true
---

# Code Validation

Comprehensive validation of the TypeScript codebase in `/src` to catch errors, violations, and quality issues early.

## When to Use

- Before committing or pushing changes
- After making significant architectural changes
- To detect logic violations or inconsistencies
- To ensure compliance with project standards

## Validation Procedure

### 1. **Type Checking**
Run type safety validation to catch type errors and interface mismatches:
```bash
npm run typecheck
```
Review any reported TS errors. Check:
- Missing or incorrect type annotations
- Function parameter/return type mismatches
- Object property access on non-existent fields
- Generic type parameter violations

### 2. **Linting & Style**
Run code style and quality checks:
```bash
npm run lint
```
Review reported issues for:
- Unused variables or imports
- Code style violations
- Potential logic errors (unreachable code, shadowed variables)
- Best practice violations

### 3. **Build Verification**
Compile the entire project to ensure buildability:
```bash
npm run build
```
Check for:
- Module resolution errors
- Import/export mismatches
- Build target compatibility issues
- Asset bundling problems

### 4. **Architecture & Logic Analysis**
Once all checks pass, analyze the `/src` structure for:
- **Dependency flow**: Verify no circular dependencies between modules
- **IPC boundaries**: Ensure preload/main/renderer communication is type-safe and follows `src/shared/ipc-types.ts`
- **Service isolation**: Check that services in `src/main/services/` are properly encapsulated
- **Architecture violations**: Look for any code that violates expected architectural patterns
- **Logic consistency**: Review complex functions for potential logic errors or edge cases
- **Update safety**: Ensure that status updates are propagated correctly
- **Component hierarchy**: Verify renderer components follow expected patterns and are properly triggered
- **Type consistency**: Ensure shared types are reused across IPC boundaries

### 5. **Suggest Improvements**
After validation passes, propose enhancements:
- Missing type annotations or overly broad `any` types
- Dead code that could be removed
- Refactoring opportunities for clarity or performance
- Documentation gaps in complex functions

## Quick Checks

| Check | Command | Purpose |
|-------|---------|---------|
| Types only | `npm run typecheck` | Fast feedback on type errors |
| Lint only | `npm run lint` | Style and quality issues |
| Full build | `npm run build` | Deployment readiness |

## Integration

This skill works with:
- **Copilot Instructions** (`.github/copilot-instructions.md`) for ongoing project guidance
- **npm scripts** defined in `package.json`
- **TypeScript configuration** in `tsconfig.json`, `tsconfig.renderer.json`, `tsconfig.electron.json`

## Typical Workflow

1. Make code changes in `/src`
2. Invoke this skill: `/code-validation`
3. Review and fix any errors in stages (types → lint → build)
4. Read improvement suggestions
5. Commit with confidence
