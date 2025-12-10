# PoolQuery

Query builder for filtering, sorting, and selecting entries from a pool.

::: tip
Create a query using `pool.query()`, then chain methods to build your query.
:::

## Filtering

### where()

Adds a filter to the query.

```typescript
query.where(filter: Filter<T>): PoolQuery<T>
```

**Example:**
```typescript
const result = pool
  .query()
  .where(e => e.data.country === 'US')
  .where(e => e.meta.active === true)
  .toArray();
```

### whereOr()

Adds an OR filter (matches any of the predicates).

```typescript
query.whereOr(filters: Filter<T>[]): PoolQuery<T>
```

**Example:**
```typescript
const result = pool
  .query()
  .whereOr([
    e => e.data.provider === 'A',
    e => e.data.provider === 'B'
  ])
  .toArray();
```

## Sorting

### sortBy()

Sorts by a field or custom comparator.

```typescript
query.sortBy(field: keyof T, order: 'asc' | 'desc'): PoolQuery<T>
query.sortBy(compareFn: (a: PoolEntry<T>, b: PoolEntry<T>) => number): PoolQuery<T>
```

**Examples:**
```typescript
// By field
pool.query().sortBy('speed', 'desc');

// Custom comparator
pool.query().sortBy((a, b) => b.data.speed - a.data.speed);
```

### sortByMeta()

Sorts by a metadata field.

```typescript
query.sortByMeta(field: string, order: 'asc' | 'desc'): PoolQuery<T>
```

**Example:**
```typescript
pool.query().sortByMeta('usedCount', 'asc');
```

## Pagination

### take()

Limits the number of results.

```typescript
query.take(count: number): PoolQuery<T>
```

**Example:**
```typescript
pool.query().take(10).toArray(); // Get first 10
```

### offset()

Skips a number of results.

```typescript
query.offset(count: number): PoolQuery<T>
```

**Example:**
```typescript
pool.query().offset(20).take(10).toArray(); // Get 10 items starting from 20
```

## Materialization

### select()

Selects a single entry using a selector.

```typescript
query.select(selector: Selector<T>): T | null
```

**Example:**
```typescript
import { Selectors } from 'pools';

const proxy = pool
  .query()
  .where(e => e.data.country === 'US')
  .select(Selectors.random);
```

### toArray()

Returns all filtered and sorted entries as an array.

```typescript
query.toArray(): T[]
```

**Example:**
```typescript
const users = pool
  .query()
  .where(e => e.data.active)
  .sortBy('name', 'asc')
  .toArray();
```

### toPool()

Converts the query to a new Pool.

```typescript
query.toPool(): Pool<T>
```

**Example:**
```typescript
const activeUsers = pool
  .query()
  .where(e => e.data.active)
  .toPool();
```

### count

Gets the count of filtered entries.

```typescript
query.count: number
```

**Example:**
```typescript
const activeCount = pool
  .query()
  .where(e => e.data.active)
  .count;
```

## Chaining Example

```typescript
const result = pool
  .query()
  // Filter by country
  .where(e => e.data.country === 'US')
  // Filter by active status
  .where(e => e.meta.active === true)
  // Allow multiple providers
  .whereOr([
    e => e.data.provider === 'A',
    e => e.data.provider === 'B'
  ])
  // Sort by speed (descending)
  .sortBy('speed', 'desc')
  // Sort by usage (ascending)
  .sortByMeta('usedCount', 'asc')
  // Skip first 10
  .offset(10)
  // Take next 5
  .take(5)
  // Get as array
  .toArray();
```
