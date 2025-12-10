# Pool

Main class for managing collections of data with metadata.

## Constructor

```typescript
const pool = new Pool<T>();
```

## CRUD Operations

### add()

Adds an entry to the pool.

```typescript
pool.add(data: T, meta?: Record<string, any>): PoolEntry<T>
```

**Example:**
```typescript
pool.add({ id: '1', name: 'test' }, { active: true });
```

### addBatch()

Adds multiple entries at once.

```typescript
pool.addBatch(entries: Array<{ data: T; meta?: Record<string, any> }>): void
```

**Example:**
```typescript
pool.addBatch([
  { data: { id: '1', name: 'test1' } },
  { data: { id: '2', name: 'test2' } },
]);
```

### remove()

Removes entries matching a predicate.

```typescript
pool.remove(predicate: (data: T) => boolean): T[]
```

**Example:**
```typescript
const removed = pool.remove(data => data.id === '1');
```

### removeBatch()

Removes multiple entries using multiple predicates.

```typescript
pool.removeBatch(predicates: Array<(data: T) => boolean>): T[]
```

## Map-like Operations

### get()

Gets an entry by field value or predicate.

```typescript
pool.get(key: keyof T, value: any): T | null
pool.get(predicate: (entry: PoolEntry<T>) => boolean): T | null
```

**Examples:**
```typescript
// By field
const user = pool.get('id', 'user123');

// By predicate
const admin = pool.get(({ data }) => data.role === 'admin');
```

### has()

Checks if an entry exists.

```typescript
pool.has(key: keyof T, value: any): boolean
pool.has(predicate: (entry: PoolEntry<T>) => boolean): boolean
```

**Examples:**
```typescript
if (pool.has('id', 'user123')) {
  console.log('User exists');
}
```

### set()

Updates an existing entry or adds a new one.

```typescript
pool.set(key: keyof T, value: any, data: T, meta?: Record<string, any>): PoolEntry<T>
```

**Example:**
```typescript
pool.set('id', 'user123', { id: 'user123', name: 'Updated' });
```

### delete()

Removes an entry and returns true if found.

```typescript
pool.delete(key: keyof T, value: any): boolean
```

**Example:**
```typescript
const deleted = pool.delete('id', 'user123');
```

## Iteration Methods

### forEach()

Iterates over all entries.

```typescript
pool.forEach(fn: (entry: PoolEntry<T>, index: number) => void): void
```

### map()

Maps entries to a new array.

```typescript
pool.map<U>(fn: (entry: PoolEntry<T>, index: number) => U): U[]
```

### filter()

Filters entries.

```typescript
pool.filter(fn: (entry: PoolEntry<T>, index: number) => boolean): PoolEntry<T>[]
```

### reduce()

Reduces entries to a single value.

```typescript
pool.reduce<U>(fn: (accumulator: U, entry: PoolEntry<T>, index: number) => U, initialValue: U): U
```

### some()

Tests if any entry matches.

```typescript
pool.some(fn: (entry: PoolEntry<T>, index: number) => boolean): boolean
```

### every()

Tests if all entries match.

```typescript
pool.every(fn: (entry: PoolEntry<T>, index: number) => boolean): boolean
```

### find()

Finds the first matching entry.

```typescript
pool.find(fn: (entry: PoolEntry<T>, index: number) => boolean): PoolEntry<T> | undefined
```

### findIndex()

Finds the index of the first matching entry.

```typescript
pool.findIndex(fn: (entry: PoolEntry<T>, index: number) => boolean): number
```

## Query API

### query()

Creates a query builder.

```typescript
pool.query(): PoolQuery<T>
```

See [PoolQuery](/api/query) for details.

## Combining Pools

### merge()

Merges another pool into this one.

```typescript
pool.merge(other: Pool<T>): void
```

### mergeUnique()

Merges with deduplication.

```typescript
pool.mergeUnique(other: Pool<T>, key: keyof T | ((data: T) => any)): void
```

### union()

Combines pools without duplicates.

```typescript
pool.union(other: Pool<T>, compareFn: (a: T, b: T) => boolean): void
```

### intersect()

Keeps only common elements.

```typescript
pool.intersect(other: Pool<T>, compareFn: (a: T, b: T) => boolean): void
```

### difference()

Removes common elements.

```typescript
pool.difference(other: Pool<T>, compareFn: (a: T, b: T) => boolean): void
```

### deduplicate()

Removes duplicates.

```typescript
pool.deduplicate(key: keyof T | ((data: T) => any)): void
```

## Transformations

### clone()

Creates a copy of the pool.

```typescript
pool.clone(): Pool<T>
```

### partition()

Splits pool into two based on predicate.

```typescript
pool.partition(predicate: (entry: PoolEntry<T>) => boolean): [Pool<T>, Pool<T>]
```

### sample()

Returns random sample of entries.

```typescript
pool.sample(count: number): Pool<T>
```

### shuffle()

Shuffles entries in place.

```typescript
pool.shuffle(): void
```

### groupBy()

Groups entries by field or function.

```typescript
pool.groupBy(key: keyof T | ((data: T) => any)): Map<any, Pool<T>>
```

## Static Methods

### Pool.merge()

Merges multiple pools.

```typescript
Pool.merge<T>(...pools: Pool<T>[]): Pool<T>
```

### Pool.mergeUnique()

Merges with deduplication.

```typescript
Pool.mergeUnique<T>(pools: Pool<T>[], key: keyof T | ((data: T) => any)): Pool<T>
```

### Pool.mergeUniqueWith()

Merges with custom conflict resolution.

```typescript
Pool.mergeUniqueWith<T>(
  pools: Pool<T>[],
  key: keyof T | ((data: T) => any),
  resolver: (existing: PoolEntry<T>, duplicate: PoolEntry<T>) => PoolEntry<T>
): Pool<T>
```

### Pool.intersect()

Finds common elements between two pools.

```typescript
Pool.intersect<T>(pool1: Pool<T>, pool2: Pool<T>, compareFn: (a: T, b: T) => boolean): Pool<T>
```

## Events

### on()

Registers an event handler.

```typescript
pool.on(event: string, handler: Function): void
```

**Events:**
- `'add'` - When entry is added
- `'remove'` - When entry is removed
- `'get'` - When entry is retrieved
- `'set'` - When entry is updated/added via set()
- `'batchAdd'` - When multiple entries are added
- `'batchRemove'` - When multiple entries are removed
- `'beforeSelect'` - Before selector is applied
- `'afterSelect'` - After selector is applied

**Example:**
```typescript
pool.on('get', (entry) => {
  entry.meta.usedCount++;
  entry.meta.lastUsed = new Date();
});
```

### off()

Unregisters an event handler.

```typescript
pool.off(event: string, handler: Function): void
```

## Properties

### size

Number of entries in the pool.

```typescript
pool.size: number
```

### all

Array of all data objects.

```typescript
pool.all: T[]
```

### allEntries

Array of all pool entries.

```typescript
pool.allEntries: PoolEntry<T>[]
```

## Method Wrapping

### wrap()

Wraps a method with custom behavior.

```typescript
pool.wrap<K extends keyof Pool<T>>(
  method: K,
  wrapper: (original: Function, ...args: any[]) => any
): void
```

**Example:**
```typescript
pool.wrap('add', (original, data, meta) => {
  console.log('Before add');
  const result = original(data, meta);
  console.log('After add');
  return result;
});
```
