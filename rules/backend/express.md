# Express Patterns

**Controllers**: extend `BaseController<IEntity, Id>`. Only override inherited methods (`getAll`, `getById`, `create`, `update`, `delete`) when custom HTTP handling is needed. Export a named singleton: `export const entityController = new EntityController()`.

**Routes**: one `Router` per resource. Mount in `app.ts` under `/api/v1`. Pattern:
```typescript
router.get("/entities", entityController.getAll);
router.get("/entities/:id", entityController.getById);
router.post("/entities", entityController.create);
router.patch("/entities/:id", entityController.update);
router.delete("/entities/:id", entityController.delete);
```

**Error handling**: throw from service layer; the global `errorHandler` middleware in `app.ts` handles all errors — never catch-and-respond in a controller.

**Middleware**: cross-cutting concerns only (auth, logging, sanitization). No business logic inside middleware.

See `src/models/exampleTask.model.ts` through `src/routes/exampleTask.routes.ts` for a minimal, unmounted CRUD reference. Copy it into a real feature, register its router in `src/routes/index.ts`, and add tests before use.
