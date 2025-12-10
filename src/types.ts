/**
 * Represents an entry in a Pool
 * @template T - The type of data stored in the entry
 */
export type PoolEntry<T> = {
	data: T; // User data
	meta: Record<string, any>; // Metadata for tracking usage, state, etc.
};

/**
 * Filter function for pool entries
 * @template T - The type of data in the pool
 * @param entry - The pool entry to filter
 * @returns true if the entry should be included
 */
export type Filter<T> = (entry: PoolEntry<T>) => boolean;

/**
 * Selector function for choosing an entry from a filtered set
 * @template T - The type of data in the pool
 * @param entries - The entries to select from
 * @returns The selected entry or null if no entry matches
 */
export type Selector<T> = (entries: PoolEntry<T>[]) => PoolEntry<T> | null;
