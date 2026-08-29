# Repository

- Extend `BaseRepository<IEntity, Id>` from `@repo/backend/lib/repositories/BaseRepository.sequelize`
- Constructor: `super(EntityModel as never)`
- Must implement `getSearchQuery = (searchText: string): WhereOptions<IEntity> => ({...})`
- Export a named singleton: `export const entityRepository = new EntityRepository()`
- All DB access lives here — never in services or controllers
- Use inherited methods: `getAll`, `getById`, `findOne`, `create`, `update`, `delete`, `bulkCreate`, `bulkUpdate`, `bulkDelete`, `getAllWithCursor`
- Add custom query methods only when inherited methods are insufficient
