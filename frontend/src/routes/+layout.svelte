<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { getSettings, getLogoUrl } from '$lib/api/settings';
	import type { SettingsRecord } from '$lib/types';

	let { children } = $props();
	let dark = $state(false);
	let settings = $state<SettingsRecord | null>(null);
	let logoUrl = $state('');

	onMount(() => {
		dark = document.documentElement.classList.contains('dark');
	});

	onMount(async () => {
		try {
			settings = await getSettings();
			logoUrl = getLogoUrl(settings);
			if (settings.app_name) document.title = settings.app_name;
		} catch (e) {
			console.error('Konnte Einstellungen nicht laden', e);
		}
	});

	function toggleDark() {
		dark = !dark;
		document.documentElement.classList.toggle('dark', dark);
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	}
</script>

<svelte:head>
	{#if logoUrl}
		<link rel="icon" href={logoUrl} />
	{/if}
</svelte:head>

<div
	class="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
	style={settings?.accent_color ? `--accent: ${settings.accent_color}` : undefined}
>
	<header class="border-b border-gray-200 dark:border-gray-800">
		<div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
			<div class="flex items-center gap-3">
				{#if logoUrl}
					<img src={logoUrl} alt="" class="h-8 w-8 rounded object-contain" />
				{/if}
				<div>
					<div class="text-base font-semibold leading-tight">{settings?.app_name || 'TippKick'}</div>
					{#if settings?.league_label}
						<div class="text-xs leading-tight text-gray-500 dark:text-gray-400">
							{settings.league_label}
						</div>
					{/if}
				</div>
			</div>
			<nav class="flex gap-4 text-sm font-medium">
				<a href="/" class="hover:text-[var(--accent)]">Spieltag</a>
				<a href="/tabelle" class="hover:text-[var(--accent)]">Tabelle</a>
				<a href="/statistik" class="hover:text-[var(--accent)]">Statistik</a>
				<a href="/einstellungen" class="hover:text-[var(--accent)]">Einstellungen</a>
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
