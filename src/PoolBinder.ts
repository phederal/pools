import { Pool } from './Pool';
import type { Filter, Selector } from './types';
import { Selectors } from './Selectors';

/**
 * PoolBinder allows binding multiple pools together and selecting from them
 */
export class PoolBinder {
	private pools: Map<string, Pool<any>> = new Map();
	private filters: Map<string, Filter<any>[]> = new Map();
	private selectors: Map<string, Selector<any>> = new Map();

	/**
	 * Binds a pool with a name
	 * @param name - Name to reference this pool
	 * @param pool - The pool to bind
	 * @returns This binder for chaining
	 */
	bind<T>(name: string, pool: Pool<T>): this {
		this.pools.set(name, pool);
		return this;
	}

	/**
	 * Adds a filter for a specific pool
	 * @param poolName - Name of the pool to filter
	 * @param filter - Filter function
	 * @returns This binder for chaining
	 */
	where<T>(poolName: string, filter: Filter<T>): this {
		if (!this.filters.has(poolName)) {
			this.filters.set(poolName, []);
		}
		this.filters.get(poolName)!.push(filter);
		return this;
	}

	/**
	 * Sets the selector for a specific pool
	 * @param poolName - Name of the pool
	 * @param selector - Selector function
	 * @returns This binder for chaining
	 */
	selectWith<T>(poolName: string, selector: Selector<T>): this {
		this.selectors.set(poolName, selector);
		return this;
	}

	/**
	 * Executes the binding and returns selected items from all pools
	 * @returns Object with selected items or null if any selection fails
	 */
	execute(): Record<string, any> | null {
		const result: Record<string, any> = {};

		for (const [name, pool] of this.pools) {
			// Build query with filters
			let query = pool.query();

			const poolFilters = this.filters.get(name) || [];
			poolFilters.forEach((filter) => {
				query = query.where(filter);
			});

			// Select using selector or default to first
			const selector = this.selectors.get(name) || Selectors.first;
			const selected = query.select(selector);

			if (selected === null) {
				return null;
			}

			result[name] = selected;
		}

		return result;
	}
}
