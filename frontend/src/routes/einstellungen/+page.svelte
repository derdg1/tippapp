<script lang="ts">
	import { onMount } from 'svelte';
	import { syncSeason, syncMatchday } from '$lib/api/sync';
	import { trainModel } from '$lib/api/predict';
	import { getSettings, updateSettings, getLogoUrl } from '$lib/api/settings';
	import type { SettingsRecord } from '$lib/types';

	let importSeason = $state(new Date().getFullYear());
	let refreshSeason = $state(new Date().getFullYear());
	let refreshMatchday = $state(1);
	let importBusy = $state(false);
	let refreshBusy = $state(false);
	let importResult = $state('');
	let refreshResult = $state('');

	let trainBusy = $state(false);
	let trainResult = $state('');

	let settings = $state<SettingsRecord | null>(null);
	let appName = $state('');
	let leagueLabel = $state('');
	let accentColor = $state('#2563eb');
	let apiKey = $state('');
	let logoFile = $state<File | null>(null);
	let currentLogoUrl = $state('');
	let settingsBusy = $state(false);
	let settingsResult = $state('');

	async function runImport() {
		importBusy = true;
		importResult = '';
		try {
			const res = await syncSeason(importSeason);
			importResult = `${res.imported} Spiele importiert (Saison ${res.season}).`;
		} catch (e) {
			importResult = 'Fehler beim Import: ' + (e instanceof Error ? e.message : String(e));
		} finally {
			importBusy = false;
		}
	}

	async function runRefresh() {
		refreshBusy = true;
		refreshResult = '';
		try {
			const res = await syncMatchday(refreshSeason, refreshMatchday);
			refreshResult = `${res.imported} Spiele aktualisiert (Spieltag ${res.matchday}, Saison ${res.season}).`;
		} catch (e) {
			refreshResult = 'Fehler beim Sync: ' + (e instanceof Error ? e.message : String(e));
		} finally {
			refreshBusy = false;
		}
	}

	async function runTrain() {
		trainBusy = true;
		trainResult = '';
		try {
			const res = await trainModel();
			const m = res.metrics;
			const tendency = m.tendency_accuracy !== null ? `${Math.round(m.tendency_accuracy * 100)}%` : '–';
			const exact = m.exact_score_accuracy !== null ? `${Math.round(m.exact_score_accuracy * 100)}%` : '–';
			trainResult = `Training abgeschlossen: ${res.n_matches} Spiele (${res.n_train} Training / ${res.n_holdout} Test). Tendenz-Trefferquote ${tendency}, exakte Trefferquote ${exact}.`;
		} catch (e) {
			trainResult = 'Fehler beim Training: ' + (e instanceof Error ? e.message : String(e));
		} finally {
			trainBusy = false;
		}
	}

	async function loadSettings() {
		try {
			settings = await getSettings();
			appName = settings.app_name;
			leagueLabel = settings.league_label;
			accentColor = settings.accent_color || '#2563eb';
			apiKey = settings.openligadb_api_key;
			currentLogoUrl = getLogoUrl(settings);
		} catch (e) {
			console.error('Konnte Einstellungen nicht laden', e);
		}
	}

	onMount(loadSettings);

	async function saveSettings() {
		settingsBusy = true;
		settingsResult = '';
		try {
			const data: Record<string, string | File> = {
				app_name: appName,
				league_label: leagueLabel,
				accent_color: accentColor,
				openligadb_api_key: apiKey
			};
			if (logoFile) data.logo = logoFile;
			settings = await updateSettings(data);
			currentLogoUrl = getLogoUrl(settings);
			logoFile = null;
			settingsResult = 'Gespeichert.';
		} catch (e) {
			settingsResult = 'Fehler beim Speichern: ' + (e instanceof Error ? e.message : String(e));
		} finally {
			settingsBusy = false;
		}
	}
</script>

<h1 class="mb-4 text-xl font-semibold">Einstellungen</h1>

<section class="mb-8">
	<h2 class="mb-2 text-lg font-medium">Historische Saison importieren</h2>
	<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
		Importiert eine komplette Saison von OpenLigaDB (z. B. 2023) inkl. aller Ergebnisse. Erneutes
		Ausführen überschreibt vorhandene Daten, ohne Duplikate zu erzeugen.
	</p>
	<div class="flex items-center gap-3">
		<input
			type="number"
			bind:value={importSeason}
			class="w-28 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
		/>
		<button
			onclick={runImport}
			disabled={importBusy}
			class="rounded-md bg-[var(--accent)] px-3 py-1 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
		>
			{importBusy ? 'Importiere...' : 'Saison importieren'}
		</button>
	</div>
	{#if importResult}
		<p class="mt-2 text-sm">{importResult}</p>
	{/if}
</section>

<section>
	<h2 class="mb-2 text-lg font-medium">Einzelnen Spieltag synchronisieren</h2>
	<div class="flex items-center gap-3">
		<input
			type="number"
			bind:value={refreshSeason}
			class="w-28 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
		/>
		<input
			type="number"
			bind:value={refreshMatchday}
			min="1"
			max="34"
			class="w-20 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
		/>
		<button
			onclick={runRefresh}
			disabled={refreshBusy}
			class="rounded-md bg-[var(--accent)] px-3 py-1 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
		>
			{refreshBusy ? 'Synchronisiere...' : 'Spieltag synchronisieren'}
		</button>
	</div>
	{#if refreshResult}
		<p class="mt-2 text-sm">{refreshResult}</p>
	{/if}
</section>

<section class="mb-8">
	<h2 class="mb-2 text-lg font-medium">Modell trainieren</h2>
	<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
		Trainiert das Vorhersage-Modell neu auf allen bisher synchronisierten, abgeschlossenen
		Spielen. Fußballergebnisse sind hochvarianz — realistisch sind eine Tendenz-Trefferquote von
		etwa 45–55&nbsp;% und eine exakte Trefferquote von etwa 8–15&nbsp;%.
	</p>
	<button
		onclick={runTrain}
		disabled={trainBusy}
		class="rounded-md bg-[var(--accent)] px-3 py-1 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
	>
		{trainBusy ? 'Trainiere...' : 'Modell trainieren'}
	</button>
	{#if trainResult}
		<p class="mt-2 text-sm">{trainResult}</p>
	{/if}
</section>

<section>
	<h2 class="mb-2 text-lg font-medium">Whitelabel &amp; API</h2>
	<div class="flex max-w-md flex-col gap-3">
		<label class="flex flex-col gap-1 text-sm">
			App-Name
			<input
				type="text"
				bind:value={appName}
				class="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
			/>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Liga-/Verein-Bezeichnung
			<input
				type="text"
				bind:value={leagueLabel}
				class="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
			/>
		</label>
		<label class="flex items-center gap-2 text-sm">
			Akzentfarbe
			<input type="color" bind:value={accentColor} class="h-8 w-14 rounded border border-gray-300 dark:border-gray-700" />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Logo
			<div class="flex items-center gap-2">
				{#if currentLogoUrl}
					<img src={currentLogoUrl} alt="" class="h-8 w-8 rounded object-contain" />
				{/if}
				<input
					type="file"
					accept="image/*"
					onchange={(e) => (logoFile = (e.currentTarget as HTMLInputElement).files?.[0] ?? null)}
					class="text-sm"
				/>
			</div>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			OpenLigaDB-API-Key (optional)
			<input
				type="text"
				bind:value={apiKey}
				placeholder="nur falls vorhanden"
				class="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
			/>
		</label>
		<button
			onclick={saveSettings}
			disabled={settingsBusy}
			class="w-fit rounded-md bg-[var(--accent)] px-3 py-1 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
		>
			{settingsBusy ? 'Speichere...' : 'Speichern'}
		</button>
		{#if settingsResult}
			<p class="text-sm">{settingsResult}</p>
		{/if}
	</div>
</section>
