# Query Operations

Create queries for filtering, sorting, and selecting entries.

## query()

Creates a query builder for filtering and selecting entries.

```typescript
pool.query(): Query<T>
```

**Returns:** A new Query instance

**Example:**
```typescript
const user = pool
  .query()
  .where(e => e.data.country === 'US')
  .where(e => e.meta.active === true)
  .sortBy('age', 'desc')
  .select(Selectors.first);
```

See the [Query API](/api/query) for full query capabilities.
