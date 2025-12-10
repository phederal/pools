# Pools

> Lightweight TypeScript library for managing data collections with filters, sorting, and composition

## What is Pools?

**Pools** is a modern TypeScript library that replaces arrays, objects, and Maps with a powerful abstraction for working with collections. Think of it as a smart wrapper around your data that gives you filtering, sorting, metadata tracking, and pool composition out of the box.

### Not a replacement for:
- ORMs or databases
- Processing millions of records
- Enterprise frameworks

### Perfect for:
- Daily work with collections in memory
- Managing pools of resources (proxies, accounts, sessions)
- Quick prototyping with typed data
- Building tools that need smart data selection

## Quick Start

```bash
bun install pools
```

```typescript
import { Pool, Selectors } from 'pools';

interface Proxy {
  ip: string;
  country: string;
  speed: number;
}

const proxies = new Pool<Proxy>();

// Add data with metadata
proxies.add(
  { ip: '1.1.1.1', country: 'US', speed: 100 },
  { usedCount: 0, active: true }
);

// Query with filters and sorting
const bestProxy = proxies
  .query()
  .where(e => e.data.country === 'US')
  .where(e => e.meta.active === true)
  .sortBy('speed', 'desc')
  .select(Selectors.first);

console.log(bestProxy); // { ip: '1.1.1.1', country: 'US', speed: 100 }
```

## Features

- 🔍 **Query API** - Chainable filters, sorting, and selection
- 🗺️ **Map-like Operations** - get(), has(), set(), delete()
- 🔄 **Iteration Methods** - forEach, map, filter, reduce, and more
- 🎯 **Smart Selectors** - random, weighted, minBy, and custom
- 🔗 **Pool Binding** - Combine multiple pools for complex selections
- 📊 **Metadata Tracking** - Attach metadata to any entry
- ⚡ **Events** - Listen to add, remove, get, set operations
- 🛡️ **Type-Safe** - Full TypeScript support with generics

## Core Concepts

### PoolEntry&lt;T&gt;

Every item in a pool is wrapped in a `PoolEntry`:

```typescript
type PoolEntry<T> = {
  data: T;              // Your data
  meta: Record<string, any>; // Metadata (usage stats, flags, etc.)
};
```

### Filter&lt;T&gt;

A function that decides whether to include an entry:

```typescript
type Filter<T> = (entry: PoolEntry<T>) => boolean;

// Example
const usFilter = (e) => e.data.country === 'US';
```

### Selector&lt;T&gt;

A function that picks one entry from filtered results:

```typescript
type Selector<T> = (entries: PoolEntry<T>[]) => PoolEntry<T> | null;

// Built-in selectors
Selectors.first    // First entry
Selectors.last     // Last entry
Selectors.random   // Random entry
Selectors.minBy('field')  // Entry with minimum value
Selectors.weighted(fn)    // Weighted random
```

## Next Steps

- [API Reference](/api/) - Complete API documentation
- [Examples](/examples/) - Real-world usage examples
- [GitHub](https://github.com/yourusername/pools) - Source code
