# Sequelize Model

- Extend `Model<IEntity, EntityCreationAttributes>` and implement the interface
- `CreationAttributes`: `Optional<IEntity, "id" | "created_at" | "updated_at">`
- Always set `underscored: true`; add `paranoid: true` when the entity supports soft deletion
- Explicit `tableName` (plural, snake_case)
- Declare every field from the entity interface in both the class body and `init`
- Enum columns: `DataTypes.ENUM(...Object.values(FooEnum))`
- See `src/models/exampleTask.model.ts` as the minimal reference
