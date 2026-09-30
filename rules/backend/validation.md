# Request Validation

Validation happens at the HTTP edge, in `src/validators/*.validator.ts`, using zod, and
is applied by the `validate()` middleware in the route.

```typescript
// validators/order.validator.ts
export const createOrderSchema = z
  .object({
    title: z.string().trim().min(1).max(500),
    description: z.string().trim().min(1),
    owner_id: z.coerce.number().int().positive(),
    status: z.nativeEnum(OrderStatusEnum).optional(),
  })
  .strict();

export const updateOrderSchema = createOrderSchema.partial();

// routes/order.routes.ts
router.post("/orders", validate({ body: createOrderSchema }), orderController.create);
router.put(
  "/orders/:id",
  validate({ params: idParamSchema, body: updateOrderSchema }),
  orderController.update
);
```

## Rules

- **`.strict()` on every write schema.** Unknown properties are rejected rather than
  ignored, so a client typo is an error instead of a silently dropped field.
- **Never accept audit or system columns from a client:** `created_by`, `updated_by`,
  `deleted_by`, `created_at`, `updated_at`, generated reference numbers, system-computed fields. They are set
  from the request context or by the owning service. Accepting them lets a caller forge
  authorship in the audit trail.
- `validate()` replaces `req.body` with the parsed value, so coercions apply and unknown
  keys are gone by the time the controller runs. `req.query` is validated but not
  replaced — it is a getter in Express 5.
- Params are validated with `idParamSchema` from `validators/common.validator.ts`; ids
  are coerced once, there. A params schema must list **every** parameter on the route —
  zod strips what it does not describe, so a missing entry silently removes that param
  before the controller sees it.
- All failures for a request come back together as `422` with a
  `validationErrors` map — a form needs every failing field, not the first one.
- Validation covers shape. Business rules (permitted status transitions, mandatory
  fields per transition, scope checks) belong in the service, which throws
  `BadRequestError`, `ValidationError`, `ForbiddenError` or `ConflictError`.
- Validators must not import services, repositories or models.
