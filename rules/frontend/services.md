# Frontend Service

- Extend `AbstractServices<IEntity>` from `../lib/AbstractService`
- Constructor: `super(\`${API_BASE_URL}/resource-path\`)` where `API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"`
- Export both the class and a singleton instance
- Inherited methods: `getAll(queryParams?)`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)`
- Custom methods use `this.http` (Axios instance) and must return typed data
- Never call `fetch` or create a new Axios instance directly
