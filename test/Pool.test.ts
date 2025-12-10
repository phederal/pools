import { describe, test, expect, beforeEach } from 'bun:test';
import { Pool } from '../src/Pool';
import type { PoolEntry } from '../src/types';

interface TestData {
	id: string;
	name: string;
	value: number;
}

describe('Pool', () => {
	let pool: Pool<TestData>;

	beforeEach(() => {
		pool = new Pool<TestData>();
	});

	describe('CRUD Operations', () => {
		test('add() should add an entry', () => {
			const data = { id: '1', name: 'test', value: 100 };
			pool.add(data);

			expect(pool.size).toBe(1);
			expect(pool.all[0]).toEqual(data);
		});

		test('add() should add entry with metadata', () => {
			const data = { id: '1', name: 'test', value: 100 };
			const meta = { active: true, count: 5 };
			pool.add(data, meta);

			expect(pool.allEntries[0]?.meta).toEqual(meta);
		});

		test('addBatch() should add multiple entries', () => {
			pool.addBatch([
				{ data: { id: '1', name: 'test1', value: 100 } },
				{ data: { id: '2', name: 'test2', value: 200 } },
			]);

			expect(pool.size).toBe(2);
		});

		test('remove() should remove matching entries', () => {
			pool.add({ id: '1', name: 'test1', value: 100 });
			pool.add({ id: '2', name: 'test2', value: 200 });

			const removed = pool.remove((data) => data.id === '1');

			expect(removed.length).toBe(1);
			expect(pool.size).toBe(1);
			expect(pool.all[0]?.id).toBe('2');
		});

		test('removeBatch() should remove multiple matching entries', () => {
			pool.add({ id: '1', name: 'test1', value: 100 });
			pool.add({ id: '2', name: 'test2', value: 200 });
			pool.add({ id: '3', name: 'test3', value: 300 });

			const removed = pool.removeBatch([(data) => data.id === '1', (data) => data.id === '2']);

			expect(removed.length).toBe(2);
			expect(pool.size).toBe(1);
		});
	});

	describe('Map-like Operations', () => {
		beforeEach(() => {
			pool.add({ id: '1', name: 'test1', value: 100 });
			pool.add({ id: '2', name: 'test2', value: 200 });
		});

		test('get() by field should return matching data', () => {
			const result = pool.get('id', '1');

			expect(result).toEqual({ id: '1', name: 'test1', value: 100 });
		});

		test('get() by predicate should return matching data', () => {
			const result = pool.get((e) => e.data.value > 150);

			expect(result?.id).toBe('2');
		});

		test('get() should return null if not found', () => {
			const result = pool.get('id', '999');

			expect(result).toBeNull();
		});

		test('has() by field should return true if exists', () => {
			expect(pool.has('id', '1')).toBe(true);
			expect(pool.has('id', '999')).toBe(false);
		});

		test('has() by predicate should return true if exists', () => {
			expect(pool.has((e) => e.data.value > 150)).toBe(true);
			expect(pool.has((e) => e.data.value > 300)).toBe(false);
		});

		test('set() should update existing entry', () => {
			pool.set('id', '1', { id: '1', name: 'updated', value: 150 });

			const result = pool.get('id', '1');
			expect(result?.name).toBe('updated');
			expect(result?.value).toBe(150);
			expect(pool.size).toBe(2);
		});

		test('set() should add new entry if not exists', () => {
			pool.set('id', '3', { id: '3', name: 'new', value: 300 });

			expect(pool.size).toBe(3);
			expect(pool.get('id', '3')).toEqual({ id: '3', name: 'new', value: 300 });
		});

		test('delete() should remove entry and return true', () => {
			const result = pool.delete('id', '1');

			expect(result).toBe(true);
			expect(pool.size).toBe(1);
			expect(pool.get('id', '1')).toBeNull();
		});

		test('delete() should return false if entry not found', () => {
			const result = pool.delete('id', '999');

			expect(result).toBe(false);
			expect(pool.size).toBe(2);
		});
	});

	describe('Iteration Methods', () => {
		beforeEach(() => {
			pool.add({ id: '1', name: 'test1', value: 100 }, { active: true });
			pool.add({ id: '2', name: 'test2', value: 200 }, { active: false });
			pool.add({ id: '3', name: 'test3', value: 300 }, { active: true });
		});

		test('forEach() should iterate over all entries', () => {
			const ids: string[] = [];
			pool.forEach((entry) => {
				ids.push(entry.data.id);
			});

			expect(ids).toEqual(['1', '2', '3']);
		});

		test('map() should transform entries', () => {
			const values = pool.map((entry) => entry.data.value);

			expect(values).toEqual([100, 200, 300]);
		});

		test('filter() should return matching entries', () => {
			const active = pool.filter((entry) => entry.meta.active === true);

			expect(active.length).toBe(2);
			expect(active[0]?.data.id).toBe('1');
			expect(active[1]?.data.id).toBe('3');
		});

		test('reduce() should aggregate values', () => {
			const sum = pool.reduce((acc, entry) => acc + entry.data.value, 0);

			expect(sum).toBe(600);
		});

		test('some() should return true if any entry matches', () => {
			expect(pool.some((entry) => entry.data.value > 250)).toBe(true);
			expect(pool.some((entry) => entry.data.value > 500)).toBe(false);
		});

		test('every() should return true only if all entries match', () => {
			expect(pool.every((entry) => entry.data.value > 0)).toBe(true);
			expect(pool.every((entry) => entry.data.value > 100)).toBe(false);
		});

		test('find() should return first matching entry', () => {
			const entry = pool.find((e) => e.meta.active === true);

			expect(entry?.data.id).toBe('1');
		});

		test('findIndex() should return index of first match', () => {
			const index = pool.findIndex((e) => e.data.value === 200);

			expect(index).toBe(1);
		});

		test('findIndex() should return -1 if not found', () => {
			const index = pool.findIndex((e) => e.data.value === 999);

			expect(index).toBe(-1);
		});
	});

	describe('Combining Pools', () => {
		test('merge() should combine two pools', () => {
			const pool2 = new Pool<TestData>();
			pool.add({ id: '1', name: 'test1', value: 100 });
			pool2.add({ id: '2', name: 'test2', value: 200 });

			pool.merge(pool2);

			expect(pool.size).toBe(2);
		});

		test('mergeUnique() should combine pools without duplicates', () => {
			const pool2 = new Pool<TestData>();
			pool.add({ id: '1', name: 'test1', value: 100 });
			pool2.add({ id: '1', name: 'test1', value: 100 });
			pool2.add({ id: '2', name: 'test2', value: 200 });

			pool.mergeUnique(pool2, 'id');

			expect(pool.size).toBe(2);
		});

		test('union() should combine without duplicates', () => {
			const pool2 = new Pool<TestData>();
			pool.add({ id: '1', name: 'test1', value: 100 });
			pool2.add({ id: '1', name: 'test1', value: 100 });
			pool2.add({ id: '2', name: 'test2', value: 200 });

			pool.union(pool2, (a, b) => a.id === b.id);

			expect(pool.size).toBe(2);
		});

		test('intersect() should keep only common elements', () => {
			const pool2 = new Pool<TestData>();
			pool.add({ id: '1', name: 'test1', value: 100 });
			pool.add({ id: '2', name: 'test2', value: 200 });
			pool2.add({ id: '2', name: 'test2', value: 200 });
			pool2.add({ id: '3', name: 'test3', value: 300 });

			pool.intersect(pool2, (a, b) => a.id === b.id);

			expect(pool.size).toBe(1);
			expect(pool.all[0]?.id).toBe('2');
		});

		test('difference() should remove common elements', () => {
			const pool2 = new Pool<TestData>();
			pool.add({ id: '1', name: 'test1', value: 100 });
			pool.add({ id: '2', name: 'test2', value: 200 });
			pool2.add({ id: '2', name: 'test2', value: 200 });

			pool.difference(pool2, (a, b) => a.id === b.id);

			expect(pool.size).toBe(1);
			expect(pool.all[0]?.id).toBe('1');
		});

		test('deduplicate() should remove duplicates', () => {
			pool.add({ id: '1', name: 'test1', value: 100 });
			pool.add({ id: '1', name: 'test1', value: 100 });
			pool.add({ id: '2', name: 'test2', value: 200 });

			pool.deduplicate('id');

			expect(pool.size).toBe(2);
		});
	});

	describe('Transformations', () => {
		beforeEach(() => {
			pool.add({ id: '1', name: 'test1', value: 100 }, { active: true });
			pool.add({ id: '2', name: 'test2', value: 200 }, { active: false });
			pool.add({ id: '3', name: 'test3', value: 300 }, { active: true });
		});

		test('clone() should create a copy', () => {
			const cloned = pool.clone();

			expect(cloned.size).toBe(3);
			expect(cloned).not.toBe(pool);
			expect(cloned.all).toEqual(pool.all);
		});

		test('partition() should split pool into two', () => {
			const [active, inactive] = pool.partition((e) => e.meta.active === true);

			expect(active.size).toBe(2);
			expect(inactive.size).toBe(1);
		});

		test('sample() should return random subset', () => {
			const sample = pool.sample(2);

			expect(sample.size).toBe(2);
		});

		test('shuffle() should reorder entries', () => {
			const original = [...pool.all];
			pool.shuffle();

			expect(pool.size).toBe(3);
			// Can't guarantee order changed, but pool should have same elements
			expect(pool.all.sort((a, b) => a.id.localeCompare(b.id))).toEqual(original.sort((a, b) => a.id.localeCompare(b.id)));
		});

		test('groupBy() field should group by field value', () => {
			pool.add({ id: '4', name: 'test4', value: 100 });

			const grouped = pool.groupBy('value');

			expect(grouped.size).toBe(3);
			expect(grouped.get(100)?.size).toBe(2);
		});

		test('groupBy() function should group by function result', () => {
			const grouped = pool.groupBy((data) => (data.value > 150 ? 'high' : 'low'));

			expect(grouped.size).toBe(2);
			expect(grouped.get('high')?.size).toBe(2);
			expect(grouped.get('low')?.size).toBe(1);
		});
	});

	describe('Static Methods', () => {
		test('Pool.merge() should merge multiple pools', () => {
			const pool1 = new Pool<TestData>();
			const pool2 = new Pool<TestData>();
			pool1.add({ id: '1', name: 'test1', value: 100 });
			pool2.add({ id: '2', name: 'test2', value: 200 });

			const merged = Pool.merge(pool1, pool2);

			expect(merged.size).toBe(2);
		});

		test('Pool.mergeUnique() should merge with uniqueness', () => {
			const pool1 = new Pool<TestData>();
			const pool2 = new Pool<TestData>();
			pool1.add({ id: '1', name: 'test1', value: 100 });
			pool2.add({ id: '1', name: 'test1', value: 100 });
			pool2.add({ id: '2', name: 'test2', value: 200 });

			const merged = Pool.mergeUnique([pool1, pool2], 'id');

			expect(merged.size).toBe(2);
		});

		test('Pool.mergeUniqueWith() should use custom resolver', () => {
			const pool1 = new Pool<TestData>();
			const pool2 = new Pool<TestData>();
			pool1.add({ id: '1', name: 'test1', value: 100 });
			pool2.add({ id: '1', name: 'test1', value: 200 });

			const merged = Pool.mergeUniqueWith([pool1, pool2], 'id', (existing, duplicate) => {
				return existing.data.value > duplicate.data.value ? existing : duplicate;
			});

			expect(merged.size).toBe(1);
			expect(merged.all[0]?.value).toBe(200);
		});

		test('Pool.intersect() should find common elements', () => {
			const pool1 = new Pool<TestData>();
			const pool2 = new Pool<TestData>();
			pool1.add({ id: '1', name: 'test1', value: 100 });
			pool1.add({ id: '2', name: 'test2', value: 200 });
			pool2.add({ id: '2', name: 'test2', value: 200 });

			const result = Pool.intersect(pool1, pool2, (a, b) => a.id === b.id);

			expect(result.size).toBe(1);
			expect(result.all[0]?.id).toBe('2');
		});
	});

	describe('Events', () => {
		test('on("add") should fire when entry added', () => {
			let called = false;
			pool.on('add', () => {
				called = true;
			});

			pool.add({ id: '1', name: 'test', value: 100 });

			expect(called).toBe(true);
		});

		test('on("remove") should fire when entry removed', () => {
			let called = false;
			pool.add({ id: '1', name: 'test', value: 100 });
			pool.on('remove', () => {
				called = true;
			});

			pool.remove((data) => data.id === '1');

			expect(called).toBe(true);
		});

		test('on("get") should fire when entry retrieved', () => {
			let called = false;
			pool.add({ id: '1', name: 'test', value: 100 });
			pool.on('get', () => {
				called = true;
			});

			pool.get('id', '1');

			expect(called).toBe(true);
		});

		test('off() should unregister handler', () => {
			let count = 0;
			const handler = () => {
				count++;
			};
			pool.on('add', handler);
			pool.add({ id: '1', name: 'test', value: 100 });

			pool.off('add', handler);
			pool.add({ id: '2', name: 'test2', value: 200 });

			expect(count).toBe(1);
		});
	});

	describe('Properties', () => {
		beforeEach(() => {
			pool.add({ id: '1', name: 'test1', value: 100 });
			pool.add({ id: '2', name: 'test2', value: 200 });
		});

		test('size should return entry count', () => {
			expect(pool.size).toBe(2);
		});

		test('all should return array of data', () => {
			expect(pool.all.length).toBe(2);
			expect(pool.all[0]?.id).toBe('1');
		});

		test('allEntries should return array of entries', () => {
			expect(pool.allEntries.length).toBe(2);
			expect(pool.allEntries[0]?.data.id).toBe('1');
		});
	});
});
