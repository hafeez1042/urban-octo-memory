# Playwright End-to-End Tests

Every feature ships with a Playwright spec. Every change to an existing feature updates
that feature's spec in the same commit.

## Layout

```
frontend/web/
  playwright.config.ts        # webServer: vite preview on a fixed port, baseURL, trace on-first-retry
  e2e/
    fixtures/
      auth.ts                 # signed-in storage state per role
      api.ts                  # route-mocking helpers built on page.route
    orders.spec.ts            # one spec file per feature, named after the feature folder
    orders.detail.spec.ts     # split by flow when a feature grows past ~200 lines
```

A spec file mirrors a folder in `src/features/`. If a feature has no spec file, the feature
is incomplete.

## Isolation

Specs run against the built app with the API **mocked at the network boundary** through
`page.route("**/api/v1/**", ...)`. That keeps the suite runnable with no backend, no
database and no Entra ID tenant, and lets a spec assert how the UI behaves on a 401, a 403,
a 422 with `validationErrors`, a 500 and a slow response — states a live backend will not
produce on demand.

- Mock responses must be real `IAPIV1Response` envelopes, including `meta` for
  collections. A mock that omits the envelope tests nothing.
- Reuse `src/mocks/` as the source of fixture data so specs and query-hook defaults do not
  drift. This is the one place outside a query hook that may import `mocks/`.
- Authentication comes from a saved `storageState` per role, never by driving a real
  sign-in.
- A spec that must exercise the real API is named `*.fullstack.spec.ts` and is skipped
  unless `E2E_API_URL` is set. Never make it the only coverage for a flow.

## Writing a spec

- Select by role and accessible name — `getByRole`, `getByLabel`, `getByText`. Use
  `data-testid` only where no accessible handle exists. Never select by Tailwind class or
  DOM position.
- Use web-first assertions (`await expect(locator).toBeVisible()`), which retry. Never
  `waitForTimeout`, never a bare `sleep`, never assert on a `setTimeout`.
- One flow per test, independent of every other test, in any order. No shared mutable
  module state between tests.
- Assert on user-visible outcomes: the row appears in the list, the toast text, the field
  error under the input, the redirect target. Not on component internals.
- **Make served data distinguishable from the placeholder.** A query hook shows its
  `defaultValue` — real mock data — while the request is in flight, so asserting on an
  unmodified mock value passes before the response arrives and proves nothing. Rewrite a
  field in the fixture (`ORD-` → `API-`) and assert on that, and assert the placeholder
  value is gone.

## Coverage each feature owns

For every feature, the spec covers:

1. The happy path end to end.
2. Empty state and loading state.
3. A validation failure — a 422 with `validationErrors` renders per-field messages.
4. An authorisation failure — a 403 shows a refusal and does **not** render the data or
   leave the action affordance enabled.
5. An unexpected failure — a 500 shows an error surface and does not white-screen.
6. Every role that sees the feature differently: an action the current role lacks must be
   absent or disabled, not merely rejected after a click.

## Fixing failures

Read the trace (`playwright-report/`) before changing anything. A flake is a defect: fix
the missing await, the unstable locator or the missing mock. Never add a retry to hide it,
and never mark a test `.skip` to finish the task.
