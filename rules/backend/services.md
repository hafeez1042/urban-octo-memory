# Backend Service

```typescript
import { BaseServices } from "@repo/backend/lib/services/BaseServices";
import { eventBus } from "@repo/backend/lib/events/eventBus";
import { IOrder } from "@repo/types/lib/schema/order";

import { orderRepository } from "../repositories/order.repository";

const EVENT_PREFIX = "order";

export class OrderService extends BaseServices<IOrder> {
  constructor() {
    super(orderRepository, { eventPrefix: EVENT_PREFIX });
  }

  reassign = async (id: number, ownerId: number, reason: string) =>
    this.runInTransaction(async () => {
      const order = await this.update(id, { owner_id: ownerId });
      eventBus.publishAfterCommit("order.reassigned", { order, reason });
      return order;
    });
}

export const orderService = new OrderService();
```

## Rules

- Extend `BaseServices<IEntity>`; export the class **and** a named singleton. No default
  export.
- Pass `eventPrefix` so CRUD emits `<prefix>.created` / `.updated` / `.deleted`, and
  publish domain-specific events explicitly with `eventBus.publishAfterCommit`.
- Business rules live here: permitted status transitions, mandatory fields per transition,
  derived values, scope checks.
- Reach the database only through `this.repository`. Never import a model, the connection
  or Sequelize.
- Multi-write operations go inside `this.runInTransaction`, including writes made through
  other repositories.
- Throw on failure — `NotFoundError`, `BadRequestError`, `ForbiddenError`,
  `ConflictError`, `ValidationError` — and never return `null` to mean "failed".
- No HTTP in a service: no `req`, no `res`, no status codes. It must be callable from a
  route, an ingestion worker or a scheduled job without change.
- Background callers open a request context first, so writes carry an actor and a channel
  (see `rules/backend/auth-and-context.md`).
- Cross-entity work goes service → service, never service → another repository.
