# API Reference

Complete API documentation for the Pools library.

## Core Classes

- [Pool](/api/pool) - Main class for managing data collections
- [PoolQuery](/api/query) - Query builder for filtering and sorting
- [PoolBinder](/api/binder) - Bind multiple pools together
- [Selectors](/api/selectors) - Built-in selection strategies

## Types

```typescript
// Entry wrapper
type PoolEntry<T> = {
  data: T;
  meta: Record<string, any>;
};

// Filter function
type Filter<T> = (entry: PoolEntry<T>) => boolean;

// Selector function
type Selector<T> = (entries: PoolEntry<T>[]) => PoolEntry<T> | null;
```

## Quick Navigation

| Class | Description |
|-------|-------------|
| [Pool](/api/pool) | Main pool class with CRUD, Map-like operations, and events |
| [PoolQuery](/api/query) | Chainable query API for filtering and sorting |
| [PoolBinder](/api/binder) | Combine multiple pools for complex selections |
| [Selectors](/api/selectors) | Built-in selectors: first, last, random, minBy, weighted |
