# Repository

```typescript
import { Op, WhereOptions } from "sequelize";

import { BaseRepository } from "@repo/backend/lib/repositories/BaseRepository.sequelize";
import { IOrder } from "@repo/types/lib/schema/order";

import { Order } from "../models/order.model";

export class OrderRepository extends BaseRepository<IOrder> {
  constructor() {
    super(Order);
  }

  protected getAllIncludeable = [{ model: User, as: "owner" }];

  getSearchQuery = (searchText: string): WhereOptions<IOrder> => ({
    [Op.or]: [
      { reference: { [Op.iLike]: `%${searchText}%` } },
      { title: { [Op.iLike]: `%${searchText}%` } },
    ],
  });
}

export const orderRepository = new OrderRepository();
```

## Rules

- Extend `BaseRepository<IEntity>`; export the class **and** a named singleton. No
  default export, and no `as any` on the model — the base class is typed for
  `ModelStatic`.
- Implement `getSearchQuery`. Return `{}` for entities that are not searchable.
- All database access lives here. Sequelize, the connection and raw SQL appear in no
  other layer.
- Inherited and sufficient for nearly everything: `getAll`, `getPage`,
  `getAllWithCursor`, `count`, `getById`, `findOne`, `create`, `update`, `updateMany`,
  `delete`, `bulkCreate`, `bulkUpdate`, `bulkDelete`, `runInTransaction`.
- Inherited behaviour never reimplemented per entity: transaction propagation, actor
  stamping (`created_by`/`updated_by`/`deleted_by`), soft-delete visibility, and query
  translation from `IQueryStringParams`.
- Eager loading goes through `getAllIncludeable` / `getByIdIncludeable` /
  `findOneIncludeable`, applied when the caller passes `expand`. Never eager-load
  unconditionally — list views pay for it on every row.
- Custom finders return plain data and accept `IQueryStringParams` where they filter, so
  scope, pagination and search keep working.
- Throw `NotFoundError`, `ConflictError` and the other classes from
  `@repo/backend/lib/errors/*`. Never `throw new Error("Not Found")`, and never return
  `null` to signal a failure the caller must interpret.
- Scope restrictions (organisation, team, owned resource) are conditions in the query, not a
  filter over results — a post-filter still leaks totals and breaks pagination.
- Versioned configuration entities (policies, templates, rules) extend
  `BaseVersionedRepository` instead: an update writes a new version rather than
  overwriting, and `history()` returns the chain.
