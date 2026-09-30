# Security Tests

Security coverage is not optional and not "when there is time". Any change that adds or
touches a route, a validator, an authorisation check, a scope filter, a query builder, an
export, a report, a webhook or an inbound integration path must add the applicable cases below,
and they must all pass before the change is done. Visibility in this system is
**role ∩ scope** (`rules/backend/auth-and-context.md`); a bug here leaks another
scope's records, so treat a missing case as a defect.

Cases live in `services/core/tests/security/<resource>.security.test.ts`.

## Mandatory cases per endpoint

**Authentication**
- No bearer token → `401`, no data in the body.
- Malformed, expired, wrong-issuer and wrong-audience tokens → `401`, each asserted
  separately.
- The route sits below `authenticateRequest` in `routes/index.ts`. Only health probes are
  exempt, and a test asserts that list has not grown.

**Authorisation (role)**
- An actor without the required capability → `403`, for every mutating verb on the
  resource.
- A capability that grants read must not grant write: assert the read passes and the write
  is refused with the same actor.

**Scope**
- An actor scoped to organisation/team/owned resource A requesting a record in B → `404` or `403`
  per `rules/backend/api-contract.md`, never the record.
- The same actor listing the collection sees only in-scope rows **and** an in-scope
  `meta.total`. A correct page with a global total is still a leak.
- Search, filters, `q`, sort, `expand`, exports, reports and aggregate counts are each
  asserted under the restricted actor. These are the paths that get missed.
- Scope is applied in the query: a filter or an `orderBy` naming an out-of-scope relation
  must not widen the result set.

**Input handling**
- Unknown or extra body fields → `422` (validators are `.strict()`).
- Privilege fields cannot be set from the client: `role`, `organisation_id`, `team_id`, `owner_id`,
  `created_by`, `updated_by`, `deleted_by`, `id`, timestamps. Send each and assert it was
  ignored or rejected, never applied.
- IDOR: a valid-shaped id belonging to another actor's scope is refused.
- Injection payloads in `q`, `filter`, `orderBy` and `expand` — SQL metacharacters, a
  non-existent column, an object where a scalar is expected — are rejected by validation or
  parameterised, never interpolated into SQL.
- Oversized payloads and an over-limit `limit` are rejected rather than served.
- Stored XSS: a payload submitted in a text field comes back escaped/encoded, and the
  matching Playwright spec asserts it renders as text and does not execute.

**Behaviour under abuse**
- Rate-limited routes return `429` past the threshold and the limit is per actor, not
  global.
- Inbound integrations are idempotent: the same idempotency key delivered twice creates one
  record and one activity entry.
- The activity log is append-only: an update or delete attempt is refused for every role,
  Administrator included.

**Error hygiene**
- No error response contains a stack trace, a SQL fragment, an internal path or a hostname.
  Assert the body shape, not only the status.
- A refused request is not distinguishable from a non-existent one where that distinction
  would itself leak existence.

## Rules

- Assert the refusal **and** the absence of data. A test that only checks the status code
  passes against an endpoint that returns `403` with the record attached.
- One actor per test, stated explicitly. Never reuse an administrator client for a
  restriction test.
- A security test never mocks the authorisation middleware or the scope filter under test —
  that removes exactly what is being verified. Fake the repository data, not the guard.
- Never relax, skip or delete a failing security test. Fix the code. If a case cannot pass
  because the feature is genuinely unimplemented, leave the test failing and report it
  rather than removing it.
