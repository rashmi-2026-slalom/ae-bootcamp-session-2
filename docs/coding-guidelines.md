# Coding Guidelines

This project favors code that is clear, consistent, and easy to evolve. The goal is not only to make code run, but to make it understandable for the next person who reads it. Every change should improve or preserve readability, maintainability, and reliability.

## Style and Formatting

Use a consistent formatting style across backend and frontend code so files are predictable to navigate. Keep functions focused, names descriptive, and blocks of logic compact enough to scan quickly. Avoid overly clever patterns that hide intent.

When adding or updating code:

- Prefer readable names over abbreviations.
- Keep function and component responsibilities narrow.
- Reduce deep nesting by using early returns when appropriate.
- Keep comments concise and meaningful, and only where intent is not obvious from code.

## Import Organization

Imports should be organized in a stable, readable order to reduce noise in reviews and merge conflicts.

A practical import order is:

1. Node or platform modules
2. External dependencies
3. Internal modules
4. Styles or side-effect imports

Within each group, keep imports alphabetized when possible. Remove unused imports and avoid creating circular dependencies between modules.

## Linting and Quality Gates

Linting is a core quality control mechanism, not an optional cleanup step. Use ESLint feedback early while coding so issues are fixed before they spread.

- Run linting and tests before committing.
- Treat lint warnings as actionable unless there is a justified exception.
- If a lint rule must be disabled, scope it as narrowly as possible and document why.

Consistency with linter rules improves confidence in code reviews and keeps the codebase easier to maintain over time.

## DRY and Reuse Principles

Follow the DRY principle (Don’t Repeat Yourself): repeated logic should be extracted into reusable functions, modules, or components when it meaningfully reduces duplication.

Apply DRY with balance:

- Avoid copy-paste logic across files.
- Extract shared behavior only when the abstraction remains clear.
- Do not over-abstract too early; prefer simple duplication briefly over complex, premature generic code.

The best abstractions reduce repetition while preserving readability.

## Error Handling and Defensive Coding

Write code that fails clearly and safely. Validate inputs, handle expected failure modes, and return useful error messages. In frontend flows, surface user-friendly states for loading and errors. In backend flows, return appropriate HTTP status codes and consistent response shapes.

## Testing Expectations

All new features and bug fixes should include appropriate automated tests. Tests should remain isolated, deterministic, and behavior-focused. A well-tested change should be safe to refactor and easy to trust.

## Code Review Mindset

Before opening or merging a change, review it as if you were the maintainer inheriting it next month.

- Is the intent obvious?
- Is the code easy to change safely?
- Are edge cases and errors handled?
- Are tests meaningful and maintainable?

Good code in this project is code that solves today’s problem without making tomorrow’s changes harder.
