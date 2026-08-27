<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';

	let { children } = $props();
	let dark = $state(false);

	onMount(() => {
		dark = document.documentElement.classList.contains('dark');
	});

	function toggleDark() {
		dark = !dark;
		document.documentElement.classList.toggle('dark', dark);
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	}
</script>

<div class="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
	<header class="border-b border-gray-200 dark:border-gray-800">
		<div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
			<nav class="flex gap-4 text-sm font-medium">
				<a href="/" class="hover:text-blue-600 dark:hover:text-blue-400">Spieltag</a>
				<a href="/tabelle" class="hover:text-blue-600 dark:hover:text-blue-400">Tabelle</a>
				<a href="/statistik" class="hover:text-blue-600 dark:hover:text-blue-400">Statistik</a>
				<a href="/einstellungen" class="hover:text-blue-600 dark:hover:text-blue-400"
					>Einstellungen</a
				>
			</nav>
			<button
				onclick={toggleDark}
				class="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700"
				aria-label="Darkmode umschalten"
			>
				{dark ? '☀️ Hell' : '🌙 Dunkel'}
			</button>
		</div>
	</header>
	<main class="mx-auto max-w-4xl px-4 py-6">
		{@render children()}
	</main>
</div>
