# Express Patterns

## Controllers

Extend `BaseController<IEntity>`, export the class and a named singleton
(`export const orderController = new OrderController()`). Override an inherited method
only when the HTTP handling genuinely differs.

- A controller reads the request, calls **one** service method, and returns
  `v1Response(...)`. Anything else belongs in the service.
- Never `try/catch`: Express 5 forwards a rejected handler promise to `errorHandler`,
  which owns status codes and the error shape. A local catch produces a second, divergent
  error format.
- Never construct `IAPIV1Response` by hand, and never read the database.

## Routes

One `Router` per resource, mounted in `routes/index.ts`. Routes are a list of paths,
validators and handlers — no logic:

```typescript
router.get("/orders", orderController.getAll);
router.get("/orders/:id", validate({ params: idParamSchema }), orderController.getById);
router.post("/orders", validate({ body: createOrderSchema }), orderController.create);
router.put(
  "/orders/:id",
  validate({ params: idParamSchema, body: updateOrderSchema }),
  orderController.update
);
router.delete("/orders/:id", validate({ params: idParamSchema }), orderController.delete);
```

- Routes import controllers, validators and middleware only — never a service,
  repository or model.
- Register new modules in `routes/index.ts` **below** `routes.use(authenticateRequest)`.
  Only health probes sit above it.
- Route-level authorisation is explicit: `authorizationMiddleware([...])` for capability
  checks, or a predicate for scope-dependent ones.

## Middleware order

`app.ts` is the composition root and the order there is load-bearing:

1. `helmet`, `cors`
2. `clientTimeZoneMiddleware`, `requestContextMiddleware` — the correlation id must exist
   before anything logs
3. `morganMiddleware`
4. `express.json`, `jsonParseQueryParamsMiddleware` — controllers read `req.query.query`
5. routes, behind the rate limiter
6. `notFoundMiddleware`, then `errorHandler` — last, so everything unmatched or thrown
   lands in the standard envelope

## Middleware

Cross-cutting concerns only: authentication, authorisation, logging, validation,
sanitisation, rate limiting. No business logic and no database access. Service-specific
middleware lives in `src/middlewares/*.middleware.ts`; anything reusable belongs in
`@repo/backend`.

## Errors

Throw from the service or repository; the global `errorHandler` in `app.ts` converts it.
Status codes, `code` values and the envelope are specified in
`rules/backend/api-contract.md`.
