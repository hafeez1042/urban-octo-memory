# Authentication, Authorisation and Request Context

## Request context

`requestContext` (AsyncLocalStorage, `@repo/backend/lib/context/requestContext`) carries
the correlation id, channel, acting user and open transaction for the life of a request.
It is opened by `requestContextMiddleware` and is the reason nothing has to thread an
actor or a transaction through call signatures.

```typescript
requestContext.requestId();   // correlation id, echoed as the x-request-id header
requestContext.actorId();     // local users.id — stamped onto created_by/updated_by
requestContext.channel();     // Web | Api | Job | System
requestContext.transaction(); // ambient transaction, if a unit of work is open
```

- Background work (ingestion workers, scheduled jobs) must open its own context with
  `requestContext.run({ channel: ActionChannelEnum.JOB, actor })`.
  Without it, writes have no actor and the audit trail records "System" for work that had
  a real cause.
- Never pass the actor as a function parameter to get around this, and never read it from
  `req` below the controller.

## Authentication

An OIDC provider (Microsoft Entra ID by default) is the only identity provider for
interactive users. The service
validates tokens; it never stores passwords.

- `authenticate({ verifier, resolveActor })` validates the bearer token on **every**
  request — a user disabled in the directory loses access at the next call.
- `AUTH_MODE=entra` validates signature, issuer, audience and expiry against the tenant
  JWKS. `AUTH_MODE=dev` accepts an unsigned base64url principal for local work and is
  refused when `NODE_ENV=production`.
- MFA, Conditional Access and device compliance are enforced by Entra ID before a token
  exists. Never re-implement, approximate or bypass them.
- `resolveActor` maps the verified principal to a local `users` row, provisioning it just
  in time on first sign-in. Group-to-role and group-to-scope mapping belongs behind that
  method.
- Health probes are the only unauthenticated routes.

## Authorisation

- Effective access is **role ∩ scope**. A permission alone never grants access to a
  scoped record; scope (the organisation, team or resource the actor has a grant on) is
  applied in the query.
- Enforce in the API, never only in the interface: `authorizationMiddleware(["order.reassign"])`
  for capability checks, `authorizationMiddleware(req => canSeeOrder(req))` for
  scope-dependent ones.
- Scope filters belong in the repository query, not in a post-filter over results: a
  filtered page still leaks totals, and a post-filter breaks pagination.
- Reports, exports, search and aggregate endpoints honour the same scope as a single
  record read.
- Every change to a capability check, a scope filter or a route's placement relative to
  `authenticateRequest` ships the security tests in `rules/testing/security-tests.md`, and
  they pass. A scope leak is not visible in a build, a type check or a happy-path test —
  only in a test that asserts a restricted actor gets neither the record nor the count.
