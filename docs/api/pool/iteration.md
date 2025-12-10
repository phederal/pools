# Iteration Methods

Array-like iteration methods (forEach, map, filter, reduce, etc.).

## forEach()

Executes a function for each entry in the pool.

```typescript
pool.forEach(fn: (entry: PoolEntry<T>, index: number) => void): void
```

**Parameters:**
- `fn` - Function to execute for each entry

**Example:**
```typescript
pool.forEach((entry, index) => {
  console.log(`${index}: ${entry.data.name}`);
});
```

## map()

Maps each entry to a new value.

```typescript
pool.map<U>(fn: (entry: PoolEntry<T>, index: number) => U): U[]
```

**Parameters:**
- `fn` - Function to map each entry

**Returns:** Array of mapped values

**Example:**
```typescript
const names = pool.map(({ data }) => data.name);
const ips = proxyPool.map(({ data }) => data.ip);
```

## filter()

Filters entries and returns matching entries (not data).

```typescript
pool.filter(fn: (entry: PoolEntry<T>, index: number) => boolean): PoolEntry<T>[]
```

**Parameters:**
- `fn` - Filter function

**Returns:** Array of matching entries

**Example:**
```typescript
const active = pool.filter(({ meta }) => meta.active === true);
```

## reduce()

Reduces the pool to a single value.

```typescript
pool.reduce<U>(
  fn: (accumulator: U, entry: PoolEntry<T>, index: number) => U,
  initialValue: U
): U
```

**Parameters:**
- `fn` - Reducer function
- `initialValue` - Initial value for reduction

**Returns:** Reduced value

**Example:**
```typescript
const totalAge = pool.reduce((sum, entry) => sum + entry.data.age, 0);

const avgAge = totalAge / pool.size;
```

## some()

Checks if any entry matches the predicate.

```typescript
pool.some(fn: (entry: PoolEntry<T>, index: number) => boolean): boolean
```

**Parameters:**
- `fn` - Predicate function

**Returns:** True if any entry matches

**Example:**
```typescript
const hasAdult = pool.some(({ data }) => data.age >= 18);
```

## every()

Checks if all entries match the predicate.

```typescript
pool.every(fn: (entry: PoolEntry<T>, index: number) => boolean): boolean
```

**Parameters:**
- `fn` - Predicate function

**Returns:** True if all entries match

**Example:**
```typescript
const allActive = pool.every(({ meta }) => meta.active === true);
```

## find()

Finds the first entry matching the predicate.

```typescript
pool.find(fn: (entry: PoolEntry<T>, index: number) => boolean): PoolEntry<T> | undefined
```

**Parameters:**
- `fn` - Predicate function

**Returns:** The first matching entry or undefined

**Example:**
```typescript
const admin = pool.find(({ data }) => data.role === 'admin');
```

## findIndex()

Finds the index of the first entry matching the predicate.

```typescript
pool.findIndex(fn: (entry: PoolEntry<T>, index: number) => boolean): number
```

**Parameters:**
- `fn` - Predicate function

**Returns:** The index of the first matching entry or -1

**Example:**
```typescript
const index = pool.findIndex(({ data }) => data.id === 'user123');
```
