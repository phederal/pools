# Basic Usage

Simple examples of using the Pools library.

## Source Code

[View on GitHub](https://github.com/phederal/pools/blob/main/examples/basic.ts)

## Running

```bash
bun run examples/basic.ts
```

## Code

```typescript
import { Pool, Selectors, PoolBinder } from '../src';

// Create a pool of proxies
interface Proxy {
	ip: string;
	country: string;
	speed: number;
}

const proxies = new Pool<Proxy>();

// Add some proxies
proxies.add({ ip: '1.1.1.1', country: 'US', speed: 100 }, { usedCount: 0 });
proxies.add({ ip: '2.2.2.2', country: 'UK', speed: 200 }, { usedCount: 5 });
proxies.add({ ip: '3.3.3.3', country: 'US', speed: 150 }, { usedCount: 2 });

console.log(`Total proxies: ${proxies.size}`);

// Query with filter
const usProxy = proxies
	.query()
	.where((e) => e.data.country === 'US')
	.select(Selectors.first);

console.log('First US proxy:', usProxy);

// Query with sorting
const fastestProxy = proxies.query().sortBy('speed', 'desc').select(Selectors.first);

console.log('Fastest proxy:', fastestProxy);
```

## What This Example Shows

### Creating Pools

```typescript
const proxies = new Pool<Proxy>();
```

Simple pool creation with TypeScript generics.

### Adding Data

```typescript
proxies.add({ ip: '1.1.1.1', country: 'US', speed: 100 }, { usedCount: 0 });
```

Add data with optional metadata.

### Querying

```typescript
const proxy = proxies
	.query()
	.where((e) => e.data.country === 'US')
	.select(Selectors.first);
```

Chain filters and selectors.

### Sorting

```typescript
const fastest = proxies.query().sortBy('speed', 'desc').select(Selectors.first);
```

Sort by any field.

### Events

```typescript
proxies.on('get', (entry) => {
	entry.meta.usedCount++;
	console.log(`Proxy ${entry.data.ip} used`);
});
```

Listen to pool operations.

### Pool Binding

```typescript
const combo = new PoolBinder()
	.bind('proxy', proxies)
	.bind('account', accounts)
	.where('proxy', (e) => e.data.country === 'US')
	.selectWith('proxy', Selectors.minBy('usedCount'))
	.execute();
```

Combine multiple pools.

### Pool of Pools

```typescript
const poolOfPools = new Pool<Pool<Proxy>>();
poolOfPools.add(usPool, { region: 'Americas' });
poolOfPools.add(ukPool, { region: 'Europe' });

// Find biggest pool
const biggest = poolOfPools
	.query()
	.sortBy((a, b) => b.data.size - a.data.size)
	.select(Selectors.first);
```

Store and query pools within pools.

## Full Output

```
=== Basic Pool Example ===

Total proxies: 3
First US proxy: { ip: '1.1.1.1', country: 'US', speed: 100 }
Fastest proxy: { ip: '2.2.2.2', country: 'UK', speed: 200 }
Best US proxy (low usage, high speed): { ip: '3.3.3.3', country: 'US', speed: 150 }

=== Events Example ===

[Event] Proxy 1.1.1.1 used, count: 1
[Event] Proxy 3.3.3.3 used, count: 3

=== PoolBinder Example ===

Combo result: {
  proxy: { ip: '1.1.1.1', country: 'US', speed: 100 },
  account: { username: 'user1', service: 'twitter' }
}
```
