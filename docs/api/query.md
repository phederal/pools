# Query

Query builder for filtering, sorting, and selecting entries from a pool.

::: tip
Create a query using `pool.query()`, then chain methods to build your query.
:::

::: tip Destructuring Option
You can use destructuring for shorter syntax. Both ways are valid:
```typescript
// With destructuring (shorter)
.where(({ data, meta }) => data.country === 'US' && meta.active)

// Without destructuring (also fine)
.where(e => e.data.country === 'US' && e.meta.active)
```
:::

## Filtering

### where()

Adds a filter to the query.

```typescript
query.where(filter: Filter<T>): Query<T>
```

**Example:**
```typescript
// Using destructuring for cleaner syntax
const result = pool
  .query()
  .where(({ data }) => data.country === 'US')
  .where(({ meta }) => meta.active === true)
  .toArray();
```

### whereOr()

Adds an OR filter (matches any of the predicates).

```typescript
query.whereOr(filters: Filter<T>[]): Query<T>
```

**Example:**
```typescript
const result = pool
  .query()
  .whereOr([
    ({ data }) => data.provider === 'A',
    ({ data }) => data.provider === 'B'
  ])
  .toArray();
```

## Sorting

### sortBy()

Sorts by a field or custom comparator.

```typescript
query.sortBy(field: keyof T, order: 'asc' | 'desc'): Query<T>
query.sortBy(compareFn: (a: PoolEntry<T>, b: PoolEntry<T>) => number): Query<T>
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
query.sortByMeta(field: string, order: 'asc' | 'desc'): Query<T>
```

**Example:**
```typescript
pool.query().sortByMeta('usedCount', 'asc');
```

## Pagination

### take()

Limits the number of results.

```typescript
query.take(count: number): Query<T>
```

**Example:**
```typescript
pool.query().take(10).toArray(); // Get first 10
```

### offset()

Skips a number of results.

```typescript
query.offset(count: number): Query<T>
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
  .where(({ data }) => data.country === 'US')
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
  .where(({ data }) => data.active)
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
  .where(({ data }) => data.active)
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
  .where(({ data }) => data.active)
  .count;
```

## Chaining Example

```typescript
const result = pool
  .query()
  // Filter by country
  .where(({ data }) => data.country === 'US')
  // Filter by active status
  .where(({ meta }) => meta.active === true)
  // Allow multiple providers
  .whereOr([
    ({ data }) => data.provider === 'A',
    ({ data }) => data.provider === 'B'
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
