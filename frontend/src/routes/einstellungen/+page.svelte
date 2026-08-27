<script lang="ts">
	import { syncSeason, syncMatchday } from '$lib/api/sync';

	let importSeason = $state(new Date().getFullYear());
	let refreshSeason = $state(new Date().getFullYear());
	let refreshMatchday = $state(1);
	let importBusy = $state(false);
	let refreshBusy = $state(false);
	let importResult = $state('');
	let refreshResult = $state('');

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
			class="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
			class="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
		>
			{refreshBusy ? 'Synchronisiere...' : 'Spieltag synchronisieren'}
		</button>
	</div>
	{#if refreshResult}
		<p class="mt-2 text-sm">{refreshResult}</p>
	{/if}
</section>
