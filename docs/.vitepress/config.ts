import { defineConfig } from 'vitepress';

export default defineConfig({
	title: 'Pools',
	description: 'Lightweight TypeScript library for managing data collections',
	base: '/pools/',
	themeConfig: {
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'API', link: '/api/' },
			{ text: 'Examples', link: '/examples/' },
			{ text: 'GitHub', link: 'https://github.com/yourusername/pools' },
		],
		sidebar: [
			{
				text: 'Getting Started',
				items: [
					{ text: 'Introduction', link: '/' },
					{ text: 'Installation', link: '/guide/installation' },
					{ text: 'Quick Start', link: '/guide/quick-start' },
				],
			},
			{
				text: 'API Reference',
				items: [
					{
						text: 'Pool',
						collapsed: false,
						items: [
							{ text: 'CRUD Operations', link: '/api/pool/crud' },
							{ text: 'Map-like Operations', link: '/api/pool/map-like' },
							{ text: 'Query Operations', link: '/api/pool/query' },
							{ text: 'Merge & Combination', link: '/api/pool/merge' },
							{ text: 'Transformation', link: '/api/pool/transform' },
							{ text: 'Iteration Methods', link: '/api/pool/iteration' },
							{ text: 'Events & Hooks', link: '/api/pool/events' },
							{ text: 'Properties', link: '/api/pool/properties' },
						],
					},
					{ text: 'Query', link: '/api/query' },
					{ text: 'Binder', link: '/api/binder' },
					{ text: 'Selectors', link: '/api/selectors' },
				],
			},
			{
				text: 'Examples',
				items: [
					{ text: 'Basic Usage', link: '/examples/basic' },
					{ text: 'Proxy Pool', link: '/examples/proxy-pool' },
					{ text: 'Map-like Usage', link: '/examples/map-like' },
					{ text: 'Game Service', link: '/examples/game-service' },
				],
			},
		],
		socialLinks: [{ icon: 'github', link: 'https://github.com/yourusername/pools' }],
		search: {
			provider: 'local',
		},
	},
});
