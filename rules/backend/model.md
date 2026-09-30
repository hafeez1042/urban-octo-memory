# Sequelize Model

```typescript
import { DataTypes, Model, Optional } from "sequelize";

import { IOrder, OrderStatusEnum } from "@repo/types/lib/schema/order";

import { sequelize } from "../config/database";

type IOrderCreationAttributes = Optional<
  IOrder,
  "id" | "created_at" | "updated_at"
>;

export class Order
  extends Model<IOrder, IOrderCreationAttributes>
  implements IOrder
{
  public id!: number;
  public title!: string;
  public status?: OrderStatusEnum;
  public created_by?: number;
  public updated_by?: number;
  public deleted_at?: Date;
  public deleted_by?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Order.init(
  { /* columns */ },
  { sequelize, tableName: "orders", underscored: true, paranoid: true }
);
```

## Rules

- Named export of the class. No default export.
- Import the connection as `{ sequelize }` from `../config/database`.
- Creation attributes are a `type` alias, not an empty interface.
- `underscored: true` and `paranoid: true` on every model — snake_case columns and soft
  delete. Records are never hard-deleted: records, their history and their audit entries
  are retained.
- Declare every `IBaseAttributes` and `ISoftDeleteAttributes` field in the class body and
  in `init`. `BaseRepository` stamps `created_by`, `updated_by` and `deleted_by`, and can
  only do so for declared columns.
- Enum columns: `DataTypes.ENUM(...Object.values(FooEnum))`, with the same values in the
  migration. Adding a value to the enum needs a migration.
- **The model never creates the schema.** Every column here has a matching column in a
  migration (see `rules/backend/migrations.md`).
- Associations go in `models/index.ts` inside `initAssociations()`, never in the model
  file — mutually referential associations declared in model files resolve to `undefined`
  depending on import order.
- Models import nothing from repositories, services or controllers.
- Reference implementation: `services/core/src/models/user.model.ts`.
