# Testing Guidelines

## Principles

- Keep tests fast, deterministic, and focused on behavior.
- Write tests that are easy to read and maintain.
- Prefer small, isolated unit tests over broad, fragile tests.
- Add tests for bug fixes to prevent regressions.
- All tests must be isolated and independent.
- Each test must set up its own data and must not rely on execution order or outcomes of other tests.
- Setup and teardown hooks are required so tests succeed consistently across multiple runs.
- All new features should include appropriate tests.
- Tests should be maintainable and follow best practices.

## Unit Testing Standards

- Use Jest to test individual functions and React components in isolation.
- Use the naming convention `*.test.js` or `*.test.ts`.
- Name test files to match what they are testing.
- Example: use `app.test.js` to test `app.js`.

## Test Locations

- Backend unit tests belong in `packages/backend/__tests__/`.
- Backend integration tests belong in `packages/backend/__tests__/integration/`.
- Frontend unit tests belong in `packages/frontend/src/__tests__/`.
- End-to-end (E2E) tests belong in `tests/e2e/`.

## Integration Testing Standards

- Use Jest + Supertest to test backend API endpoints with real HTTP requests.
- Use the naming convention `*.test.js` or `*.test.ts`.
- Name integration test files based on the endpoint group or behavior they verify.
- Example: use `todos-api.test.js` for TODO API endpoint integration coverage.

## End-to-End (E2E) Testing Standards

- Use Playwright (required) to test complete UI workflows through browser automation.
- Configure Playwright to run with one browser only for this project.
- Use the Page Object Model (POM) pattern for maintainability.
- Use the naming convention `*.spec.js` or `*.spec.ts`.
- Name E2E test files based on the user journey they verify.
- Example: use `todo-workflow.spec.js` for the core TODO creation/completion journey.
- Limit E2E coverage to 5-8 critical user journeys.
- Prioritize happy paths and key edge cases over exhaustive E2E coverage.

## Port Configuration

- Always use environment variables with sensible defaults for port configuration.
- Backend standard:
	- `const PORT = process.env.PORT || 3030;`
- Frontend standard:
	- React defaults to port `3000`, and should allow override via the `PORT` environment variable.
- This enables CI/CD workflows to dynamically detect and assign ports.

## Backend Guidelines

- Test route handlers and business logic independently where possible.
- Mock external dependencies (for example databases or third-party APIs).
- Cover success cases, validation failures, and error handling.

## Frontend Guidelines

- Test components from a user perspective (rendered output and interactions).
- Keep component unit tests isolated from backend calls by mocking network requests.
- Verify key UI states such as loading, success, empty, and error.

## What to Cover in Each Unit Test

- Arrange: set up the input and required mocks.
- Act: run the function or render/interact with the component.
- Assert: verify outputs, side effects, or UI behavior.

## Maintenance

- Keep test names descriptive and behavior-oriented.
- Update tests when behavior changes intentionally.
- Remove obsolete tests that no longer reflect product behavior.
