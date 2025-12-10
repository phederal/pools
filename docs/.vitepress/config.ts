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
					{ text: 'Pool', link: '/api/pool' },
					{ text: 'PoolQuery', link: '/api/pool-query' },
					{ text: 'PoolBinder', link: '/api/pool-binder' },
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
	},
});
