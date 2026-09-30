# Vite Folder Structure

```
frontend/web/
  index.html
  public/favicon.svg
  playwright.config.ts
  e2e/
    fixtures/             # storage state per role, API route-mocking helpers
    <feature>.spec.ts     # one spec per feature folder — mandatory
  src/
    main.tsx              # Vite bootstrap
    App.tsx               # providers + router; imports the shell stylesheet
    routes/router.tsx     # route table; every route lives here
    features/
      <feature>/
        <Feature>Page.tsx     # page-level UI, consumes query/mutation hooks
        components/           # components used only by this feature
    components/
      layout/             # AppLayout, AppHeader, AppSidebar, ProtectedRoute
      common/             # display components shared by several features
      ui/                 # shadcn/Radix primitives
      PanelHeader.tsx     # shared building blocks
    providers/            # React context providers (app scope, auth)
    hooks/                # shared hooks, including useQuery
    queries/              # useGet*.ts — read hooks
    mutations/            # use*.ts — write hooks
    services/             # *.service.ts — one per API resource
    lib/                  # AbstractServices, HTTP, utilities
    errors/               # API error types
    mocks/                # placeholder data used as `defaultValue` until the API exists
    styles/               # tokens, fonts, shell and auth CSS
    types/                # frontend-only implementation types
```

```
public/
  fonts/                  # self-hosted woff2 subsets, served at /fonts/…
  favicon.svg
```

- Feature directories are `kebab-case`; page files are `PascalCase.tsx`.
- A page belongs to exactly one feature. A display component used by several features
  moves up to `components/common/` rather than being imported across features.
- `App.tsx` composes providers and the router only — no layout, no data fetching.
- Components never import from `mocks/` or from a `*.service.ts`. Mock data enters
  through a query hook's `defaultValue`, which is what lets the UI run before the API
  exists (`VITE_ENABLE_API` off). `e2e/` may import `mocks/` — it is the one exception, so
  specs and hook defaults share one fixture source.
- Every folder in `features/` has a matching `e2e/<feature>.spec.ts`. Adding or changing a
  feature includes updating it — `rules/testing/playwright-e2e.md`.
- Vite renders exclusively on the client; use hooks wherever interactivity or data access
  is needed.
