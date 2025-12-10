import type { PoolEntry } from './types';

/**
 * Built-in selectors for choosing entries from a pool
 */
export const Selectors = {
	/**
	 * Selects a random entry from the pool
	 */
	random: <T>(entries: PoolEntry<T>[]): PoolEntry<T> | null => {
		if (entries.length === 0) return null;
		const index = Math.floor(Math.random() * entries.length);
		return entries[index] ?? null;
	},

	/**
	 * Selects the first entry
	 */
	first: <T>(entries: PoolEntry<T>[]): PoolEntry<T> | null => {
		return entries.length > 0 ? (entries[0] ?? null) : null;
	},

	/**
	 * Selects the last entry
	 */
	last: <T>(entries: PoolEntry<T>[]): PoolEntry<T> | null => {
		return entries.length > 0 ? (entries[entries.length - 1] ?? null) : null;
	},

	/**
	 * Creates a selector that picks the entry with minimum value for a field
	 * @param field - Field name to compare (can be in data or meta)
	 */
	minBy: <T>(field: string) => {
		return (entries: PoolEntry<T>[]): PoolEntry<T> | null => {
			if (entries.length === 0) return null;

			return entries.reduce((min, entry) => {
				const minVal = (min.data as any)[field] ?? (min.meta as any)[field];
				const entryVal = (entry.data as any)[field] ?? (entry.meta as any)[field];

				return entryVal < minVal ? entry : min;
			});
		};
	},

	/**
	 * Creates a weighted random selector
	 * @param weightFn - Function that returns weight for an entry
	 */
	weighted: <T>(weightFn: (entry: PoolEntry<T>) => number) => {
		return (entries: PoolEntry<T>[]): PoolEntry<T> | null => {
			if (entries.length === 0) return null;

			const weights = entries.map(weightFn);
			const totalWeight = weights.reduce((sum, w) => sum + w, 0);

			if (totalWeight === 0) {
				// If all weights are 0, select randomly
				return Selectors.random(entries);
			}

			let random = Math.random() * totalWeight;

			for (let i = 0; i < entries.length; i++) {
				const weight = weights[i];
				if (weight !== undefined) {
					random -= weight;
					if (random <= 0) {
						return entries[i] ?? null;
					}
				}
			}

			return entries[entries.length - 1] ?? null;
		};
	},
};
