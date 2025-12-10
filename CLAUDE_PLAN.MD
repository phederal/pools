# Резюме проекта: Pools

## Суть проекта

**Pools** - это легковесная TypeScript библиотека для удобной работы с коллекциями данных. Это **замена массивов, объектов и Map** с встроенными фильтрами, сортировкой, мета-данными и комбинированием пулов.

**Не является:**

-   ORM или заменой БД
-   Решением для миллионов записей
-   Enterprise-фреймворком

**Является:**

-   Утилитой для ежедневной работы с коллекциями
-   Абстракцией над массивами с удобным API
-   Инструментом для быстрого создания пулов любых сущностей

---

## Какие задачи решает

### Проблема (без библиотеки):

```typescript
// Работа с прокси
const proxies = [
	{ ip: '1.1.1.1', country: 'US' },
	{ ip: '2.2.2.2', country: 'UK' },
];

// Фильтрация руками
const usProxies = proxies.filter((p) => p.country === 'US');

// Сортировка руками
usProxies.sort((a, b) => a.usedCount - b.usedCount);

// Взять случайный
const proxy = usProxies[Math.floor(Math.random() * usProxies.length)];

// Отметить использование - руками везде
proxy.usedCount++;
proxy.lastUsed = new Date();

// Связывание с аккаунтами - вручную
const account = accounts.find((a) => a.status === 'active');
if (!proxy || !account) return null;

// Комбинирование из разных источников - сложно
const allProxies = [...usProxies, ...ukProxies, ...euProxies];
const unique = Array.from(new Map(allProxies.map((p) => [p.ip, p])).values());
```

### Решение (с библиотекой):

```typescript
// Создание пула за секунды
const proxies = new Pool<Proxy>();
proxies.add({ ip: '1.1.1.1', country: 'US' }, { usedCount: 0 });

// Автоматическое обновление мета-данных
proxies.on('get', (entry) => {
	entry.meta.usedCount++;
	entry.meta.lastUsed = new Date();
});

// Chainable фильтры и сортировка
const proxy = proxies
	.query()
	.where((e) => e.data.country === 'US')
	.where((e) => e.meta.usedCount < 10)
	.sortByMeta('usedCount', 'asc')
	.select(Selectors.random);

// Связывание пулов типобезопасно
const combo = new PoolBinder()
	.bind('proxy', proxies)
	.bind('account', accounts)
	.where('proxy', (e) => e.data.country === 'US')
	.where('account', (e) => e.meta.status === 'active')
	.execute();
// { proxy: {...}, account: {...} }

// Комбинирование пулов одной строкой
const allProxies = Pool.mergeUnique([usProxies, ukProxies, euProxies], 'ip');
```

---

## Итоговый план архитектуры

### Основные типы:

```typescript
type PoolEntry<T> = {
	data: T; // пользовательские данные
	meta: Record<string, any>; // служебные мета-данные
};

type Filter<T> = (entry: PoolEntry<T>) => boolean;
type Selector<T> = (entries: PoolEntry<T>[]) => PoolEntry<T> | null;
```

---

### Класс Pool<T>

**CRUD операции:**

-   `add(data: T, meta?: Record<string, any>): PoolEntry<T>`
-   `addBatch(items: { data: T, meta?: Record<string, any> }[]): PoolEntry<T>[]`
-   `remove(predicate: (data: T) => boolean): PoolEntry<T>[]`
-   `removeBatch(predicates: ((data: T) => boolean)[]): PoolEntry<T>[]`

**Query API:**

-   `query(): PoolQuery<T>`

**Комбинирование пулов:**

-   `merge(source: Pool<T> | PoolQuery<T>): this`
-   `mergeUnique(source: Pool<T> | PoolQuery<T>, uniqueBy: keyof T | ((item: T) => any)): this`
-   `union(other: Pool<T>, compareFn?: (a: T, b: T) => boolean): this`
-   `intersect(other: Pool<T>, compareFn?: (a: T, b: T) => boolean): this`
-   `difference(other: Pool<T>, compareFn?: (a: T, b: T) => boolean): this`
-   `deduplicate(uniqueBy: keyof T | ((item: T) => any)): this`

**Трансформация:**

-   `clone(): Pool<T>`
-   `partition(predicate: (entry: PoolEntry<T>) => boolean): [Pool<T>, Pool<T>]`
-   `sample(count: number): Pool<T>`
-   `shuffle(): this`
-   `groupBy(groupBy: keyof T | ((item: T) => any)): Map<any, Pool<T>>`

**Статические методы:**

-   `static merge<T>(...pools: Pool<T>[]): Pool<T>`
-   `static mergeUnique<T>(sources: (Pool<T> | PoolQuery<T>)[], uniqueBy: keyof T | ((item: T) => any)): Pool<T>`
-   `static mergeUniqueWith<T>(sources: (Pool<T> | PoolQuery<T>)[], uniqueBy: keyof T | ((item: T) => any), resolveDuplicate: (existing: PoolEntry<T>, duplicate: PoolEntry<T>) => PoolEntry<T>): Pool<T>`
-   `static intersect<T>(pool1: Pool<T>, pool2: Pool<T>, compareFn?: (a: T, b: T) => boolean): Pool<T>`
-   `static groupBy<T>(sources: (Pool<T> | PoolQuery<T>)[], groupBy: keyof T | ((item: T) => any)): Map<any, Pool<T>>`

**События:**

-   `on(event: string, handler: Function): void`
-   `off(event: string, handler: Function): void`
-   `emit(event: string, ...args: any[]): void` (internal)

**События которые генерируются:**

-   `'add'` - `(entry: PoolEntry<T>) => void`
-   `'remove'` - `(entry: PoolEntry<T>) => void`
-   `'get'` - `(entry: PoolEntry<T>) => void`
-   `'set'` - `(entry: PoolEntry<T>, changes: Partial<T>) => void`
-   `'batchAdd'` - `(entries: PoolEntry<T>[]) => void`
-   `'batchRemove'` - `(entries: PoolEntry<T>[]) => void`
-   `'beforeSelect'` - `(entries: PoolEntry<T>[]) => void`
-   `'afterSelect'` - `(entry: PoolEntry<T> | null) => void`

**Расширение:**

-   `wrap<K extends keyof this>(method: K, wrapper: (original: Function, ...args: any[]) => any): void`

**Утилиты:**

-   `get size(): number`
-   `get all(): T[]`
-   `get allEntries(): PoolEntry<T>[]`

---

### Класс PoolQuery<T>

**Фильтрация:**

-   `where(filter: Filter<T>): this`
-   `whereOr(filters: Filter<T>[]): this`

**Сортировка (chainable):**

-   `sortBy(fn: (a: PoolEntry<T>, b: PoolEntry<T>) => number): this`
-   `sortBy(field: keyof T, order?: 'asc' | 'desc'): this`
-   `sortByMeta(field: string, order?: 'asc' | 'desc'): this`

**Пагинация:**

-   `offset(count: number): this`
-   `take(count: number): this`

**Материализация:**

-   `select(selector: Selector<T>): T | null`
-   `toArray(): T[]`
-   `toPool(): Pool<T>`
-   `get count(): number`

**Расширение:**

-   `wrap<K extends keyof this>(method: K, wrapper: (original: Function, ...args: any[]) => any): void`

---

### Встроенные Selectors

```typescript
export const Selectors = {
  random: <T>(entries: PoolEntry<T>[]) => PoolEntry<T> | null
  first: <T>(entries: PoolEntry<T>[]) => PoolEntry<T> | null
  last: <T>(entries: PoolEntry<T>[]) => PoolEntry<T> | null
  minBy: <T>(field: string) => (entries: PoolEntry<T>[]) => PoolEntry<T> | null
  weighted: <T>(weightFn: (entry: PoolEntry<T>) => number) => (entries: PoolEntry<T>[]) => PoolEntry<T> | null
}
```

---

### Класс PoolBinder

**Связывание пулов:**

-   `bind<T>(name: string, pool: Pool<T>): this`
-   `where<T>(poolName: string, filter: Filter<T>): this`
-   `selectWith<T>(poolName: string, selector: Selector<T>): this`
-   `execute(): Record<string, any> | null`

---

## Пример использования всего вместе

```typescript
// ========== ОПРЕДЕЛЕНИЕ ТИПОВ ==========

interface Proxy {
	ip: string;
	country: string;
	speed: number;
	provider: string;
}

interface Account {
	username: string;
	password: string;
	service: string;
}

interface Service {
	name: string;
	url: string;
}

// ========== СОЗДАНИЕ ПУЛОВ ==========

const proxies = new Pool<Proxy>();
const accounts = new Pool<Account>();
const services = new Pool<Service>();

// ========== ДОБАВЛЕНИЕ ДАННЫХ ==========

// Одиночное добавление
proxies.add({ ip: '1.1.1.1', country: 'US', speed: 100, provider: 'ProviderA' }, { usedCount: 0, lastUsed: null, active: true });

// Batch добавление
proxies.addBatch([
	{
		data: { ip: '2.2.2.2', country: 'UK', speed: 200, provider: 'ProviderB' },
		meta: { usedCount: 5, lastUsed: new Date(), active: true },
	},
	{
		data: { ip: '3.3.3.3', country: 'DE', speed: 150, provider: 'ProviderA' },
		meta: { usedCount: 0, lastUsed: null, active: false },
	},
]);

// ========== СОБЫТИЯ ==========

// Автоматическое обновление статистики при использовании
proxies.on('get', (entry) => {
	entry.meta.usedCount = (entry.meta.usedCount || 0) + 1;
	entry.meta.lastUsed = new Date();
});

// Логирование
proxies.on('add', (entry) => {
	console.log(`[Pool] Added proxy: ${entry.data.ip}`);
});

// ========== WRAP ДЛЯ БД ==========

// Синхронизация с базой данных
proxies.wrap('add', async (original, data, meta) => {
	const entry = original(data, meta);

	// Сохраняем в БД
	await db.insert('proxies', {
		data: JSON.stringify(data),
		meta: JSON.stringify(meta),
	});

	return entry;
});

// Ленивая загрузка из БД
proxies.wrap('query', (original) => {
	return () => {
		// Загружаем из БД при первом query, если пул пустой
		if (proxies.size === 0) {
			const rows = db.querySync('SELECT * FROM proxies');
			rows.forEach((row) => {
				proxies.add(JSON.parse(row.data), JSON.parse(row.meta));
			});
		}

		return original();
	};
});

// ========== QUERY API ==========

// Простой запрос
const proxy = proxies
	.query()
	.where((e) => e.data.country === 'US')
	.select(Selectors.random);

// Сложный запрос с композицией фильтров и сортировок
const bestProxy = proxies
	.query()
	.where((e) => e.data.country === 'US')
	.where((e) => e.meta.active === true)
	.whereOr([(e) => e.data.provider === 'ProviderA', (e) => e.data.provider === 'ProviderB'])
	.where((e) => e.meta.usedCount < 10)
	.sortBy('speed', 'desc') // первая сортировка по скорости
	.sortByMeta('usedCount', 'asc') // вторая сортировка по использованию
	.sortBy('country') // третья сортировка по стране
	.select(Selectors.first);

// Пагинация
const page2Proxies = proxies
	.query()
	.where((e) => e.meta.active)
	.sortBy('speed', 'desc')
	.offset(20) // пропустить первые 20
	.take(10) // взять следующие 10
	.toArray();

// Получить все отфильтрованные
const activeProxies = proxies
	.query()
	.where((e) => e.meta.active)
	.toArray();

// Преобразовать query в Pool
const usProxiesPool = proxies
	.query()
	.where((e) => e.data.country === 'US')
	.toPool();

// ========== КОМБИНИРОВАНИЕ ПУЛОВ ==========

const usProxies = new Pool<Proxy>();
const ukProxies = new Pool<Proxy>();
const euProxies = new Pool<Proxy>();

// Merge - добавить все из другого пула
usProxies.merge(ukProxies);

// Merge с query - добавить только отфильтрованные
usProxies.merge(euProxies.query().where((e) => e.data.speed > 100));

// Merge уникальных по IP
usProxies.mergeUnique(ukProxies, 'ip');

// Merge уникальных по комбинации полей
usProxies.mergeUnique(ukProxies, (p) => `${p.ip}:${p.provider}`);

// Union - объединение без дубликатов
usProxies.union(ukProxies, (a, b) => a.ip === b.ip);

// Intersect - оставить только общие
usProxies.intersect(ukProxies, (a, b) => a.ip === b.ip);

// Difference - удалить те что есть в ukProxies
usProxies.difference(ukProxies, (a, b) => a.ip === b.ip);

// Deduplicate - удалить дубликаты внутри пула
proxies.deduplicate('ip');

// ========== СТАТИЧЕСКИЕ МЕТОДЫ ==========

// Merge из нескольких пулов
const allProxies = Pool.merge(usProxies, ukProxies, euProxies);

// Уникальные из нескольких пулов
const uniqueProxies = Pool.mergeUnique([usProxies, ukProxies, euProxies], 'ip');

// Уникальные с приоритетом (оставляем самый быстрый)
const bestProxies = Pool.mergeUniqueWith([usProxies, ukProxies, euProxies], 'ip', (existing, duplicate) => (existing.data.speed > duplicate.data.speed ? existing : duplicate));

// Пересечение двух пулов
const commonProxies = Pool.intersect(usProxies, ukProxies, (a, b) => a.provider === b.provider);

// Группировка нескольких пулов
const byCountry = Pool.groupBy([usProxies, ukProxies, euProxies], 'country');
// Map { 'US' => Pool, 'UK' => Pool, 'DE' => Pool, ... }

const germanProxies = byCountry.get('DE');

// ========== ТРАНСФОРМАЦИИ ==========

// Clone - клонирование пула
const backupProxies = proxies.clone();

// Partition - разделение на два пула
const [active, inactive] = proxies.partition((e) => e.meta.active === true);

// Sample - взять N случайных
const randomSample = proxies.sample(10);

// Shuffle - перемешать
proxies.shuffle();

// GroupBy на уровне инстанса
const proxyGroups = proxies.groupBy('provider');
// Map { 'ProviderA' => Pool, 'ProviderB' => Pool, ... }

const providerAProxies = proxyGroups.get('ProviderA');

// Группировка по кастомной функции
const speedGroups = proxies.groupBy((p) => (p.speed < 100 ? 'slow' : p.speed < 300 ? 'medium' : 'fast'));
// Map { 'slow' => Pool, 'medium' => Pool, 'fast' => Pool }

// ========== СВЯЗЫВАНИЕ ПУЛОВ ==========

const binder = new PoolBinder()
	.bind('proxy', proxies)
	.bind('account', accounts)
	.bind('service', services)
	.where('proxy', (e) => e.data.country === 'US')
	.where('proxy', (e) => e.meta.active === true)
	.where('account', (e) => e.data.service === 'twitter')
	.where('service', (e) => e.data.name === 'API')
	.selectWith('proxy', Selectors.minBy('usedCount'))
	.selectWith('account', Selectors.random)
	.selectWith('service', Selectors.first);

const combo = binder.execute();
// {
//   proxy: { ip: '1.1.1.1', country: 'US', ... },
//   account: { username: 'user1', ... },
//   service: { name: 'API', url: 'https://...' }
// }

if (!combo) {
	console.log('Не удалось найти комбинацию');
}

// ========== СЛОЖНЫЙ WORKFLOW ==========

// 1. Загружаем прокси из трёх источников
const provider1 = new Pool<Proxy>();
const provider2 = new Pool<Proxy>();
const provider3 = new Pool<Proxy>();

// Загрузка данных...

// 2. Объединяем с приоритетом по скорости
const masterPool = Pool.mergeUniqueWith([provider1, provider2, provider3], 'ip', (existing, duplicate) => (existing.data.speed > duplicate.data.speed ? existing : duplicate));

// 3. Группируем по странам
const poolsByCountry = masterPool.groupBy('country');

// 4. Для каждой страны берём топ-20 по скорости
const topPools = new Map<string, Pool<Proxy>>();

poolsByCountry.forEach((pool, country) => {
	const top20 = pool
		.query()
		.where((e) => e.meta.active)
		.sortBy('speed', 'desc')
		.take(20)
		.toPool();

	topPools.set(country, top20);
});

// 5. Работаем с топ-пулами
const usTop = topPools.get('US')!;

// Хук для ротации при большом использовании
usTop.on('get', (entry) => {
	if (entry.meta.usedCount > 50) {
		// Деактивируем перегруженный прокси
		entry.meta.active = false;
	}
});

// 6. Связываем с аккаунтами и выполняем задачи
for (let i = 0; i < 100; i++) {
	const combo = new PoolBinder()
		.bind('proxy', usTop)
		.bind('account', accounts)
		.where('proxy', (e) => e.meta.active && e.meta.usedCount < 50)
		.where('account', (e) => e.data.service === 'twitter')
		.selectWith('proxy', Selectors.minBy('usedCount'))
		.selectWith('account', Selectors.random)
		.execute();

	if (!combo) {
		console.log('Нет доступных комбинаций');
		break;
	}

	// Выполняем задачу с combo.proxy и combo.account
	await performTask(combo.proxy, combo.account);
}
```

---

## План реализации

### Этап 1: Базовая структура (Core)

**Файлы:**

-   `src/types.ts` - базовые типы
-   `src/PoolEntry.ts` - класс или тип PoolEntry
-   `src/Pool.ts` - основной класс Pool
-   `src/PoolQuery.ts` - класс Query

**Задачи:**

1. Определить базовые типы: `PoolEntry<T>`, `Filter<T>`, `Selector<T>`
2. Реализовать `Pool<T>`:
    - Конструктор и приватное поле `entries: PoolEntry<T>[]`
    - CRUD: `add()`, `remove()`
    - Query: `query()` возвращает `PoolQuery<T>`
    - Геттеры: `size`, `all`, `allEntries`
3. Реализовать `PoolQuery<T>`:
    - Поля: `entries`, `filters[]`, `sorters[]`, `skipCount`, `takeCount`
    - Методы: `where()`, `whereOr()`
    - Метод `materialize()` - применяет фильтры и сортировки
    - Методы: `select()`, `toArray()`, `count`

**Тесты:**

```typescript
test('Pool: add and query', () => {
	const pool = new Pool<{ id: number }>();
	pool.add({ id: 1 });
	pool.add({ id: 2 });

	const result = pool
		.query()
		.where((e) => e.data.id === 1)
		.toArray();
	expect(result).toEqual([{ id: 1 }]);
});
```

---

### Этап 2: Сортировка

**Файлы:**

-   `src/PoolQuery.ts` - расширение

**Задачи:**

1. Реализовать перегрузки `sortBy()`:
    - `sortBy(fn: Function)`
    - `sortBy(field: keyof T, order?: 'asc' | 'desc')`
2. Реализовать `sortByMeta(field: string, order?: 'asc' | 'desc')`
3. Chainable композиция - массив `sorters[]`
4. В `materialize()` применять все sorters последовательно

**Тесты:**

```typescript
test('Query: chained sorting', () => {
	const pool = new Pool<{ name: string; age: number }>();
	pool.add({ name: 'Alice', age: 30 }, { score: 10 });
	pool.add({ name: 'Bob', age: 30 }, { score: 20 });

	const result = pool.query().sortBy('age', 'asc').sortByMeta('score', 'desc').toArray();

	expect(result[0].name).toBe('Bob');
});
```

---

### Этап 3: Пагинация

**Файлы:**

-   `src/PoolQuery.ts` - расширение

**Задачи:**

1. Добавить поля `offsetCount`, `takeCount`
2. Реализовать `offset(count)` и `take(count)`
3. В `materialize()` применять `slice(offsetCount, offsetCount + takeCount)`

**Тесты:**

```typescript
test('Query: pagination', () => {
	const pool = new Pool<{ id: number }>();
	for (let i = 0; i < 100; i++) pool.add({ id: i });

	const page2 = pool.query().offset(20).take(10).toArray();
	expect(page2.length).toBe(10);
	expect(page2[0].id).toBe(20);
});
```

---

### Этап 4: Селекторы

**Файлы:**

-   `src/Selectors.ts` - встроенные селекторы

**Задачи:**

1. Реализовать `Selectors.random`
2. Реализовать `Selectors.first`
3. Реализовать `Selectors.last`
4. Реализовать `Selectors.minBy(field)`
5. Реализовать `Selectors.weighted(weightFn)`

**Тесты:**

```typescript
test('Selectors: minBy', () => {
	const pool = new Pool<{ id: number }>();
	pool.add({ id: 1 }, { score: 10 });
	pool.add({ id: 2 }, { score: 5 });

	const result = pool.query().select(Selectors.minBy('score'));
	expect(result.id).toBe(2);
});
```

---

### Этап 5: События (Events)

**Файлы:**

-   `src/Pool.ts` - расширение

**Задачи:**

1. Добавить поле `eventHandlers: Map<string, Function[]>`
2. Реализовать `on(event, handler)`
3. Реализовать `off(event, handler)`
4. Реализовать `emit(event, ...args)` (private/protected)
5. Вызывать события в нужных местах:
    - `add()` → emit('add', entry)
    - `remove()` → emit('remove', entry)
    - `select()` → emit('beforeSelect', entries), emit('afterSelect', entry), emit('get', entry)

**Тесты:**

```typescript
test('Events: on get', () => {
	const pool = new Pool<{ id: number }>();
	let counter = 0;

	pool.on('get', (entry) => {
		entry.meta.usedCount = (entry.meta.usedCount || 0) + 1;
		counter++;
	});

	pool.add({ id: 1 });
	pool.query().select(Selectors.first);

	expect(counter).toBe(1);
});
```

---

### Этап 6: Wrap (метод обертки)

**Файлы:**

-   `src/Pool.ts` - расширение
-   `src/PoolQuery.ts` - расширение

**Задачи:**

1. Реализовать `Pool.wrap<K extends keyof this>(method, wrapper)`
2. Реализовать `PoolQuery.wrap<K extends keyof this>(method, wrapper)`
3. Сохранять оригинальный метод и подменять на wrapper

**Тесты:**

```typescript
test('Wrap: add logging', () => {
	const pool = new Pool<{ id: number }>();
	const logs: string[] = [];

	pool.wrap('add', (original, data, meta) => {
		logs.push('before add');
		const result = original(data, meta);
		logs.push('after add');
		return result;
	});

	pool.add({ id: 1 });
	expect(logs).toEqual(['before add', 'after add']);
});
```

---

### Этап 7: Batch операции

**Файлы:**

-   `src/Pool.ts` - расширение

**Задачи:**

1. Реализовать `addBatch(items[])`
2. Реализовать `removeBatch(predicates[])`
3. Генерировать события `batchAdd`, `batchRemove`

**Тесты:**

```typescript
test('Batch: addBatch', () => {
	const pool = new Pool<{ id: number }>();

	pool.addBatch([
		{ data: { id: 1 }, meta: {} },
		{ data: { id: 2 }, meta: {} },
	]);

	expect(pool.size).toBe(2);
});
```

---

### Этап 8: Комбинирование пулов (инстанс методы)

**Файлы:**

-   `src/Pool.ts` - расширение

**Задачи:**

1. Реализовать `merge(source: Pool<T> | PoolQuery<T>)`
2. Реализовать `mergeUnique(source, uniqueBy)`
3. Реализовать `union(other, compareFn?)`
4. Реализовать `intersect(other, compareFn?)`
5. Реализовать `difference(other, compareFn?)`
6. Реализовать `deduplicate(uniqueBy)`

**Тесты:**

```typescript
test('Pool: merge unique', () => {
	const pool1 = new Pool<{ ip: string }>();
	const pool2 = new Pool<{ ip: string }>();

	pool1.add({ ip: '1.1.1.1' });
	pool2.add({ ip: '1.1.1.1' });
	pool2.add({ ip: '2.2.2.2' });

	pool1.mergeUnique(pool2, 'ip');

	expect(pool1.size).toBe(2);
});
```

---

### Этап 9: Трансформации

**Файлы:**

-   `src/Pool.ts` - расширение

**Задачи:**

1. Реализовать `clone()`
2. Реализовать `partition(predicate)` → возвращает `[Pool<T>, Pool<T>]`
3. Реализовать `sample(count)`
4. Реализовать `shuffle()`
5. Реализовать `groupBy(groupBy)` → возвращает `Map<any, Pool<T>>`

**Тесты:**

```typescript
test('Pool: partition', () => {
	const pool = new Pool<{ id: number }>();
	pool.add({ id: 1 }, { active: true });
	pool.add({ id: 2 }, { active: false });

	const [active, inactive] = pool.partition((e) => e.meta.active === true);

	expect(active.size).toBe(1);
	expect(inactive.size).toBe(1);
});

test('Pool: groupBy', () => {
	const pool = new Pool<{ country: string }>();
	pool.add({ country: 'US' });
	pool.add({ country: 'UK' });
	pool.add({ country: 'US' });

	const groups = pool.groupBy('country');

	expect(groups.size).toBe(2);
	expect(groups.get('US')!.size).toBe(2);
	expect(groups.get('UK')!.size).toBe(1);
});
```

---

### Этап 10: Статические методы

**Файлы:**

-   `src/Pool.ts` - расширение

**Задачи:**

1. Реализовать `static merge<T>(...pools: Pool<T>[]): Pool<T>`
2. Реализовать `static mergeUnique<T>(sources, uniqueBy): Pool<T>`
3. Реализовать `static mergeUniqueWith<T>(sources, uniqueBy, resolveDuplicate): Pool<T>`
4. Реализовать `static intersect<T>(pool1, pool2, compareFn?): Pool<T>`
5. Реализовать `static groupBy<T>(sources, groupBy): Map<any, Pool<T>>`

**Тесты:**

```typescript
test('Pool.mergeUnique: from multiple pools', () => {
	const pool1 = new Pool<{ ip: string }>();
	const pool2 = new Pool<{ ip: string }>();
	const pool3 = new Pool<{ ip: string }>();

	pool1.add({ ip: '1.1.1.1' });
	pool2.add({ ip: '1.1.1.1' });
	pool2.add({ ip: '2.2.2.2' });
	pool3.add({ ip: '3.3.3.3' });

	const merged = Pool.mergeUnique([pool1, pool2, pool3], 'ip');

	expect(merged.size).toBe(3);
});

test('Pool.mergeUniqueWith: priority by speed', () => {
	const pool1 = new Pool<{ ip: string; speed: number }>();
	const pool2 = new Pool<{ ip: string; speed: number }>();

	pool1.add({ ip: '1.1.1.1', speed: 100 });
	pool2.add({ ip: '1.1.1.1', speed: 200 });

	const merged = Pool.mergeUniqueWith([pool1, pool2], 'ip', (existing, duplicate) => (existing.data.speed > duplicate.data.speed ? existing : duplicate));

	const result = merged.query().select(Selectors.first);
	expect(result!.speed).toBe(200);
});
```

---

### Этап 11: Query.toPool()

**Файлы:**

-   `src/PoolQuery.ts` - расширение

**Задачи:**

1. Реализовать `toPool(): Pool<T>`
2. Создать новый Pool и скопировать в него отфильтрованные entries

**Тесты:**

```typescript
test('Query: toPool', () => {
	const pool = new Pool<{ country: string }>();
	pool.add({ country: 'US' });
	pool.add({ country: 'UK' });
	pool.add({ country: 'US' });

	const usPool = pool
		.query()
		.where((e) => e.data.country === 'US')
		.toPool();

	expect(usPool.size).toBe(2);
	expect(usPool instanceof Pool).toBe(true);
});
```

---

### Этап 12: PoolBinder

**Файлы:**

-   `src/PoolBinder.ts` - новый класс

**Задачи:**

1. Создать класс `PoolBinder`
2. Добавить поля:
    - `pools: Map<string, Pool<any>>`
    - `filters: Map<string, Filter<any>>`
    - `selectors: Map<string, Selector<any>>`
3. Реализовать методы:
    - `bind(name, pool)`
    - `where(poolName, filter)`
    - `selectWith(poolName, selector)`
    - `execute()` → возвращает `Record<string, any> | null`
4. В `execute()`:
    - Проходим по всем пулам
    - Применяем фильтры и селекторы
    - Если хоть один вернул `null` → возвращаем `null`
    - Иначе возвращаем объект с результатами

**Тесты:**

```typescript
test('PoolBinder: basic binding', () => {
	const proxies = new Pool<{ ip: string; country: string }>();
	const accounts = new Pool<{ username: string }>();

	proxies.add({ ip: '1.1.1.1', country: 'US' });
	accounts.add({ username: 'user1' });

	const binder = new PoolBinder()
		.bind('proxy', proxies)
		.bind('account', accounts)
		.where('proxy', (e) => e.data.country === 'US')
		.selectWith('proxy', Selectors.first)
		.selectWith('account', Selectors.random);

	const combo = binder.execute();

	expect(combo).not.toBeNull();
	expect(combo!.proxy.ip).toBe('1.1.1.1');
	expect(combo!.account.username).toBe('user1');
});

test('PoolBinder: returns null when no match', () => {
	const proxies = new Pool<{ country: string }>();
	const accounts = new Pool<{ username: string }>();

	proxies.add({ country: 'UK' });
	accounts.add({ username: 'user1' });

	const binder = new PoolBinder()
		.bind('proxy', proxies)
		.bind('account', accounts)
		.where('proxy', (e) => e.data.country === 'US'); // не найдет

	const combo = binder.execute();

	expect(combo).toBeNull();
});
```

---

### Этап 13: Типобезопасность и exports

**Файлы:**

-   `src/index.ts` - главный файл экспортов
-   `src/types.ts` - экспорт типов

**Задачи:**

1. Создать `src/index.ts`:

```typescript
export { Pool } from './Pool';
export { PoolQuery } from './PoolQuery';
export { PoolBinder } from './PoolBinder';
export { Selectors } from './Selectors';
export type { PoolEntry, Filter, Selector } from './types';
```

2. Проверить все generic типы
3. Убедиться что TypeScript корректно выводит типы:

```typescript
const pool = new Pool<{ id: number }>();
const result = pool.query().select(Selectors.first);
// result должен быть типа: {id: number} | null
```

**Тесты:**

```typescript
test('TypeScript: correct type inference', () => {
	const pool = new Pool<{ id: number; name: string }>();
	pool.add({ id: 1, name: 'test' });

	const result = pool.query().select(Selectors.first);

	if (result) {
		// TypeScript должен знать про поля id и name
		expect(result.id).toBe(1);
		expect(result.name).toBe('test');

		// @ts-expect-error - поле не существует
		// expect(result.invalid).toBe(1)
	}
});
```

---

### Этап 14: Документация и примеры

**Файлы:**

-   `README.md` - главная документация
-   `examples/` - примеры использования
-   JSDoc комментарии в коде

**Задачи:**

1. Написать README.md:
    - Введение и суть проекта
    - Установка
    - Quick start
    - Основные концепции
    - API Reference
    - Примеры использования
2. Создать примеры в `examples/`:
    - `examples/basic.ts` - простое использование
    - `examples/proxy-pool.ts` - пример с прокси
    - `examples/database-integration.ts` - интеграция с БД через wrap
    - `examples/advanced-workflow.ts` - сложный workflow
3. Добавить JSDoc для всех публичных методов:

```typescript
/**
 * Filters pool entries based on predicate
 * @param filter - Function that returns true for entries to keep
 * @returns This query instance for chaining
 * @example
 * pool.query()
 *   .where(e => e.data.country === 'US')
 *   .where(e => e.meta.active === true)
 */
where(filter: Filter<T>): this
```

---

### Этап 15: Оптимизация и производительность

**Файлы:**

-   Все существующие файлы

**Задачи:**

1. **Профилирование:**
    - Тесты с большими пулами (10k, 100k элементов)
    - Замеры времени выполнения операций
2. **Оптимизации:**
    - Убрать лишние копирования массивов
    - Оптимизировать `materialize()` - применять фильтры и сортировки за один проход
    - Использовать `Array.prototype` методы эффективно
    - Переиспользовать объекты где возможно
3. **Memory leaks:**
    - Проверить что события корректно отписываются
    - Проверить что Map/Set очищаются
4. **Benchmarks:**

```typescript
// benchmark/filter-sort.bench.ts
import { Pool, Selectors } from '../src';

const pool = new Pool<{ id: number; value: number }>();

// Подготовка
for (let i = 0; i < 100000; i++) {
	pool.add({ id: i, value: Math.random() * 1000 });
}

// Benchmark
console.time('filter + sort + select');
const result = pool
	.query()
	.where((e) => e.data.value > 500)
	.sortBy('value', 'desc')
	.select(Selectors.first);
console.timeEnd('filter + sort + select');
```

---

### Этап 16: Тестирование граничных случаев

**Файлы:**

-   `tests/edge-cases.test.ts`

**Задачи:**

1. Пустой пул:

```typescript
test('Empty pool: query returns null', () => {
	const pool = new Pool<{ id: number }>();
	const result = pool.query().select(Selectors.first);
	expect(result).toBeNull();
});
```

2. Один элемент:

```typescript
test('Single element: all operations work', () => {
	const pool = new Pool<{ id: number }>();
	pool.add({ id: 1 });

	expect(pool.size).toBe(1);
	expect(pool.query().toArray()).toHaveLength(1);
});
```

3. Дубликаты:

```typescript
test('Duplicates: deduplicate works', () => {
	const pool = new Pool<{ id: number }>();
	pool.add({ id: 1 });
	pool.add({ id: 1 });
	pool.add({ id: 2 });

	pool.deduplicate('id');
	expect(pool.size).toBe(2);
});
```

4. Циклические операции:

```typescript
test('Circular merge: does not break', () => {
	const pool1 = new Pool<{ id: number }>();
	const pool2 = new Pool<{ id: number }>();

	pool1.add({ id: 1 });
	pool2.add({ id: 2 });

	pool1.merge(pool2);
	pool2.merge(pool1);

	expect(pool1.size).toBe(2);
	expect(pool2.size).toBe(2);
});
```

5. Большие объемы:

```typescript
test('Large pool: 100k elements', () => {
	const pool = new Pool<{ id: number }>();

	for (let i = 0; i < 100000; i++) {
		pool.add({ id: i });
	}

	expect(pool.size).toBe(100000);

	const result = pool
		.query()
		.where((e) => e.data.id > 50000)
		.take(10)
		.toArray();

	expect(result).toHaveLength(10);
});
```

---

### Этап 17: Build и публикация

**Файлы:**

-   `package.json`
-   `tsconfig.json`
-   `.npmignore`

**Задачи:**

1. Настроить `tsconfig.json`:

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"module": "commonjs",
		"declaration": true,
		"outDir": "./dist",
		"strict": true,
		"esModuleInterop": true,
		"skipLibCheck": true,
		"forceConsistentCasingInFileNames": true
	},
	"include": ["src/**/*"],
	"exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

2. Настроить `package.json`:

```json
{
	"name": "pool-lib",
	"version": "1.0.0",
	"description": "Lightweight TypeScript library for managing data collections with filters, sorting, and composition",
	"main": "dist/index.js",
	"types": "dist/index.d.ts",
	"scripts": {
		"build": "tsc",
		"test": "jest",
		"test:watch": "jest --watch",
		"prepublishOnly": "npm run build && npm test"
	},
	"keywords": ["pool", "collection", "filter", "sort", "typescript"],
	"author": "",
	"license": "MIT",
	"devDependencies": {
		"@types/jest": "^29.0.0",
		"@types/node": "^20.0.0",
		"jest": "^29.0.0",
		"ts-jest": "^29.0.0",
		"typescript": "^5.0.0"
	}
}
```

3. Создать `.npmignore`:

```
src/
tests/
examples/
benchmark/
tsconfig.json
jest.config.js
*.test.ts
```

4. Сборка и проверка:

```bash
npm run build
npm test
npm pack  # проверить что попадет в пакет
```

5. Публикация:

```bash
npm publish
```

---

## Структура проекта (финальная)

```
pool-lib/
├── src/
│   ├── types.ts              # Базовые типы
│   ├── Pool.ts               # Класс Pool
│   ├── PoolQuery.ts          # Класс PoolQuery
│   ├── PoolBinder.ts         # Класс PoolBinder
│   ├── Selectors.ts          # Встроенные селекторы
│   └── index.ts              # Главный экспорт
├── tests/
│   ├── Pool.test.ts
│   ├── PoolQuery.test.ts
│   ├── PoolBinder.test.ts
│   ├── Selectors.test.ts
│   ├── integration.test.ts
│   └── edge-cases.test.ts
├── examples/
│   ├── basic.ts
│   ├── proxy-pool.ts
│   ├── database-integration.ts
│   └── advanced-workflow.ts
├── benchmark/
│   └── filter-sort.bench.ts
├── dist/                     # Build output (git ignored)
├── package.json
├── tsconfig.json
├── jest.config.js
├── .gitignore
├── .npmignore
├── README.md
└── LICENSE
```

---

## Приоритизация этапов

### MVP (Минимально жизнеспособный продукт):

1. ✅ Этап 1: Базовая структура
2. ✅ Этап 2: Сортировка
3. ✅ Этап 4: Селекторы
4. ✅ Этап 5: События

**После MVP уже можно использовать библиотеку.**

### Полная функциональность:

5. Этап 3: Пагинация
6. Этап 6: Wrap
7. Этап 7: Batch операции
8. Этап 8: Комбинирование пулов
9. Этап 9: Трансформации
10. Этап 10: Статические методы
11. Этап 11: Query.toPool()
12. Этап 12: PoolBinder

### Финализация:

13. Этап 13: Типобезопасность
14. Этап 14: Документация
15. Этап 15: Оптимизация
16. Этап 16: Граничные случаи
17. Этап 17: Build и публикация
