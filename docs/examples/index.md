# Examples

Real-world examples of using the Pools library.

## Quick Links

- [Basic Usage](/examples/basic) - Simple CRUD operations and queries
- [Proxy Pool](/examples/proxy-pool) - Managing proxies with filtering and selection
- [Map-like Usage](/examples/map-like) - Using Pool as a Map replacement
- [Game Service](/examples/game-service) - Complex multi-pool application

## Running Examples

All examples are in the `examples/` directory. Run them with:

```bash
bun run examples/basic.ts
bun run examples/proxy-pool.ts
bun run examples/map-like.ts
bun run examples/game-service.ts
```

## What Each Example Covers

### Basic Usage

- Creating pools
- Adding and querying data
- Using selectors
- Pool binding
- Pool of pools pattern

[View Example](/examples/basic)

### Proxy Pool

- CRUD operations with metadata
- Event handling and auto-tracking
- Complex queries with multiple filters
- Pool combination and deduplication
- Transformations (partition, groupBy, sample)
- Weighted selectors

[View Example](/examples/proxy-pool)

### Map-like Usage

- Using Pool as a Map replacement
- get/has/set/delete operations
- Pool of pools with identifiers
- Cache implementation
- Config management
- Events with Map-like operations

[View Example](/examples/map-like)

### Game Service

- Multiple interconnected pools
- Complex matchmaking logic
- Event-driven architecture
- Pool of pools for regional organization
- Weighted server selection
- Statistics and analytics

[View Example](/examples/game-service)
