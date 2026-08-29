# Backend Folder Structure

```
services/core/src/
  config/           # DB and environment configuration
  controllers/      # *.controller.ts — extend BaseController<T>
  services/         # *.service.ts    — extend BaseServices<T>
  repositories/     # *.repository.ts — extend BaseRepository<T>
  models/           # *.model.ts      — Sequelize Model classes
  routes/           # *.routes.ts     — Router instances, registered in app.ts
  middlewares/      # *.middleware.ts
  app.ts
```

File suffix naming is mandatory. Use `index.ts` only for route registration or barrel exports.
