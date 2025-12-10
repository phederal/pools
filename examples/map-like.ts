import { Pool } from '../src';
import type { PoolEntry } from '../src/types';

console.log('=== Pool as Map Replacement ===\n');

// ========== ПРОСТОЙ ПРИМЕР ==========

interface User {
	id: string;
	username: string;
	email: string;
	age: number;
}

const users = new Pool<User>();

console.log('--- Adding users ---\n');

// Добавляем пользователей
users.add({ id: 'user1', username: 'alice', email: 'alice@example.com', age: 25 });
users.add({ id: 'user2', username: 'bob', email: 'bob@example.com', age: 30 });
users.add({ id: 'user3', username: 'charlie', email: 'charlie@example.com', age: 35 });

console.log(`Total users: ${users.size}`);

// ========== GET ==========

console.log('\n--- Getting users ---\n');

// Получить по id (как Map)
const user1 = users.get('id', 'user1');
console.log('Get by id:', user1);

// Получить по username
const alice = users.get('username', 'alice');
console.log('Get by username:', alice);

// Получить по предикату
const adult = users.get((e) => e.data.age >= 30);
console.log('Get by predicate (age >= 30):', adult);

// ========== HAS ==========

console.log('\n--- Checking existence ---\n');

console.log('Has user1?', users.has('id', 'user1')); // true
console.log('Has user999?', users.has('id', 'user999')); // false
console.log('Has user named bob?', users.has('username', 'bob')); // true
console.log('Has user over 40?', users.has((e) => e.data.age > 40)); // false

// ========== SET ==========

console.log('\n--- Updating users ---\n');

// Обновить существующего пользователя
users.set('id', 'user1', { id: 'user1', username: 'alice_updated', email: 'alice_new@example.com', age: 26 });

console.log('Updated user1:', users.get('id', 'user1'));

// Добавить нового через set (если не существует)
users.set('id', 'user4', { id: 'user4', username: 'dave', email: 'dave@example.com', age: 28 });

console.log('New user4:', users.get('id', 'user4'));
console.log(`Total users: ${users.size}`);

// ========== DELETE ==========

console.log('\n--- Deleting users ---\n');

const deleted = users.delete('id', 'user2');
console.log('Deleted user2?', deleted); // true

const deletedAgain = users.delete('id', 'user2');
console.log('Deleted user2 again?', deletedAgain); // false (уже удален)

console.log(`Total users: ${users.size}`);

// ========== POOL OF POOLS ==========

console.log('\n=== Pool of Pools with get/has ===\n');

interface Project {
	id: string;
	name: string;
}

const webProjects = new Pool<Project>();
webProjects.add({ id: 'p1', name: 'Website' });
webProjects.add({ id: 'p2', name: 'Web App' });

const mobileProjects = new Pool<Project>();
mobileProjects.add({ id: 'p3', name: 'iOS App' });
mobileProjects.add({ id: 'p4', name: 'Android App' });

const backendProjects = new Pool<Project>();
backendProjects.add({ id: 'p5', name: 'API Server' });
backendProjects.add({ id: 'p6', name: 'Database' });

// Создаем пул пулов с id в метаданных
const projectPools = new Pool<Pool<Project>>();
projectPools.add(webProjects, { id: 'web', category: 'Frontend' });
projectPools.add(mobileProjects, { id: 'mobile', category: 'Mobile' });
projectPools.add(backendProjects, { id: 'backend', category: 'Backend' });

console.log(`Total project pools: ${projectPools.size}`);

// Получить пул по id в метаданных
const webPool = projectPools.get((e) => e.meta.id === 'web');
if (webPool) {
	console.log(`\nWeb projects pool has ${webPool.size} projects:`);
	webPool.all.forEach((p) => console.log(`  - ${p.name}`));
}

// Получить пул по категории
const mobilePool = projectPools.get((e) => e.meta.category === 'Mobile');
if (mobilePool) {
	console.log(`\nMobile projects pool has ${mobilePool.size} projects:`);
	mobilePool.all.forEach((p) => console.log(`  - ${p.name}`));
}

// Проверить наличие пула
console.log('\nHas web pool?', projectPools.has((e) => e.meta.id === 'web')); // true
console.log('Has desktop pool?', projectPools.has((e) => e.meta.id === 'desktop')); // false

// Получить пул с самым большим количеством проектов
const biggestPool = projectPools.get((e) => {
	return e.data.size === Math.max(...projectPools.all.map((p) => p.size));
});

if (biggestPool) {
	const entry = projectPools.allEntries.find((e) => e.data === biggestPool);
	console.log(`\nBiggest pool: ${entry?.meta.id} with ${biggestPool.size} projects`);
}

// ========== COMPLEX EXAMPLE ==========

console.log('\n=== Complex Map-like Usage ===\n');

interface Config {
	key: string;
	value: any;
	type: string;
}

const config = new Pool<Config>();

// Используем как конфиг Map
config.set('key', 'apiUrl', { key: 'apiUrl', value: 'https://api.example.com', type: 'string' });
config.set('key', 'timeout', { key: 'timeout', value: 5000, type: 'number' });
config.set('key', 'debug', { key: 'debug', value: true, type: 'boolean' });

console.log('Config entries:');
config.all.forEach((c) => {
	console.log(`  ${c.key}: ${c.value} (${c.type})`);
});

// Получить значение конфига
const apiUrl = config.get('key', 'apiUrl');
console.log('\nAPI URL:', apiUrl?.value);

// Обновить конфиг
config.set('key', 'timeout', { key: 'timeout', value: 10000, type: 'number' });
console.log('Updated timeout:', config.get('key', 'timeout')?.value);

// Проверить наличие
console.log('\nHas apiUrl?', config.has('key', 'apiUrl'));
console.log('Has maxRetries?', config.has('key', 'maxRetries'));

// Удалить конфиг
config.delete('key', 'debug');
console.log('\nAfter deleting debug, size:', config.size);

// ========== EVENTS WITH GET/SET ==========

console.log('\n=== Events with get/set/delete ===\n');

const cache = new Pool<{ key: string; value: string }>();

// Логирование при получении
cache.on('get', (entry: PoolEntry<{ key: string; value: string }>) => {
	console.log(`  [Cache] GET: ${entry.data.key}`);
});

// Логирование при установке
cache.on('set', (entry: PoolEntry<{ key: string; value: string }>) => {
	console.log(`  [Cache] SET: ${entry.data.key} = ${entry.data.value}`);
});

// Логирование при удалении
cache.on('remove', (entry: PoolEntry<{ key: string; value: string }>) => {
	console.log(`  [Cache] DELETE: ${entry.data.key}`);
});

console.log('Cache operations:');
cache.set('key', 'user:123', { key: 'user:123', value: 'John Doe' });
cache.get('key', 'user:123');
cache.set('key', 'user:123', { key: 'user:123', value: 'Jane Doe' }); // Update
cache.delete('key', 'user:123');

console.log('\n=== Example Complete ===');
