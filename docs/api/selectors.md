# Selectors

Built-in selection strategies for choosing entries from a pool.

## Overview

Selectors are functions that pick a single entry from an array of entries. They're used with `pool.query().select()`.

```typescript
type Selector<T> = (entries: PoolEntry<T>[]) => PoolEntry<T> | null;
```

## Built-in Selectors

### first

Selects the first entry.

```typescript
Selectors.first<T>(entries: PoolEntry<T>[]): PoolEntry<T> | null
```

**Example:**

```typescript
const first = pool.query().select(Selectors.first);
```

### last

Selects the last entry.

```typescript
Selectors.last<T>(entries: PoolEntry<T>[]): PoolEntry<T> | null
```

**Example:**

```typescript
const last = pool.query().select(Selectors.last);
```

### random

Selects a random entry.

```typescript
Selectors.random<T>(entries: PoolEntry<T>[]): PoolEntry<T> | null
```

**Example:**

```typescript
const random = pool.query().select(Selectors.random);
```

### minBy()

Creates a selector that picks the entry with the minimum value for a field.

```typescript
Selectors.minBy<T>(field: string): Selector<T>
```

Checks both `data` and `meta` for the field (prefers `data`).

**Examples:**

```typescript
// Minimum by data field
const leastUsed = pool.query().select(Selectors.minBy('usedCount'));

// Minimum by meta field
const lowestPriority = pool.query().select(Selectors.minBy('priority'));
```

### weighted()

Creates a weighted random selector.

```typescript
Selectors.weighted<T>(weightFn: (entry: PoolEntry<T>) => number): Selector<T>
```

Higher weight = higher probability of selection.

**Examples:**

```typescript
// Prefer less-used entries
const proxy = pool.query().select(Selectors.weighted((e) => 1 / (e.meta.usedCount + 1)));

// Prefer higher-speed entries
const proxy = pool.query().select(Selectors.weighted(({ data }) => data.speed));

// Custom weight function
const proxy = pool.query().select(
	Selectors.weighted((e) => {
		const speed = e.data.speed;
		const usage = e.meta.usedCount;
		return speed / (usage + 1);
	})
);
```

::: tip Zero Weights
If all weights are zero, falls back to random selection.
:::

## Custom Selectors

You can create your own selectors:

```typescript
import type { Selector, PoolEntry } from 'pools';

// Select entry with longest name
const longestName: Selector<User> = (entries) => {
	if (entries.length === 0) return null;

	return entries.reduce((longest, entry) => {
		return entry.data.name.length > longest.data.name.length ? entry : longest;
	});
};

// Use it
const user = pool.query().select(longestName);
```

## Combining with Query

Selectors work perfectly with the query API:

```typescript
import { Selectors } from 'pools';

// Random US proxy
const proxy = pool
	.query()
	.where(({ data }) => data.country === 'US')
	.select(Selectors.random);

// Least-used active proxy
const proxy = pool
	.query()
	.where(({ meta }) => meta.active === true)
	.orderBy('speed', 'desc')
	.select(Selectors.minBy('usedCount'));

// Weighted selection based on speed and usage
const proxy = pool
	.query()
	.where(({ data }) => data.country === 'US')
	.select(
		Selectors.weighted((e) => {
			return e.data.speed / (e.meta.usedCount + 1);
		})
	);
```

## Selector Patterns

### Load Balancing

```typescript
// Select least-used server
const server = servers
	.query()
	.where(({ meta }) => meta.healthy)
	.select(Selectors.minBy('activeConnections'));
```

### Failover

```typescript
// Try primary, fallback to secondary
let server = servers
	.query()
	.where(({ data }) => data.type === 'primary')
	.select(Selectors.first);

if (!server) {
	server = servers
		.query()
		.where(({ data }) => data.type === 'secondary')
		.select(Selectors.random);
}
```

### Weighted Distribution

```typescript
// Distribute based on server capacity
const server = servers
	.query()
	.where(({ meta }) => meta.available)
	.select(Selectors.weighted(({ data }) => data.capacity));
```

### Round-Robin (with metadata)

```typescript
// Track last selected index
pool.on('get', (entry) => {
	entry.meta.lastSelectedAt = Date.now();
});

// Select least recently used
const item = pool.query().select(Selectors.minBy('lastSelectedAt'));
```
