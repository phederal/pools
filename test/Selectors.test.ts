import { describe, test, expect } from 'bun:test';
import { Selectors } from '../src/Selectors';
import type { PoolEntry } from '../src/types';

interface TestData {
	id: string;
	value: number;
	weight: number;
}

describe('Selectors', () => {
	const createEntries = (count: number): PoolEntry<TestData>[] => {
		return Array.from({ length: count }, (_, i) => ({
			data: {
				id: `test${i + 1}`,
				value: (i + 1) * 100,
				weight: i + 1,
			},
			meta: {
				usedCount: i,
				priority: count - i,
			},
		}));
	};

	describe('first', () => {
		test('should return first entry', () => {
			const entries = createEntries(3);
			const result = Selectors.first(entries);

			expect(result).not.toBeNull();
			expect(result?.data.id).toBe('test1');
		});

		test('should return null for empty array', () => {
			const result = Selectors.first([]);

			expect(result).toBeNull();
		});
	});

	describe('last', () => {
		test('should return last entry', () => {
			const entries = createEntries(3);
			const result = Selectors.last(entries);

			expect(result).not.toBeNull();
			expect(result?.data.id).toBe('test3');
		});

		test('should return null for empty array', () => {
			const result = Selectors.last([]);

			expect(result).toBeNull();
		});
	});

	describe('random', () => {
		test('should return random entry from non-empty array', () => {
			const entries = createEntries(5);
			const result = Selectors.random(entries);

			expect(result).not.toBeNull();
			expect(entries.some((e) => e.data.id === result?.data.id)).toBe(true);
		});

		test('should return null for empty array', () => {
			const result = Selectors.random([]);

			expect(result).toBeNull();
		});

		test('should return the only entry when array has one element', () => {
			const entries = createEntries(1);
			const result = Selectors.random(entries);

			expect(result?.data.id).toBe('test1');
		});

		test('should have reasonable distribution', () => {
			const entries = createEntries(3);
			const counts = new Map<string, number>();

			// Run many times to check distribution
			for (let i = 0; i < 300; i++) {
				const result = Selectors.random(entries);
				if (result) {
					const count = counts.get(result.data.id) ?? 0;
					counts.set(result.data.id, count + 1);
				}
			}

			// Each entry should be selected at least once in 300 tries
			expect(counts.size).toBe(3);
			for (const count of counts.values()) {
				expect(count).toBeGreaterThan(0);
			}
		});
	});

	describe('minBy', () => {
		test('should return entry with minimum data field', () => {
			const entries = createEntries(5);
			const result = Selectors.minBy<TestData>('value')(entries);

			expect(result?.data.value).toBe(100);
			expect(result?.data.id).toBe('test1');
		});

		test('should return entry with minimum meta field', () => {
			const entries = createEntries(5);
			const result = Selectors.minBy<TestData>('usedCount')(entries);

			expect(result?.meta.usedCount).toBe(0);
			expect(result?.data.id).toBe('test1');
		});

		test('should return null for empty array', () => {
			const result = Selectors.minBy<TestData>('value')([]);

			expect(result).toBeNull();
		});

		test('should handle single entry', () => {
			const entries = createEntries(1);
			const result = Selectors.minBy<TestData>('value')(entries);

			expect(result?.data.id).toBe('test1');
		});

		test('should prefer data field over meta field', () => {
			const entries: PoolEntry<TestData>[] = [
				{ data: { id: 'a', value: 100, weight: 5 }, meta: { value: 200 } },
				{ data: { id: 'b', value: 150, weight: 3 }, meta: { value: 50 } },
			];

			const result = Selectors.minBy<TestData>('value')(entries);

			// Should pick entry with data.value = 100, not meta.value = 50
			expect(result?.data.id).toBe('a');
		});
	});

	describe('weighted', () => {
		test('should return weighted random entry', () => {
			const entries = createEntries(3);
			const weightFn = (e: PoolEntry<TestData>) => e.data.weight;

			const result = Selectors.weighted(weightFn)(entries);

			expect(result).not.toBeNull();
			expect(entries.some((e) => e.data.id === result?.data.id)).toBe(true);
		});

		test('should return null for empty array', () => {
			const weightFn = (e: PoolEntry<TestData>) => e.data.weight;
			const result = Selectors.weighted(weightFn)([]);

			expect(result).toBeNull();
		});

		test('should favor higher weights', () => {
			const entries: PoolEntry<TestData>[] = [
				{ data: { id: 'low', value: 100, weight: 1 }, meta: {} },
				{ data: { id: 'high', value: 200, weight: 99 }, meta: {} },
			];

			const weightFn = (e: PoolEntry<TestData>) => e.data.weight;
			const counts = new Map<string, number>();

			// Run many times
			for (let i = 0; i < 1000; i++) {
				const result = Selectors.weighted(weightFn)(entries);
				if (result) {
					const count = counts.get(result.data.id) ?? 0;
					counts.set(result.data.id, count + 1);
				}
			}

			const lowCount = counts.get('low') ?? 0;
			const highCount = counts.get('high') ?? 0;

			// High weight should be selected much more often
			expect(highCount).toBeGreaterThan(lowCount * 5);
		});

		test('should handle zero weights', () => {
			const entries: PoolEntry<TestData>[] = [
				{ data: { id: 'zero', value: 100, weight: 0 }, meta: {} },
				{ data: { id: 'nonzero', value: 200, weight: 10 }, meta: {} },
			];

			const weightFn = (e: PoolEntry<TestData>) => e.data.weight;
			const result = Selectors.weighted(weightFn)(entries);

			// Should only select the non-zero weight entry
			expect(result?.data.id).toBe('nonzero');
		});

		test('should fall back to random when all weights are zero', () => {
			const entries: PoolEntry<TestData>[] = [
				{ data: { id: 'a', value: 100, weight: 0 }, meta: {} },
				{ data: { id: 'b', value: 200, weight: 0 }, meta: {} },
			];

			const weightFn = (e: PoolEntry<TestData>) => e.data.weight;
			const result = Selectors.weighted(weightFn)(entries);

			// Should fall back to random selection, not null
			expect(result).not.toBeNull();
			expect(['a', 'b'].includes(result!.data.id)).toBe(true);
		});

		test('should handle negative weights in weighted selection', () => {
			const entries: PoolEntry<TestData>[] = [
				{ data: { id: 'negative', value: 100, weight: -10 }, meta: {} },
				{ data: { id: 'positive', value: 200, weight: 10 }, meta: {} },
			];

			const weightFn = (e: PoolEntry<TestData>) => e.data.weight;

			// Negative weights are allowed and work in the algorithm
			const result = Selectors.weighted(weightFn)(entries);

			expect(result).not.toBeNull();
			expect(['negative', 'positive'].includes(result!.data.id)).toBe(true);
		});

		test('should work with meta-based weights', () => {
			const entries: PoolEntry<TestData>[] = [
				{ data: { id: 'a', value: 100, weight: 1 }, meta: { score: 2 } },
				{ data: { id: 'b', value: 200, weight: 1 }, meta: { score: 8 } },
			];

			const weightFn = (e: PoolEntry<TestData>) => e.meta.score as number;
			const counts = new Map<string, number>();

			// Run many times
			for (let i = 0; i < 1000; i++) {
				const result = Selectors.weighted(weightFn)(entries);
				if (result) {
					const count = counts.get(result.data.id) ?? 0;
					counts.set(result.data.id, count + 1);
				}
			}

			const aCount = counts.get('a') ?? 0;
			const bCount = counts.get('b') ?? 0;

			// 'b' should be selected more often (4x weight)
			expect(bCount).toBeGreaterThan(aCount * 2);
		});
	});
});
