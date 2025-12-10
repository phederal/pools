import type { PoolEntry, Filter, Selector } from './types';
import { Pool } from './Pool';

/**
 * Query builder for filtering and selecting pool entries
 * @template T - The type of data in the pool
 */
export class Query<T> {
	private entries: PoolEntry<T>[];
	private filters: Filter<T>[] = [];
	private sorters: Array<(a: PoolEntry<T>, b: PoolEntry<T>) => number> = [];
	private offsetCount: number = 0;
	private limitCount: number = Infinity;

	constructor(entries: PoolEntry<T>[]) {
		this.entries = entries;
	}

	/**
	 * Filters pool entries based on predicate
	 * @param filter - Function that returns true for entries to keep
	 * @returns This query instance for chaining
	 * @example
	 * pool.query()
	 *   .where(e => e.data.country === 'US')
	 *   .where(e => e.meta.active === true)
	 */
	where(filter: Filter<T>): this {
		this.filters.push(filter);
		return this;
	}

	/**
	 * Filters pool entries using OR logic across multiple filters
	 * @param filters - Array of filter functions
	 * @returns This query instance for chaining
	 * @example
	 * pool.query()
	 *   .whereOr([
	 *     e => e.data.provider === 'ProviderA',
	 *     e => e.data.provider === 'ProviderB'
	 *   ])
	 */
	whereOr(filters: Filter<T>[]): this {
		this.filters.push((entry) => filters.some((f) => f(entry)));
		return this;
	}

	/**
	 * Sorts entries using custom comparator or by field
	 * @param fnOrField - Comparator function or field name
	 * @param order - Sort order ('asc' or 'desc')
	 * @returns This query instance for chaining
	 */
	orderBy(fnOrField: ((a: PoolEntry<T>, b: PoolEntry<T>) => number) | keyof T, order: 'asc' | 'desc' = 'asc'): this {
		if (typeof fnOrField === 'function') {
			this.sorters.push(fnOrField);
		} else {
			const field = fnOrField;
			this.sorters.push((a, b) => {
				const aVal = a.data[field];
				const bVal = b.data[field];
				const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
				return order === 'asc' ? comparison : -comparison;
			});
		}
		return this;
	}

	/**
	 * Sorts entries by metadata field
	 * @param field - Metadata field name
	 * @param order - Sort order ('asc' or 'desc')
	 * @returns This query instance for chaining
	 */
	orderByMeta(field: string, order: 'asc' | 'desc' = 'asc'): this {
		this.sorters.push((a, b) => {
			const aVal = a.meta[field];
			const bVal = b.meta[field];
			const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
			return order === 'asc' ? comparison : -comparison;
		});
		return this;
	}

	/**
	 * Skips the first N entries
	 * @param count - Number of entries to skip
	 * @returns This query instance for chaining
	 */
	offset(count: number): this {
		this.offsetCount = count;
		return this;
	}

	/**
	 * Takes only the first N entries after filtering and sorting
	 * @param count - Number of entries to take
	 * @returns This query instance for chaining
	 */
	limit(count: number): this {
		this.limitCount = count;
		return this;
	}

	/**
	 * Materializes the query by applying all filters, sorts, and pagination
	 * @returns Array of filtered and sorted entries
	 */
	materialize(): PoolEntry<T>[] {
		// Apply all filters
		let result = this.entries;
		for (const filter of this.filters) {
			result = result.filter(filter);
		}

		// Apply all sorters
		if (this.sorters.length > 0) {
			result = [...result].sort((a, b) => {
				for (const sorter of this.sorters) {
					const comparison = sorter(a, b);
					if (comparison !== 0) return comparison;
				}
				return 0;
			});
		}

		// Apply pagination
		if (this.offsetCount > 0 || this.limitCount !== Infinity) {
			result = result.slice(this.offsetCount, this.offsetCount + this.limitCount);
		}

		return result;
	}

	/**
	 * Selects a single entry using the provided selector
	 * @param selector - Selector function to choose an entry
	 * @returns The selected data or null
	 */
	select(selector: Selector<T>): T | null {
		const materialized = this.materialize();
		const selected = selector(materialized);
		return selected ? selected.data : null;
	}

	/**
	 * Returns all filtered and sorted entries as an array of data
	 * @returns Array of data objects
	 */
	toArray(): T[] {
		return this.materialize().map((entry) => entry.data);
	}

	/**
	 * Converts the query to a Pool
	 * @returns New pool with query results
	 */
	toPool(): Pool<T> {
		const pool = new Pool<T>();
		const entries = this.materialize();
		entries.forEach((entry) => {
			pool.add(entry.data, entry.meta);
		});
		return pool;
	}

	/**
	 * Gets the count of entries after filtering
	 * @returns Number of entries
	 */
	get count(): number {
		let result = this.entries;
		for (const filter of this.filters) {
			result = result.filter(filter);
		}
		return result.length;
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
}
