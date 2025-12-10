# Binder

Bind multiple pools together for complex resource allocation.

::: tip Use Case
Binder is perfect when you need to select items from multiple pools at once, like combining a proxy, account, and server for a task.
:::

## Constructor

```typescript
const binder = new Binder();
```

## Methods

### bind()

Binds a pool with a name.

```typescript
binder.bind<T>(name: string, pool: Pool<T>): Binder
```

**Example:**
```typescript
const binder = new Binder()
  .bind('proxy', proxies)
  .bind('account', accounts)
  .bind('service', services);
```

### where()

Adds a filter for a specific pool.

```typescript
binder.where<T>(poolName: string, filter: Filter<T>): Binder
```

**Example:**
```typescript
binder
  .where('proxy', ({ data }) => data.country === 'US')
  .where('account', ({ data }) => data.service === 'twitter');
```

### selectWith()

Sets the selector for a specific pool.

```typescript
binder.selectWith<T>(poolName: string, selector: Selector<T>): Binder
```

**Example:**
```typescript
import { Selectors } from 'pools';

binder
  .selectWith('proxy', Selectors.minBy('usedCount'))
  .selectWith('account', Selectors.random);
```

### execute()

Executes the binding and returns selected items from all pools.

```typescript
binder.execute(): Record<string, any> | null
```

Returns `null` if any pool has no matching entries.

**Example:**
```typescript
const result = binder.execute();

if (result) {
  console.log(result.proxy);  // Selected proxy
  console.log(result.account); // Selected account
  console.log(result.service); // Selected service
}
```

## Complete Example

```typescript
import { Pool, Binder, Selectors } from 'pools';

// Create pools
const proxies = new Pool<Proxy>();
const accounts = new Pool<Account>();
const services = new Pool<Service>();

// Add data
proxies.add({ ip: '1.1.1.1', country: 'US', speed: 100 }, { usedCount: 0 });
accounts.add({ username: 'user1', service: 'twitter' });
services.add({ name: 'API', url: 'https://api.twitter.com' });

// Bind pools together
const combo = new Binder()
  .bind('proxy', proxies)
  .bind('account', accounts)
  .bind('service', services)
  // Filter each pool
  .where('proxy', ({ data }) => data.country === 'US')
  .where('account', ({ data }) => data.service === 'twitter')
  .where('service', ({ data }) => data.name === 'API')
  // Select from each pool
  .selectWith('proxy', Selectors.minBy('usedCount'))
  .selectWith('account', Selectors.random)
  .selectWith('service', Selectors.first)
  // Execute
  .execute();

if (combo) {
  // Use all resources together
  await doTask(combo.proxy, combo.account, combo.service);
}
```

## Use Cases

### Resource Allocation

Allocate multiple resources for a task:

```typescript
const resources = new Binder()
  .bind('proxy', proxies)
  .bind('account', accounts)
  .where('proxy', ({ meta }) => meta.usedCount < 10)
  .where('account', e => !e.meta.banned)
  .selectWith('proxy', Selectors.minBy('usedCount'))
  .selectWith('account', Selectors.weighted(e => 1 / (e.meta.failCount + 1)))
  .execute();
```

### Server + Session Selection

Select a server and session together:

```typescript
const combo = new Binder()
  .bind('server', servers)
  .bind('session', sessions)
  .where('server', ({ data }) => data.region === 'EU')
  .where('session', e => !e.meta.expired)
  .selectWith('server', Selectors.minBy('load'))
  .selectWith('session', Selectors.random)
  .execute();
```

### Multi-Pool Filtering

```typescript
// Find matching proxy and account from different providers
const result = new Binder()
  .bind('proxy', proxies)
  .bind('account', accounts)
  .where('proxy', ({ data }) => data.provider === 'ProviderA')
  .where('account', ({ data }) => data.provider === 'ProviderB')
  .execute();
```
