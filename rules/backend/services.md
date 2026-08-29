# Backend Service

- Extend `BaseServices<IEntity, Id>` from `@repo/backend/lib/services/BaseServices`
- Constructor: `super(entityRepository)`
- Export a named singleton: `export const entityService = new EntityService()`
- Business logic lives here — throw custom errors (`NotFoundError`, `BadRequestError`, etc.) from `@repo/backend/lib/errors/`
- Never return `null` to indicate failure; always throw
- Access DB only via `this.repository` — never import models directly
