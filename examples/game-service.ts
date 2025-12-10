import { Pool, Selectors, PoolBinder } from '../src';
import type { PoolEntry } from '../src/types';

// ========== ТИПЫ ==========

interface Game {
	id: string;
	title: string;
	genre: string;
	minPlayers: number;
	maxPlayers: number;
	requiresAuth: boolean;
}

interface Account {
	id: string;
	username: string;
	email: string;
	level: number;
	premium: boolean;
	reputation: number;
}

interface AuthSession {
	sessionId: string;
	accountId: string;
	token: string;
	ip: string;
	createdAt: Date;
}

interface GameServer {
	id: string;
	gameId: string;
	region: string;
	host: string;
	port: number;
	maxCapacity: number;
	ping: number;
}

interface PlayerSession {
	id: string;
	accountId: string;
	serverId: string;
	gameId: string;
	joinedAt: Date;
}

console.log('🎮 === GAME SERVICE POOLS EXAMPLE === 🎮\n');

// ========== СОЗДАНИЕ ПУЛОВ ==========

const games = new Pool<Game>();
const accounts = new Pool<Account>();
const authSessions = new Pool<AuthSession>();
const gameServers = new Pool<GameServer>();
const playerSessions = new Pool<PlayerSession>();

// ========== ИНИЦИАЛИЗАЦИЯ ДАННЫХ ==========

console.log('📦 Initializing data...\n');

// Игры
games.addBatch([
	{
		data: { id: 'game1', title: 'Battle Royale', genre: 'shooter', minPlayers: 50, maxPlayers: 100, requiresAuth: true },
		meta: { popularity: 95, releaseYear: 2023 },
	},
	{
		data: { id: 'game2', title: 'Chess Online', genre: 'strategy', minPlayers: 2, maxPlayers: 2, requiresAuth: true },
		meta: { popularity: 70, releaseYear: 2020 },
	},
	{
		data: { id: 'game3', title: 'Racing Mania', genre: 'racing', minPlayers: 2, maxPlayers: 16, requiresAuth: false },
		meta: { popularity: 85, releaseYear: 2022 },
	},
	{
		data: { id: 'game4', title: 'Fantasy Quest', genre: 'rpg', minPlayers: 1, maxPlayers: 4, requiresAuth: true },
		meta: { popularity: 90, releaseYear: 2024 },
	},
	{
		data: { id: 'game5', title: 'Party Games', genre: 'casual', minPlayers: 4, maxPlayers: 8, requiresAuth: false },
		meta: { popularity: 60, releaseYear: 2021 },
	},
]);

// Аккаунты
accounts.addBatch([
	{
		data: { id: 'acc1', username: 'ProGamer123', email: 'pro@game.com', level: 50, premium: true, reputation: 95 },
		meta: { registered: new Date('2023-01-15'), banned: false, warnings: 0 },
	},
	{
		data: { id: 'acc2', username: 'CasualPlayer', email: 'casual@game.com', level: 15, premium: false, reputation: 70 },
		meta: { registered: new Date('2024-06-20'), banned: false, warnings: 1 },
	},
	{
		data: { id: 'acc3', username: 'EliteWarrior', email: 'elite@game.com', level: 99, premium: true, reputation: 100 },
		meta: { registered: new Date('2022-03-10'), banned: false, warnings: 0 },
	},
	{
		data: { id: 'acc4', username: 'Newbie2024', email: 'newbie@game.com', level: 5, premium: false, reputation: 50 },
		meta: { registered: new Date('2024-11-01'), banned: false, warnings: 0 },
	},
	{
		data: { id: 'acc5', username: 'ToxicPlayer', email: 'toxic@game.com', level: 30, premium: false, reputation: 20 },
		meta: { registered: new Date('2023-08-15'), banned: false, warnings: 5 },
	},
	{
		data: { id: 'acc6', username: 'SpeedRunner', email: 'speed@game.com', level: 75, premium: true, reputation: 88 },
		meta: { registered: new Date('2023-02-20'), banned: false, warnings: 0 },
	},
]);

// Auth сессии
const now = new Date();
authSessions.addBatch([
	{
		data: { sessionId: 'sess1', accountId: 'acc1', token: 'token_xxx_1', ip: '192.168.1.1', createdAt: new Date(now.getTime() - 30 * 60000) },
		meta: { lastActivity: new Date(), expiresIn: 7200000 },
	},
	{
		data: { sessionId: 'sess2', accountId: 'acc2', token: 'token_xxx_2', ip: '192.168.1.2', createdAt: new Date(now.getTime() - 15 * 60000) },
		meta: { lastActivity: new Date(), expiresIn: 7200000 },
	},
	{
		data: { sessionId: 'sess3', accountId: 'acc3', token: 'token_xxx_3', ip: '192.168.1.3', createdAt: new Date(now.getTime() - 5 * 60000) },
		meta: { lastActivity: new Date(), expiresIn: 7200000 },
	},
	{
		data: { sessionId: 'sess4', accountId: 'acc6', token: 'token_xxx_4', ip: '192.168.1.6', createdAt: new Date(now.getTime() - 120 * 60000) },
		meta: { lastActivity: new Date(now.getTime() - 90 * 60000), expiresIn: 7200000 },
	},
]);

// Игровые серверы
gameServers.addBatch([
	{
		data: { id: 'srv1', gameId: 'game1', region: 'EU-West', host: 'eu1.game.com', port: 7777, maxCapacity: 100, ping: 25 },
		meta: { status: 'online', load: 0, uptime: 99.9 },
	},
	{
		data: { id: 'srv2', gameId: 'game1', region: 'EU-East', host: 'eu2.game.com', port: 7777, maxCapacity: 100, ping: 35 },
		meta: { status: 'online', load: 0, uptime: 98.5 },
	},
	{
		data: { id: 'srv3', gameId: 'game1', region: 'US-West', host: 'us1.game.com', port: 7777, maxCapacity: 100, ping: 120 },
		meta: { status: 'online', load: 0, uptime: 99.5 },
	},
	{
		data: { id: 'srv4', gameId: 'game2', region: 'EU-West', host: 'eu1.game.com', port: 8888, maxCapacity: 1000, ping: 20 },
		meta: { status: 'online', load: 0, uptime: 100 },
	},
	{
		data: { id: 'srv5', gameId: 'game3', region: 'EU-West', host: 'eu1.game.com', port: 9999, maxCapacity: 16, ping: 15 },
		meta: { status: 'online', load: 0, uptime: 99.8 },
	},
	{
		data: { id: 'srv6', gameId: 'game4', region: 'EU-West', host: 'eu1.game.com', port: 6666, maxCapacity: 50, ping: 18 },
		meta: { status: 'online', load: 0, uptime: 99.9 },
	},
	{
		data: { id: 'srv7', gameId: 'game1', region: 'US-East', host: 'us2.game.com', port: 7777, maxCapacity: 100, ping: 110 },
		meta: { status: 'maintenance', load: 0, uptime: 95.0 },
	},
]);

console.log(`✅ Games: ${games.size}`);
console.log(`✅ Accounts: ${accounts.size}`);
console.log(`✅ Auth Sessions: ${authSessions.size}`);
console.log(`✅ Game Servers: ${gameServers.size}`);

// ========== СОБЫТИЯ ==========

console.log('\n🔔 Setting up event handlers...\n');

// Автообновление активности сессий
authSessions.on('get', (entry: PoolEntry<AuthSession>) => {
	entry.meta.lastActivity = new Date();
	console.log(`  [Auth] Session ${entry.data.sessionId} activity updated`);
});

// Трекинг загрузки серверов при создании игровой сессии
playerSessions.on('add', (entry: PoolEntry<PlayerSession>) => {
	const server = gameServers.allEntries.find((s) => s.data.id === entry.data.serverId);
	if (server) {
		server.meta.load++;
		console.log(`  [Server] ${server.data.id} load: ${server.meta.load}/${server.data.maxCapacity}`);
	}
});

// Освобождение места при удалении сессии
playerSessions.on('remove', (entry: PoolEntry<PlayerSession>) => {
	const server = gameServers.allEntries.find((s) => s.data.id === entry.data.serverId);
	if (server) {
		server.meta.load--;
		console.log(`  [Server] ${server.data.id} player left, load: ${server.meta.load}/${server.data.maxCapacity}`);
	}
});

// ========== СЦЕНАРИЙ 1: ПОИСК ПОПУЛЯРНЫХ ИГР ==========

console.log('\n🎯 === SCENARIO 1: Finding Popular Games ===\n');

const popularGames = games
	.query()
	.where((e) => e.meta.popularity >= 85)
	.sortByMeta('popularity', 'desc')
	.toArray();

console.log('Popular games (85+ popularity):');
popularGames.forEach((game) => {
	const entry = games.allEntries.find((e) => e.data.id === game.id);
	console.log(`  - ${game.title} (${game.genre}) - ${entry?.meta.popularity}% popularity`);
});

// ========== СЦЕНАРИЙ 2: ГРУППИРОВКА ИГР ПО ЖАНРАМ ==========

console.log('\n📊 === SCENARIO 2: Grouping Games by Genre ===\n');

const gamesByGenre = games.groupBy('genre');
console.log('Games by genre:');
gamesByGenre.forEach((pool, genre) => {
	console.log(`  ${genre}: ${pool.size} games`);
	pool.all.forEach((game) => console.log(`    - ${game.title}`));
});

// ========== СЦЕНАРИЙ 3: ФИЛЬТРАЦИЯ АККАУНТОВ ==========

console.log('\n👥 === SCENARIO 3: Account Filtering ===\n');

// Premium игроки с высокой репутацией
const elitePlayers = accounts
	.query()
	.where((e) => e.data.premium === true)
	.where((e) => e.data.reputation >= 85)
	.sortBy('level', 'desc')
	.toArray();

console.log('Elite premium players (rep >= 85):');
elitePlayers.forEach((acc) => {
	console.log(`  - ${acc.username} (lvl ${acc.level}, rep ${acc.reputation})`);
});

// Проблемные аккаунты
const problematicAccounts = accounts
	.query()
	.where((e) => e.meta.warnings >= 3 || e.data.reputation < 30)
	.sortBy('reputation', 'asc')
	.toArray();

console.log('\nProblematic accounts:');
problematicAccounts.forEach((acc) => {
	const entry = accounts.allEntries.find((e) => e.data.id === acc.id);
	console.log(`  - ${acc.username} (rep ${acc.reputation}, warnings: ${entry?.meta.warnings})`);
});

// ========== СЦЕНАРИЙ 4: РАЗДЕЛЕНИЕ АККАУНТОВ ==========

console.log('\n✂️  === SCENARIO 4: Partitioning Accounts ===\n');

const [premiumAccounts, freeAccounts] = accounts.partition((e) => e.data.premium === true);

console.log(`Premium accounts: ${premiumAccounts.size}`);
console.log(`Free accounts: ${freeAccounts.size}`);

// ========== СЦЕНАРИЙ 5: ПОИСК ЛУЧШИХ СЕРВЕРОВ ==========

console.log('\n🖥️  === SCENARIO 5: Finding Best Servers ===\n');

// Группировка серверов по играм
const serversByGame = gameServers.groupBy('gameId');

console.log('Servers per game:');
serversByGame.forEach((serverPool, gameId) => {
	const game = games.all.find((g) => g.id === gameId);
	if (game) {
		console.log(`\n  ${game.title}:`);

		// Лучший сервер для игры (низкий пинг, онлайн, мало загружен)
		const bestServer = serverPool
			.query()
			.where((e) => e.meta.status === 'online')
			.where((e) => e.meta.load < e.data.maxCapacity * 0.8)
			.sortBy('ping', 'asc')
			.select(Selectors.first);

		if (bestServer) {
			const serverEntry = serverPool.allEntries.find((e) => e.data.id === bestServer.id);
			console.log(`    Best server: ${bestServer.region} (ping: ${bestServer.ping}ms, load: ${serverEntry?.meta.load || 0}/${bestServer.maxCapacity})`);
		}

		// Группировка по регионам
		const serversByRegion = serverPool.groupBy('region');
		console.log(`    Regions: ${Array.from(serversByRegion.keys()).join(', ')}`);
	}
});

// ========== СЦЕНАРИЙ 6: СОЗДАНИЕ ИГРОВЫХ СЕССИЙ ==========

console.log('\n🎮 === SCENARIO 6: Creating Player Sessions ===\n');

// Функция для создания игровой сессии
function joinGame(accountId: string, gameId: string, preferredRegion: string = 'EU-West'): boolean {
	console.log(`\nPlayer joining: account=${accountId}, game=${gameId}, region=${preferredRegion}`);

	// Проверка аутентификации
	const authSession = authSessions.query().where((e) => e.data.accountId === accountId).select(Selectors.first);

	if (!authSession) {
		console.log('  ❌ Not authenticated');
		return false;
	}

	// Проверка аккаунта
	const account = accounts.query().where((e) => e.data.id === accountId).select(Selectors.first);

	if (!account) {
		console.log('  ❌ Account not found');
		return false;
	}

	const accountEntry = accounts.allEntries.find((e) => e.data.id === accountId);
	if (accountEntry?.meta.banned) {
		console.log('  ❌ Account is banned');
		return false;
	}

	// Проверка игры
	const game = games.query().where((e) => e.data.id === gameId).select(Selectors.first);

	if (!game) {
		console.log('  ❌ Game not found');
		return false;
	}

	// Поиск лучшего сервера
	const bestServer = gameServers
		.query()
		.where((e) => e.data.gameId === gameId)
		.where((e) => e.meta.status === 'online')
		.where((e) => e.meta.load < e.data.maxCapacity)
		.whereOr([
			(e) => e.data.region === preferredRegion,
			(e) => e.data.region.startsWith('EU'), // Fallback к любому EU
		])
		.sortBy('ping', 'asc')
		.select(Selectors.first);

	if (!bestServer) {
		console.log('  ❌ No available servers');
		return false;
	}

	// Создание игровой сессии
	const sessionId = `psess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	playerSessions.add(
		{
			id: sessionId,
			accountId: accountId,
			serverId: bestServer.id,
			gameId: gameId,
			joinedAt: new Date(),
		},
		{
			ping: bestServer.ping,
			region: bestServer.region,
		}
	);

	console.log(`  ✅ Joined server ${bestServer.id} (${bestServer.region}, ${bestServer.ping}ms)`);
	return true;
}

// Игроки заходят в игры
joinGame('acc1', 'game1', 'EU-West');
joinGame('acc2', 'game1', 'EU-West');
joinGame('acc3', 'game1', 'EU-East');
joinGame('acc6', 'game2', 'EU-West');
joinGame('acc4', 'game3', 'EU-West');

console.log(`\nTotal active player sessions: ${playerSessions.size}`);

// ========== СЦЕНАРИЙ 7: ИСПОЛЬЗОВАНИЕ POOLBINDER ==========

console.log('\n🔗 === SCENARIO 7: Complex Matchmaking with PoolBinder ===\n');

// Найти оптимальную комбинацию: игра + аккаунт + сервер
const matchmaking = new PoolBinder()
	.bind('game', games)
	.bind('account', accounts)
	.bind('server', gameServers)
	.where('game', (e: PoolEntry<Game>) => e.meta.popularity >= 85)
	.where('account', (e: PoolEntry<Account>) => !e.meta.banned)
	.where('account', (e: PoolEntry<Account>) => e.data.level >= 20)
	.where('server', (e: PoolEntry<GameServer>) => e.meta.status === 'online')
	.where('server', (e: PoolEntry<GameServer>) => e.meta.load < e.data.maxCapacity * 0.5)
	.selectWith('game', Selectors.minBy('popularity')) // Самая популярная игра
	.selectWith('account', Selectors.minBy('reputation')) // Аккаунт с самой высокой репутацией
	.selectWith(
		'server',
		Selectors.weighted((entry: PoolEntry<GameServer>) => {
			// Вес = (100 - ping) * (1 - load%)
			const loadPercent = entry.meta.load / entry.data.maxCapacity;
			return (100 - entry.data.ping) * (1 - loadPercent);
		})
	)
	.execute();

if (matchmaking) {
	console.log('Perfect match found:');
	console.log(`  Game: ${matchmaking.game.title} (${matchmaking.game.genre})`);
	console.log(`  Account: ${matchmaking.account.username} (lvl ${matchmaking.account.level})`);
	console.log(`  Server: ${matchmaking.server.region} - ${matchmaking.server.host}:${matchmaking.server.port} (${matchmaking.server.ping}ms)`);
} else {
	console.log('No perfect match found');
}

// ========== СЦЕНАРИЙ 8: СТАТИСТИКА АКТИВНЫХ СЕССИЙ ==========

console.log('\n📈 === SCENARIO 8: Active Sessions Statistics ===\n');

// Группировка игровых сессий по играм
const sessionsByGame = playerSessions.groupBy('gameId');

console.log('Active players by game:');
sessionsByGame.forEach((sessionsPool, gameId) => {
	const game = games.all.find((g) => g.id === gameId);
	if (game) {
		console.log(`  ${game.title}: ${sessionsPool.size} players`);

		// Средний пинг игроков
		const totalPing = sessionsPool.allEntries.reduce((sum, e) => sum + (e.meta.ping || 0), 0);
		const avgPing = totalPing / sessionsPool.size;
		console.log(`    Average ping: ${avgPing.toFixed(0)}ms`);
	}
});

// ========== СЦЕНАРИЙ 9: EXPIRED SESSIONS CLEANUP ==========

console.log('\n🧹 === SCENARIO 9: Cleaning Expired Sessions ===\n');

const expiredThreshold = 60 * 60000; // 60 минут

const removedSessions = authSessions.remove((session) => {
	const entry = authSessions.allEntries.find((e) => e.data.sessionId === session.sessionId);
	if (entry) {
		const timeSinceActivity = Date.now() - entry.meta.lastActivity.getTime();
		return timeSinceActivity > expiredThreshold;
	}
	return false;
});

console.log(`Removed ${removedSessions.length} expired auth sessions`);
console.log(`Active auth sessions: ${authSessions.size}`);

// ========== СЦЕНАРИЙ 10: POOL OF POOLS ==========

console.log('\n🏊 === SCENARIO 10: Pool of Pools - Regional Organization ===\n');

// Создаем пулы серверов по регионам
const euWestServers = gameServers.query().where((e) => e.data.region === 'EU-West').toPool();

const euEastServers = gameServers.query().where((e) => e.data.region === 'EU-East').toPool();

const usServers = gameServers.query().where((e) => e.data.region.startsWith('US')).toPool();

// Создаем пул пулов
const regionalServerPools = new Pool<Pool<GameServer>>();
regionalServerPools.add(euWestServers, { region: 'EU-West', datacenter: 'Frankfurt' });
regionalServerPools.add(euEastServers, { region: 'EU-East', datacenter: 'Warsaw' });
regionalServerPools.add(usServers, { region: 'US', datacenter: 'Virginia' });

console.log('Regional server pools:');
regionalServerPools.allEntries.forEach((entry) => {
	console.log(`  ${entry.meta.region} (${entry.meta.datacenter}): ${entry.data.size} servers`);

	// Статистика по каждому региону
	const onlineServers = entry.data.query().where((e) => e.meta.status === 'online').count;
	const totalCapacity = entry.data.allEntries.reduce((sum, s) => sum + s.data.maxCapacity, 0);
	const totalLoad = entry.data.allEntries.reduce((sum, s) => sum + (s.meta.load || 0), 0);
	const utilizationPercent = totalCapacity > 0 ? ((totalLoad / totalCapacity) * 100).toFixed(1) : '0.0';

	console.log(`    Online: ${onlineServers}/${entry.data.size}`);
	console.log(`    Capacity: ${totalLoad}/${totalCapacity} (${utilizationPercent}% utilization)`);
});

// Найти регион с наименьшей загрузкой
const leastLoadedRegion = regionalServerPools
	.query()
	.sortBy((a, b) => {
		const loadA = a.data.allEntries.reduce((sum, s) => sum + (s.meta.load || 0), 0);
		const capacityA = a.data.allEntries.reduce((sum, s) => sum + s.data.maxCapacity, 0);
		const utilizationA = capacityA > 0 ? loadA / capacityA : 1;

		const loadB = b.data.allEntries.reduce((sum, s) => sum + (s.meta.load || 0), 0);
		const capacityB = b.data.allEntries.reduce((sum, s) => sum + s.data.maxCapacity, 0);
		const utilizationB = capacityB > 0 ? loadB / capacityB : 1;

		return utilizationA - utilizationB;
	})
	.select(Selectors.first);

if (leastLoadedRegion) {
	const entry = regionalServerPools.allEntries.find((e) => e.data === leastLoadedRegion);
	console.log(`\nLeast loaded region: ${entry?.meta.region}`);
}

// ========== СЦЕНАРИЙ 11: ADVANCED TRANSFORMATIONS ==========

console.log('\n🔄 === SCENARIO 11: Advanced Transformations ===\n');

// Clone и модификация
const accountsBackup = accounts.clone();
console.log(`Accounts backup created: ${accountsBackup.size} accounts`);

// Sample для тестирования
const testAccounts = accounts.sample(3);
console.log(`\nRandom sample of ${testAccounts.size} accounts for testing:`);
testAccounts.all.forEach((acc) => console.log(`  - ${acc.username}`));

// Shuffle для случайного выбора
const shuffledGames = games.clone();
shuffledGames.shuffle();
console.log(`\nShuffled games order:`);
shuffledGames.all.slice(0, 3).forEach((game, i) => console.log(`  ${i + 1}. ${game.title}`));

// ========== СЦЕНАРИЙ 12: MERGE OPERATIONS ==========

console.log('\n🔀 === SCENARIO 12: Merge Operations ===\n');

// Создание дополнительных пулов аккаунтов
const newAccounts1 = new Pool<Account>();
newAccounts1.add({ id: 'acc7', username: 'Newcomer1', email: 'new1@game.com', level: 1, premium: false, reputation: 50 });

const newAccounts2 = new Pool<Account>();
newAccounts2.add({ id: 'acc7', username: 'Newcomer1', email: 'new1@game.com', level: 1, premium: false, reputation: 50 }); // Дубликат
newAccounts2.add({ id: 'acc8', username: 'Newcomer2', email: 'new2@game.com', level: 1, premium: false, reputation: 50 });

// Merge unique
const mergedAccounts = Pool.mergeUnique([newAccounts1, newAccounts2], 'id');
console.log(`Merged unique accounts: ${mergedAccounts.size} (duplicates removed)`);

// Union
const unionTest = new Pool<Account>();
unionTest.add({ id: 'acc9', username: 'UnionTest', email: 'union@game.com', level: 10, premium: false, reputation: 60 });
const originalSize = accounts.size;
accounts.union(unionTest, (a, b) => a.id === b.id);
console.log(`Union operation: ${accounts.size - originalSize} new accounts added`);

// Intersect
const premiumPool1 = accounts.query().where((e) => e.data.premium === true).toPool();

const highLevelPool = accounts.query().where((e) => e.data.level >= 50).toPool();

const elitePool = Pool.intersect(premiumPool1, highLevelPool, (a, b) => a.id === b.id);
console.log(`Elite players (premium AND high level): ${elitePool.size}`);

// ========== СЦЕНАРИЙ 13: QUERY CHAINING & PAGINATION ==========

console.log('\n📄 === SCENARIO 13: Query Chaining & Pagination ===\n');

console.log('Leaderboard (top 10 players):');
accounts
	.query()
	.where((e) => !e.meta.banned)
	.sortBy('level', 'desc')
	.sortBy('reputation', 'desc') // Вторичная сортировка
	.take(10)
	.toArray()
	.forEach((acc, index) => {
		console.log(`  ${index + 1}. ${acc.username} - Level ${acc.level} (Rep: ${acc.reputation})`);
	});

console.log('\nNext 5 players (pagination):');
accounts
	.query()
	.where((e) => !e.meta.banned)
	.sortBy('level', 'desc')
	.offset(10)
	.take(5)
	.toArray()
	.forEach((acc, index) => {
		console.log(`  ${index + 11}. ${acc.username} - Level ${acc.level}`);
	});

// ========== СЦЕНАРИЙ 14: METHOD WRAPPING ==========

console.log('\n🎁 === SCENARIO 14: Method Wrapping for Logging ===\n');

const monitoredAccounts = new Pool<Account>();

// Wrap add для логирования
monitoredAccounts.wrap('add', (original, data, meta) => {
	console.log(`  [Monitor] Adding account: ${data.username}`);
	const result = original(data, meta);
	console.log(`  [Monitor] Account added successfully`);
	return result;
});

// Wrap remove для логирования
monitoredAccounts.wrap('remove', (original, predicate) => {
	console.log(`  [Monitor] Removing accounts...`);
	const result = original(predicate);
	console.log(`  [Monitor] Removed ${result.length} accounts`);
	return result;
});

monitoredAccounts.add({ id: 'test1', username: 'TestUser1', email: 'test1@game.com', level: 1, premium: false, reputation: 50 });
monitoredAccounts.add({ id: 'test2', username: 'TestUser2', email: 'test2@game.com', level: 1, premium: false, reputation: 50 });
monitoredAccounts.remove((data) => data.id === 'test1');

// ========== СЦЕНАРИЙ 15: WEIGHTED SELECTOR FOR MATCHMAKING ==========

console.log('\n⚖️  === SCENARIO 15: Weighted Server Selection ===\n');

// Взвешенный выбор сервера на основе нескольких факторов
const selectedServer = gameServers
	.query()
	.where((e) => e.data.gameId === 'game1')
	.where((e) => e.meta.status === 'online')
	.select(
		Selectors.weighted((entry: PoolEntry<GameServer>) => {
			const loadFactor = 1 - entry.meta.load / entry.data.maxCapacity; // Предпочитаем менее загруженные
			const pingFactor = 1 / (entry.data.ping + 1); // Предпочитаем низкий пинг
			const uptimeFactor = entry.meta.uptime / 100; // Предпочитаем высокий аптайм

			const weight = loadFactor * 40 + pingFactor * 100 + uptimeFactor * 20;
			console.log(
				`  ${entry.data.id} (${entry.data.region}): load=${loadFactor.toFixed(2)}, ping=${pingFactor.toFixed(3)}, uptime=${uptimeFactor.toFixed(2)} => weight=${weight.toFixed(2)}`
			);

			return weight;
		})
	);

if (selectedServer) {
	console.log(`\nSelected server: ${selectedServer.id} (${selectedServer.region})`);
}

// ========== ФИНАЛЬНАЯ СТАТИСТИКА ==========

console.log('\n📊 === FINAL STATISTICS ===\n');

console.log(`Total Games: ${games.size}`);
console.log(`Total Accounts: ${accounts.size}`);
console.log(`Active Auth Sessions: ${authSessions.size}`);
console.log(`Game Servers: ${gameServers.size}`);
console.log(`Active Player Sessions: ${playerSessions.size}`);

// Группировка по играм
console.log('\nPlayers online per game:');
const playersPerGame = playerSessions.groupBy('gameId');
playersPerGame.forEach((pool, gameId) => {
	const game = games.all.find((g) => g.id === gameId);
	console.log(`  ${game?.title || gameId}: ${pool.size} players`);
});

// Средняя репутация игроков
const avgReputation = accounts.all.reduce((sum, acc) => sum + acc.reputation, 0) / accounts.size;
console.log(`\nAverage player reputation: ${avgReputation.toFixed(1)}`);

// Процент премиум игроков
const premiumPercent = (premiumAccounts.size / accounts.size) * 100;
console.log(`Premium players: ${premiumPercent.toFixed(1)}%`);

console.log('\n🎮 === GAME SERVICE EXAMPLE COMPLETE === 🎮');
