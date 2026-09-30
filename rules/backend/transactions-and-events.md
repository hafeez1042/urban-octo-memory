# Transactions and Domain Events

## Transactions

`BaseRepository` propagates an ambient transaction through `requestContext`. Nothing
passes a transaction as an argument.

```typescript
// Service: one atomic unit across several repositories
createWithItems = async (data: IOrder, items: IOrderItem[]) =>
  this.runInTransaction(async () => {
    const order = await this.repository.create(data);
    await orderItemRepository.bulkCreate(items.map(i => ({ ...i, order_id: order.id })));
    return order;
  });
```

- A single repository call opens its own transaction; calls inside
  `runInTransaction` join the open one, including calls on other repositories.
- Reads inside the unit of work see its uncommitted writes.
- Anything thrown rolls the whole unit back. Never catch and continue inside a
  transaction unless the partial state is genuinely valid.
- Never hold a transaction open across an external call (HTTP API, SMTP, webhook). Do
  the database work, commit, then call out — a remote timeout must not hold locks.

## Domain events

Every state change is published, so notifications, audit writing, derived-state
evaluation and webhook delivery stay out of the write path.

```typescript
class OrderService extends BaseServices<IOrder> {
  constructor() {
    super(orderRepository, { eventPrefix: "order" });   // order.created / .updated / .deleted
  }

  complete = async (id: number, note: string) => {
    const order = await this.update(id, { status: OrderStatusEnum.COMPLETED });
    eventBus.publishAfterCommit("order.completed", { order, note });
    return order;
  };
}
```

- **Publish after commit** (`publishAfterCommit`), never during. A subscriber that acts
  on a change that then rolls back sends email about a record that does not exist.
- Event names follow the project's event catalogue: `order.status.changed`,
  `order.item.added`, `user.deactivated`. Dotted, past tense, no verbs in the imperative.
- Handler failures are logged and swallowed by the bus: a broken subscriber must not
  fail the write that produced the event.
- Handlers are in-process today. Anything needing at-least-once delivery beyond this
  process (outbound webhooks) subscribes and persists to its own outbox — do not add
  retry logic to the bus.
- Payloads carry the entity and the changed fields. Subscribers must not re-read the
  entity to discover what changed.
