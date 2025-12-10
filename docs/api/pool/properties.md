# Properties & Getters

Properties for accessing pool data and metadata.

## size

Gets the number of entries in the pool.

```typescript
pool.size: number
```

**Example:**
```typescript
console.log(`Pool has ${pool.size} entries`);
```

## all

Gets all data objects from the pool (without metadata).

```typescript
pool.all: T[]
```

**Example:**
```typescript
const allUsers = pool.all;
allUsers.forEach(user => console.log(user.name));
```

## allEntries

Gets all pool entries (with metadata).

```typescript
pool.allEntries: PoolEntry<T>[]
```

**Example:**
```typescript
pool.allEntries.forEach(entry => {
  console.log(entry.data, entry.meta);
});
```
