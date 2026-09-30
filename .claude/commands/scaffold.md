Run the entity scaffolder for this project and guide the user through completing the generated files.

## Steps

1. **Parse the entity name** from $ARGUMENTS. If empty, stop and tell the user: `Usage: /scaffold <EntityName>  e.g. /scaffold Order`

2. **Run the scaffold script**:
   ```
   pnpm scaffold <EntityName>
   ```
   Show the output. If it fails, diagnose and fix before continuing.

3. **Read the generated type file** at `packages/types/src/schema/<snake_case>.ts`.

4. **Ask the user** (single question): "What fields does `<EntityName>` need? List them with their types, e.g.: `name: string, user_id: number, due_at?: Date, status?: <EntityName>StatusEnum`"

5. **Update the type file** — replace the `// TODO: add domain fields here` comment with the fields the user described. Keep the `StatusEnum` at the bottom; update its values if custom ones were given, or delete it if the entity has no status.

6. **Update the model file** at `services/core/src/models/<snake_case>.model.ts`:
   - Add public field declarations to the class body (between `public id!: number;` and `public created_by?`)
   - Add the matching `DataTypes` column definitions in `Model.init()` (between the `id` column and `created_by`)
   - Use the correct `DataTypes` mapping:
     - `string` → `DataTypes.TEXT` (or `DataTypes.STRING(n)` if length matters)
     - `number` (integer) → `DataTypes.INTEGER` or `DataTypes.BIGINT` (foreign keys: `BIGINT`)
     - `number` (decimal) → `DataTypes.DECIMAL(10, 2)`
     - `boolean` → `DataTypes.BOOLEAN`
     - `Date` → `DataTypes.DATE`
     - `FooEnum` → `DataTypes.ENUM(...Object.values(FooEnum))` — also add the enum import
   - For a status field using the `StatusEnum`, add `allowNull: false` and
     `defaultValue: <EntityName>StatusEnum.ACTIVE`

7. **Update the migration** at `services/core/src/database/migrations/<timestamp>-create-<plural>.js`:
   - Add the same columns, in the same order, between `idColumn(Sequelize)` and `auditColumns(Sequelize)`
   - Enum columns: `Sequelize.ENUM(...values)` with the literal values, and drop the type
     in `down`: `DROP TYPE IF EXISTS "enum_<table>_<column>"`
   - Foreign keys: add a constraint referencing the parent table with
     `onDelete: "SET NULL"` (or `"CASCADE"` only for rows that genuinely cannot outlive
     the parent, such as an item on an order)
   - Add indexes for the columns this table will be filtered and sorted by
   - The model and the migration must agree exactly — a model field with no column fails
     at runtime

8. **Update the validator** at `services/core/src/validators/<snake_case>.validator.ts` —
   describe the writable fields only. Never include `created_by`, `updated_by`,
   `deleted_by` or timestamps.

9. **Add associations** in `services/core/src/models/index.ts` inside `initAssociations()`
   for any foreign key introduced.

10. **Fill in `getSearchQuery`** in the repository if the entity is searchable, renaming
    `_searchText` to `searchText`.

11. **Write the tests** — the scaffolder does not generate them, and the entity is not
    done without them (`rules/testing/overview.md`):
    - `services/core/tests/api/<plural>.test.ts` — contract, envelope, pagination,
      validation rejections, soft delete
    - `services/core/tests/services/<snake_case>.service.test.ts` — rules, transactions,
      events
    - `services/core/tests/security/<plural>.security.test.ts` — **mandatory**: 401, 403,
      out-of-scope record and collection (rows *and* `meta.total`), client-supplied
      `created_by`/`role`/`id` ignored, injection in `q`/`filter`/`orderBy`/`expand`
      (`rules/testing/security-tests.md`)
    - `frontend/web/e2e/<feature>.spec.ts` once the entity has a UI
      (`rules/testing/playwright-e2e.md`)

12. **Verify**:
    ```
    pnpm --filter @repo/types build
    pnpm --filter @services/core build && pnpm --filter @services/core lint
    pnpm --filter @services/core test
    ```
    Then, if a database is reachable: `pnpm --filter @services/core db:migrate`

    Fix any failure and re-run until green. Never skip or weaken a test to finish.

13. **Print a completion summary** showing:
    - Every created file (clickable relative paths)
    - The registered route: `GET|POST|PUT|DELETE /api/v1/<plural>`
    - Test results, including any suite that skipped and why
    - Whether the migration has been applied, and the command to apply it
