<script lang="ts">
	import { onMount } from 'svelte';
	import { getCurrentMatchday, listMatches } from '$lib/api/matches';
	import { listTipps, upsertTipp } from '$lib/api/tipps';
	import type { MatchRecord, TippRecord } from '$lib/types';

	let season = $state(new Date().getFullYear());
	let matchday = $state(1);
	let matches = $state<MatchRecord[]>([]);
	let tippsByMatch = $state<Record<string, TippRecord>>({});
	let predictions = $state<Record<string, { home: number; away: number }>>({});
	let loading = $state(true);
	let saving = $state<Record<string, boolean>>({});

	async function loadDefault() {
		try {
			const current = await getCurrentMatchday();
			season = current.season;
			matchday = current.groupOrderID;
		} catch (e) {
			console.error('Konnte aktuellen Spieltag nicht laden', e);
		}
	}

	async function loadMatchday() {
		loading = true;
		matches = await listMatches(season, matchday);
		const tipps = await listTipps(matches.map((m) => m.id));
		tippsByMatch = Object.fromEntries(tipps.map((t) => [t.match, t]));
		predictions = Object.fromEntries(
			matches.map((m) => {
				const t = tippsByMatch[m.id];
				return [m.id, { home: t?.predicted_home ?? 0, away: t?.predicted_away ?? 0 }];
			})
		);
		loading = false;
	}

	async function save(matchId: string) {
		saving = { ...saving, [matchId]: true };
		const pred = predictions[matchId];
		const tipp = await upsertTipp(matchId, pred.home, pred.away);
		tippsByMatch = { ...tippsByMatch, [matchId]: tipp };
		saving = { ...saving, [matchId]: false };
	}

	onMount(async () => {
		await loadDefault();
		await loadMatchday();
	});

	function pointsLabel(match: MatchRecord): string {
		const t = tippsByMatch[match.id];
		if (!match.finished || !t || t.points === null || t.points === undefined) return '';
		return `${t.points} Punkte`;
	}
</script>

<h1 class="mb-4 text-xl font-semibold">Spieltag</h1>

<div class="mb-6 flex items-center gap-3">
	<label class="flex items-center gap-2 text-sm">
		Saison
		<input
			type="number"
			bind:value={season}
			onchange={loadMatchday}
			class="w-24 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
		/>
	</label>
	<label class="flex items-center gap-2 text-sm">
		Spieltag
		<input
			type="number"
			bind:value={matchday}
			onchange={loadMatchday}
			min="1"
			max="34"
			class="w-20 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
		/>
	</label>
</div>

{#if loading}
	<p>Lade...</p>
{:else if matches.length === 0}
	<p>Keine Spiele für diesen Spieltag gefunden. Ggf. erst unter „Einstellungen“ synchronisieren.</p>
{:else}
	<ul class="flex flex-col gap-3">
		{#each matches as match (match.id)}
			<li class="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
				<div class="flex items-center justify-between gap-4">
					<div class="flex-1 text-sm font-medium">{match.home_team} vs {match.away_team}</div>
					<div class="flex items-center gap-2">
						<input
							type="number"
							min="0"
							bind:value={predictions[match.id].home}
							class="w-14 rounded border border-gray-300 px-2 py-1 text-center dark:border-gray-700 dark:bg-gray-800"
						/>
						<span>:</span>
						<input
							type="number"
							min="0"
							bind:value={predictions[match.id].away}
							class="w-14 rounded border border-gray-300 px-2 py-1 text-center dark:border-gray-700 dark:bg-gray-800"
						/>
						<button
							onclick={() => save(match.id)}
							disabled={saving[match.id]}
							class="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
						>
							Speichern
						</button>
					</div>
				</div>
				{#if match.finished}
					<div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Ergebnis: {match.home_score} : {match.away_score}
						{#if pointsLabel(match)}
							&middot; {pointsLabel(match)}
						{/if}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
