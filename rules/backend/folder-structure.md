# Backend Folder Structure

```
services/core/
  .sequelizerc
  src/
    app.ts               # composition root — builds the app, does not listen
    server.ts            # bootstrap — associations, DB check, listen, graceful shutdown
    config/
      env.ts             # zod-validated environment; the only reader of process.env
      database.ts        # the Sequelize instance
      logger.ts          # winston + correlation id; bridges @repo/backend's logger
      swagger.ts         # OpenAPI assembly
    controllers/         # *.controller.ts — extend BaseController<T>
    services/            # *.service.ts    — extend BaseServices<T>
    repositories/        # *.repository.ts — extend BaseRepository<T>
    models/              # *.model.ts + index.ts (associations)
    routes/              # *.routes.ts     — Router instances, registered in routes/index.ts
    validators/          # *.validator.ts  — zod request schemas
    middlewares/         # *.middleware.ts — service-specific middleware
    swagger/             # *.swagger.ts    — OpenAPI annotations only, no runtime code
    database/
      config.js          # sequelize-cli connection config
      helpers/           # shared migration column sets
      migrations/        # schema history
      seeders/           # reference data
  vitest.config.ts
  tests/
    setup.ts             # env defaults, context helpers, fake reset
    helpers/             # supertest client, actors, in-memory repository fakes
    api/                 # *.test.ts — HTTP contract per resource
    services/            # *.test.ts — business rules, transactions, events
    security/            # *.security.test.ts — auth, role, scope, injection (mandatory)
```

Shared, service-agnostic building blocks live in `@repo/backend` and are imported from
`@repo/backend/lib/**` — the compiled output, never `src/**`:

```
packages/backend/src/
  auth/            # token verifiers (Entra ID, dev) behind ITokenVerifier
  context/         # requestContext (AsyncLocalStorage)
  controller/      # BaseController, ICRUDController
  errors/          # error classes + errorHandler
  events/          # eventBus, IDomainEvent
  helpers/         # logger seam
  middleware/      # request context, auth, authorisation, morgan, 404, query parsing
  repositories/    # BaseRepository, BaseVersionedRepository, IBaseRepository
  services/        # BaseServices, IBaseServices
  utils/           # response envelope, Sequelize query translation
  validation/      # validate() middleware
```

- File suffixes are mandatory: `*.controller.ts`, `*.service.ts`, `*.repository.ts`,
  `*.model.ts`, `*.routes.ts`, `*.validator.ts`, `*.middleware.ts`, `*.swagger.ts`,
  `*.test.ts`.
- `src/**` never imports from `tests/**`. Tests import from `src/**`, including `app.ts`,
  and are the only place a repository may be replaced by a fake — see
  `rules/testing/backend-tests.md`.
- `index.ts` is only for barrels — `routes/index.ts` (registration) and `models/index.ts`
  (associations).
- Add an entity with `pnpm scaffold <EntityName>`; do not hand-write the generated files.
