import { Query } from './Query';
import type { PoolEntry, Filter, Selector } from './types';

/**
 * Main Pool class for managing collections of data
 * @template T - The type of data stored in the pool
 */
export class Pool<T> {
	private entries: PoolEntry<T>[] = [];
	private eventHandlers: Map<string, Function[]> = new Map();

	/**
	 * Adds an entry to the pool
	 * @param data - The data to add
	 * @param meta - Optional metadata
	 * @returns The created pool entry
	 */
	add(data: T, meta: Record<string, any> = {}): PoolEntry<T> {
		const entry: PoolEntry<T> = { data, meta };
		this.entries.push(entry);
		this.emit('add', entry);
		return entry;
	}

	/**
	 * Gets an entry from the pool by a predicate or field value
	 * @param keyOrPredicate - Field name and value, or predicate function
	 * @param value - Value to match (if keyOrPredicate is a field name)
	 * @returns The matching data or null
	 * @example
	 * pool.get('id', 'user123')
	 * pool.get(e => e.data.username === 'John')
	 */
	get(keyOrPredicate: keyof T | ((entry: PoolEntry<T>) => boolean), value?: any): T | null {
		let entry: PoolEntry<T> | undefined;

		if (typeof keyOrPredicate === 'function') {
			entry = this.entries.find(keyOrPredicate);
		} else {
			entry = this.entries.find((e) => e.data[keyOrPredicate] === value);
		}

		if (entry) {
			this.emit('get', entry);
			return entry.data;
		}

		return null;
	}

	/**
	 * Checks if an entry exists in the pool
	 * @param keyOrPredicate - Field name and value, or predicate function
	 * @param value - Value to match (if keyOrPredicate is a field name)
	 * @returns True if entry exists
	 * @example
	 * pool.has('id', 'user123')
	 * pool.has(e => e.data.username === 'John')
	 */
	has(keyOrPredicate: keyof T | ((entry: PoolEntry<T>) => boolean), value?: any): boolean {
		if (typeof keyOrPredicate === 'function') {
			return this.entries.some(keyOrPredicate);
		} else {
			return this.entries.some((e) => e.data[keyOrPredicate] === value);
		}
	}

	/**
	 * Sets (updates or adds) an entry in the pool
	 * @param key - Field name to use as key
	 * @param value - Value to match for the key
	 * @param data - New data to set
	 * @param meta - Optional metadata
	 * @returns The created or updated pool entry
	 * @example
	 * pool.set('id', 'user123', { id: 'user123', name: 'John' })
	 */
	set(key: keyof T, value: any, data: T, meta: Record<string, any> = {}): PoolEntry<T> {
		const existingEntry = this.entries.find((e) => e.data[key] === value);

		if (existingEntry) {
			existingEntry.data = data;
			existingEntry.meta = { ...existingEntry.meta, ...meta };
			this.emit('set', existingEntry);
			return existingEntry;
		} else {
			return this.add(data, meta);
		}
	}

	/**
	 * Deletes an entry from the pool
	 * @param key - Field name to use as key
	 * @param value - Value to match for the key
	 * @returns True if entry was deleted
	 * @example
	 * pool.delete('id', 'user123')
	 */
	delete(key: keyof T, value: any): boolean {
		const index = this.entries.findIndex((e) => e.data[key] === value);

		if (index !== -1) {
			const entry = this.entries[index];
			if (entry) {
				this.entries.splice(index, 1);
				this.emit('remove', entry);
				return true;
			}
		}

		return false;
	}

	/**
	 * Adds multiple entries to the pool at once
	 * @param items - Array of items with data and optional meta
	 * @returns Array of created pool entries
	 */
	addBatch(items: { data: T; meta?: Record<string, any> }[]): PoolEntry<T>[] {
		const entries = items.map((item) => ({
			data: item.data,
			meta: item.meta || {},
		}));
		this.entries.push(...entries);
		this.emit('batchAdd', entries);
		return entries;
	}

	/**
	 * Removes entries matching the predicate
	 * @param predicate - Function that returns true for data to remove
	 * @returns Array of removed entries
	 */
	remove(predicate: (data: T) => boolean): PoolEntry<T>[] {
		const removed: PoolEntry<T>[] = [];
		this.entries = this.entries.filter((entry) => {
			if (predicate(entry.data)) {
				removed.push(entry);
				this.emit('remove', entry);
				return false;
			}
			return true;
		});
		return removed;
	}

	/**
	 * Removes entries matching any of the predicates
	 * @param predicates - Array of predicate functions
	 * @returns Array of removed entries
	 */
	removeBatch(predicates: ((data: T) => boolean)[]): PoolEntry<T>[] {
		const removed: PoolEntry<T>[] = [];
		this.entries = this.entries.filter((entry) => {
			if (predicates.some((predicate) => predicate(entry.data))) {
				removed.push(entry);
				return false;
			}
			return true;
		});
		if (removed.length > 0) {
			this.emit('batchRemove', removed);
		}
		return removed;
	}

	/**
	 * Creates a query builder for filtering and selecting entries
	 * @returns A new Query instance
	 */
	query(): Query<T> {
		const query = new Query(this.entries);

		// Wrap select to emit events
		const originalSelect = query.select.bind(query);
		(query as any).select = (selector: Selector<T>) => {
			// Get materialized entries for beforeSelect event
			const materialized = (query as any).materialize();
			this.emit('beforeSelect', materialized);

			const selected = originalSelect(selector);

			this.emit('afterSelect', selected);
			if (selected !== null) {
				// Find the entry to emit 'get' event
				const entry = this.entries.find((e) => e.data === selected);
				if (entry) {
					this.emit('get', entry);
				}
			}

			return selected;
		};

		return query;
	}

	/**
	 * Merges one or more pools or queries into this pool
	 * @param sources - Pools or PoolQueries to merge from (as individual arguments or arrays)
	 * @returns This pool for chaining
	 * @example
	 * pool.merge(pool1, pool2, pool3)
	 * pool.merge([pool1, pool2])
	 * pool.merge(pool1, [pool2, pool3])
	 */
	merge(...sources: (Pool<T> | Query<T> | (Pool<T> | Query<T>)[])[]): this {
		const flatSources = sources.flat();

		flatSources.forEach((source) => {
			if (source instanceof Pool) {
				this.entries.push(...source.entries);
			} else {
				// Query - convert to entries
				const data = source.toArray();
				data.forEach((d) => this.add(d));
			}
		});

		return this;
	}

	/**
	 * Merges one or more pools or queries ensuring uniqueness by a field or function
	 * @param uniqueBy - Field name or function to determine uniqueness
	 * @param sources - Pools or PoolQueries to merge from (as individual arguments or arrays)
	 * @returns This pool for chaining
	 * @example
	 * pool.mergeUnique('id', pool1, pool2)
	 * pool.mergeUnique('id', [pool1, pool2])
	 * pool.mergeUnique(x => x.id, pool1, pool2)
	 */
	mergeUnique(uniqueBy: keyof T | ((item: T) => any), ...sources: (Pool<T> | Query<T> | (Pool<T> | Query<T>)[])[]): this {
		const getKey = typeof uniqueBy === 'function' ? uniqueBy : (item: T) => item[uniqueBy];
		const existingKeys = new Set(this.entries.map((e) => getKey(e.data)));
		const flatSources = sources.flat();

		flatSources.forEach((source) => {
			if (source instanceof Pool) {
				source.entries.forEach((entry) => {
					const key = getKey(entry.data);
					if (!existingKeys.has(key)) {
						this.entries.push(entry);
						existingKeys.add(key);
					}
				});
			} else {
				const data = source.toArray();
				data.forEach((d) => {
					const key = getKey(d);
					if (!existingKeys.has(key)) {
						this.add(d);
						existingKeys.add(key);
					}
				});
			}
		});

		return this;
	}

	/**
	 * Union with another pool (no duplicates based on compareFn)
	 * @param other - Pool to union with
	 * @param compareFn - Optional comparison function
	 * @returns This pool for chaining
	 */
	union(other: Pool<T>, compareFn?: (a: T, b: T) => boolean): this {
		const defaultCompare = (a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);
		const compare = compareFn || defaultCompare;

		other.entries.forEach((otherEntry) => {
			const exists = this.entries.some((entry) => compare(entry.data, otherEntry.data));
			if (!exists) {
				this.entries.push(otherEntry);
			}
		});

		return this;
	}

	/**
	 * Intersect with another pool (keep only common elements)
	 * @param other - Pool to intersect with
	 * @param compareFn - Optional comparison function
	 * @returns This pool for chaining
	 */
	intersect(other: Pool<T>, compareFn?: (a: T, b: T) => boolean): this {
		const defaultCompare = (a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);
		const compare = compareFn || defaultCompare;

		this.entries = this.entries.filter((entry) => other.entries.some((otherEntry) => compare(entry.data, otherEntry.data)));

		return this;
	}

	/**
	 * Difference with another pool (remove elements that exist in other)
	 * @param other - Pool to diff with
	 * @param compareFn - Optional comparison function
	 * @returns This pool for chaining
	 */
	difference(other: Pool<T>, compareFn?: (a: T, b: T) => boolean): this {
		const defaultCompare = (a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);
		const compare = compareFn || defaultCompare;

		this.entries = this.entries.filter((entry) => !other.entries.some((otherEntry) => compare(entry.data, otherEntry.data)));

		return this;
	}

	/**
	 * Removes duplicate entries based on uniqueBy
	 * @param uniqueBy - Field name or function to determine uniqueness
	 * @returns This pool for chaining
	 */
	deduplicate(uniqueBy: keyof T | ((item: T) => any)): this {
		const getKey = typeof uniqueBy === 'function' ? uniqueBy : (item: T) => item[uniqueBy];

		const seen = new Set();
		this.entries = this.entries.filter((entry) => {
			const key = getKey(entry.data);
			if (seen.has(key)) {
				return false;
			}
			seen.add(key);
			return true;
		});

		return this;
	}

	/**
	 * Clones the pool
	 * @returns A new pool with the same entries
	 */
	clone(): Pool<T> {
		const newPool = new Pool<T>();
		newPool.entries = this.entries.map((entry) => ({
			data: entry.data,
			meta: { ...entry.meta },
		}));
		return newPool;
	}

	/**
	 * Partitions the pool into two pools based on predicate
	 * @param predicate - Function to determine partition
	 * @returns Tuple of two pools [matching, notMatching]
	 */
	partition(predicate: (entry: PoolEntry<T>) => boolean): [Pool<T>, Pool<T>] {
		const matching = new Pool<T>();
		const notMatching = new Pool<T>();

		this.entries.forEach((entry) => {
			if (predicate(entry)) {
				matching.entries.push(entry);
			} else {
				notMatching.entries.push(entry);
			}
		});

		return [matching, notMatching];
	}

	/**
	 * Returns a random sample of entries
	 * @param count - Number of entries to sample
	 * @returns A new pool with sampled entries
	 */
	sample(count: number): Pool<T> {
		const shuffled = [...this.entries].sort(() => Math.random() - 0.5);
		const sampled = shuffled.slice(0, count);

		const newPool = new Pool<T>();
		newPool.entries = sampled;
		return newPool;
	}

	/**
	 * Shuffles the pool in place
	 * @returns This pool for chaining
	 */
	shuffle(): this {
		for (let i = this.entries.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const entryI = this.entries[i];
			const entryJ = this.entries[j];
			if (entryI && entryJ) {
				this.entries[i] = entryJ;
				this.entries[j] = entryI;
			}
		}
		return this;
	}

	/**
	 * Groups entries by a field or function
	 * @param groupBy - Field name or function to group by
	 * @returns Map of group keys to pools
	 */
	groupBy(groupBy: keyof T | ((item: T) => any)): Map<any, Pool<T>> {
		const getKey = typeof groupBy === 'function' ? groupBy : (item: T) => item[groupBy];

		const groups = new Map<any, Pool<T>>();

		this.entries.forEach((entry) => {
			const key = getKey(entry.data);
			if (!groups.has(key)) {
				groups.set(key, new Pool<T>());
			}
			groups.get(key)!.entries.push(entry);
		});

		return groups;
	}

	/**
	 * Registers an event handler
	 * @param event - Event name
	 * @param handler - Handler function
	 */
	on(event: string, handler: Function): void {
		if (!this.eventHandlers.has(event)) {
			this.eventHandlers.set(event, []);
		}
		this.eventHandlers.get(event)!.push(handler);
	}

	/**
	 * Unregisters an event handler
	 * @param event - Event name
	 * @param handler - Handler function to remove
	 */
	off(event: string, handler: Function): void {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			const index = handlers.indexOf(handler);
			if (index !== -1) {
				handlers.splice(index, 1);
			}
		}
	}

	/**
	 * Emits an event
	 * @param event - Event name
	 * @param args - Event arguments
	 */
	private emit(event: string, ...args: any[]): void {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			handlers.forEach((handler) => handler(...args));
		}
	}

	/**
	 * Wraps a method with custom behavior
	 * @param method - Method name to wrap
	 * @param wrapper - Wrapper function
	 */
	wrap<K extends keyof this>(method: K, wrapper: (original: Function, ...args: any[]) => any): void {
		const original = this[method] as Function;
		(this as any)[method] = (...args: any[]) => wrapper.call(this, original.bind(this), ...args);
	}

	/**
	 * Merges multiple pools into one
	 * @param pools - Pools to merge
	 * @returns New merged pool
	 */
	static merge<T>(...pools: Pool<T>[]): Pool<T> {
		const merged = new Pool<T>();
		pools.forEach((pool) => merged.merge(pool));
		return merged;
	}

	/**
	 * Merges multiple pools/queries with uniqueness constraint
	 * @param sources - Pools or queries to merge
	 * @param uniqueBy - Field or function to determine uniqueness
	 * @returns New merged pool
	 */
	static mergeUnique<T>(sources: (Pool<T> | Query<T>)[], uniqueBy: keyof T | ((item: T) => any)): Pool<T> {
		const merged = new Pool<T>();
		sources.forEach((source) => merged.mergeUnique(uniqueBy, source));
		return merged;
	}

	/**
	 * Merges multiple pools/queries with uniqueness and custom duplicate resolution
	 * @param sources - Pools or queries to merge
	 * @param uniqueBy - Field or function to determine uniqueness
	 * @param resolveDuplicate - Function to resolve duplicates
	 * @returns New merged pool
	 */
	static mergeUniqueWith<T>(
		sources: (Pool<T> | Query<T>)[],
		uniqueBy: keyof T | ((item: T) => any),
		resolveDuplicate: (existing: PoolEntry<T>, duplicate: PoolEntry<T>) => PoolEntry<T>
	): Pool<T> {
		const getKey = typeof uniqueBy === 'function' ? uniqueBy : (item: T) => item[uniqueBy];

		const map = new Map<any, PoolEntry<T>>();

		sources.forEach((source) => {
			const entries = source instanceof Pool ? source.entries : source.toArray().map((data) => ({ data, meta: {} }));

			entries.forEach((entry) => {
				const key = getKey(entry.data);
				if (map.has(key)) {
					const existing = map.get(key)!;
					map.set(key, resolveDuplicate(existing, entry));
				} else {
					map.set(key, entry);
				}
			});
		});

		const merged = new Pool<T>();
		merged.entries = Array.from(map.values());
		return merged;
	}

	/**
	 * Intersects two pools
	 * @param pool1 - First pool
	 * @param pool2 - Second pool
	 * @param compareFn - Optional comparison function
	 * @returns New pool with intersection
	 */
	static intersect<T>(pool1: Pool<T>, pool2: Pool<T>, compareFn?: (a: T, b: T) => boolean): Pool<T> {
		const result = pool1.clone();
		result.intersect(pool2, compareFn);
		return result;
	}

	/**
	 * Groups entries from multiple sources
	 * @param sources - Pools or queries to group
	 * @param groupBy - Field or function to group by
	 * @returns Map of group keys to pools
	 */
	static groupBy<T>(sources: (Pool<T> | Query<T>)[], groupBy: keyof T | ((item: T) => any)): Map<any, Pool<T>> {
		const merged = new Pool<T>();
		sources.forEach((source) => merged.merge(source));
		return merged.groupBy(groupBy);
	}

	/**
	 * Creates a Pool from a Query
	 * @param query - Query to convert to pool
	 * @returns New pool with query results
	 */
	static fromQuery<T>(query: Query<T>): Pool<T> {
		const pool = new Pool<T>();
		const entries = query.materialize();
		entries.forEach((entry) => {
			pool.add(entry.data, entry.meta);
		});
		return pool;
	}

	/**
	 * Gets the number of entries in the pool
	 */
	get size(): number {
		return this.entries.length;
	}

	/**
	 * Gets all data objects from the pool
	 */
	get all(): T[] {
		return this.entries.map((entry) => entry.data);
	}

	/**
	 * Gets all pool entries
	 */
	get allEntries(): PoolEntry<T>[] {
		return this.entries;
	}

	/**
	 * Executes a function for each entry in the pool
	 * @param fn - Function to execute for each entry
	 * @example
	 * pool.forEach(entry => console.log(entry.data))
	 */
	forEach(fn: (entry: PoolEntry<T>, index: number) => void): void {
		this.entries.forEach(fn);
	}

	/**
	 * Maps each entry to a new value
	 * @param fn - Function to map each entry
	 * @returns Array of mapped values
	 * @example
	 * const ips = pool.map(entry => entry.data.ip)
	 */
	map<U>(fn: (entry: PoolEntry<T>, index: number) => U): U[] {
		return this.entries.map(fn);
	}

	/**
	 * Filters entries and returns matching entries (not data)
	 * @param fn - Filter function
	 * @returns Array of matching entries
	 * @example
	 * const active = pool.filter(entry => entry.meta.active)
	 */
	filter(fn: (entry: PoolEntry<T>, index: number) => boolean): PoolEntry<T>[] {
		return this.entries.filter(fn);
	}

	/**
	 * Reduces the pool to a single value
	 * @param fn - Reducer function
	 * @param initialValue - Initial value for reduction
	 * @returns Reduced value
	 * @example
	 * const totalSpeed = pool.reduce((sum, entry) => sum + entry.data.speed, 0)
	 */
	reduce<U>(fn: (accumulator: U, entry: PoolEntry<T>, index: number) => U, initialValue: U): U {
		return this.entries.reduce(fn, initialValue);
	}

	/**
	 * Checks if any entry matches the predicate
	 * @param fn - Predicate function
	 * @returns True if any entry matches
	 * @example
	 * const hasActive = pool.some(entry => entry.meta.active)
	 */
	some(fn: (entry: PoolEntry<T>, index: number) => boolean): boolean {
		return this.entries.some(fn);
	}

	/**
	 * Checks if all entries match the predicate
	 * @param fn - Predicate function
	 * @returns True if all entries match
	 * @example
	 * const allActive = pool.every(entry => entry.meta.active)
	 */
	every(fn: (entry: PoolEntry<T>, index: number) => boolean): boolean {
		return this.entries.every(fn);
	}

	/**
	 * Finds the first entry matching the predicate
	 * @param fn - Predicate function
	 * @returns The first matching entry or undefined
	 * @example
	 * const firstActive = pool.find(entry => entry.meta.active)
	 */
	find(fn: (entry: PoolEntry<T>, index: number) => boolean): PoolEntry<T> | undefined {
		return this.entries.find(fn);
	}

	/**
	 * Finds the index of the first entry matching the predicate
	 * @param fn - Predicate function
	 * @returns The index of the first matching entry or -1
	 * @example
	 * const index = pool.findIndex(entry => entry.data.id === 'user123')
	 */
	findIndex(fn: (entry: PoolEntry<T>, index: number) => boolean): number {
		return this.entries.findIndex(fn);
	}
}
