# General Conventions

- `camelCase` — variables, functions
- `PascalCase` — classes, components, interfaces, enums
- `UPPER_SNAKE_CASE` — global constants
- `IFoo` prefix — interfaces; `FooEnum` suffix — enums
- Named exports only (except Next.js `page.tsx` / `layout.tsx`)
- Library imports before local imports
- 2-space indent, semicolons, trailing commas (Prettier enforced)
- Comments explain *why*, not *what* — omit self-evident comments
- Early returns to reduce nesting; functions do one thing
- No magic numbers — extract to named constants
