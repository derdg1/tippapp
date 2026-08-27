<script lang="ts">
	import { onMount } from 'svelte';
	import { listSeasonTipps } from '$lib/api/tipps';
	import { getSettings } from '$lib/api/settings';
	import type { TippRecord } from '$lib/types';
	import jsPDF from 'jspdf';
	import autoTable from 'jspdf-autotable';

	let season = $state(new Date().getFullYear());
	let tipps = $state<TippRecord[]>([]);
	let loading = $state(true);
	let scopeMatchday = $state<number | ''>('');
	let appName = $state('TippKick');

	async function load() {
		loading = true;
		tipps = await listSeasonTipps(season);
		loading = false;
	}

	onMount(load);
	onMount(async () => {
		try {
			const settings = await getSettings();
			if (settings.app_name) appName = settings.app_name;
		} catch (e) {
			// Fallback "TippKick" bleibt bestehen
		}
	});

	const totalPoints = $derived(tipps.reduce((sum, t) => sum + (t.points ?? 0), 0));

	const pointsByMatchday = $derived.by(() => {
		const map = new Map<number, number>();
		for (const t of tipps) {
			const md = t.expand?.match.matchday;
			if (md === undefined) continue;
			map.set(md, (map.get(md) ?? 0) + (t.points ?? 0));
		}
		return [...map.entries()].sort((a, b) => a[0] - b[0]);
	});

	function rowsForExport(): TippRecord[] {
		if (scopeMatchday === '') return tipps;
		return tipps.filter((t) => t.expand?.match.matchday === scopeMatchday);
	}

	function exportPdf() {
		const rows = rowsForExport();
		const doc = new jsPDF();
		const title =
			scopeMatchday === ''
				? `${appName} – Saison ${season}`
				: `${appName} – Spieltag ${scopeMatchday} (Saison ${season})`;
		doc.text(title, 14, 16);

		autoTable(doc, {
			startY: 22,
			head: [['Spieltag', 'Heim', 'Auswärts', 'Tipp', 'Ergebnis', 'Punkte']],
			body: rows.map((t) => {
				const m = t.expand?.match;
				const ergebnis = m?.finished ? `${m.home_score}:${m.away_score}` : '-';
				return [
					m?.matchday ?? '',
					m?.home_team ?? '',
					m?.away_team ?? '',
					`${t.predicted_home}:${t.predicted_away}`,
					ergebnis,
					t.points ?? '-'
				];
			})
		});

		const slug = appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'tippkick';
		const filename =
			scopeMatchday === ''
				? `${slug}-saison-${season}.pdf`
				: `${slug}-spieltag-${scopeMatchday}.pdf`;
		doc.save(filename);
	}
</script>

<h1 class="mb-4 text-xl font-semibold">Statistik</h1>

<label class="mb-4 flex items-center gap-2 text-sm">
	Saison
	<input
		type="number"
		bind:value={season}
		onchange={load}
		class="w-24 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
	/>
</label>

{#if loading}
	<p>Lade...</p>
{:else}
	<p class="mb-4 text-lg">Gesamtpunkte: <span class="font-semibold">{totalPoints}</span></p>

	<table class="mb-6 w-full border-collapse text-sm">
		<thead>
			<tr class="border-b border-gray-300 text-left dark:border-gray-700">
				<th class="py-2 pr-2">Spieltag</th>
				<th class="py-2 text-right">Punkte</th>
			</tr>
		</thead>
		<tbody>
			{#each pointsByMatchday as [md, pts] (md)}
				<tr class="border-b border-gray-100 dark:border-gray-800">
					<td class="py-2 pr-2">{md}</td>
					<td class="py-2 text-right">{pts}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<div class="flex items-center gap-3">
		<label class="flex items-center gap-2 text-sm">
			Umfang
			<select
				bind:value={scopeMatchday}
				class="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
			>
				<option value="">Ganze Saison</option>
				{#each pointsByMatchday as [md] (md)}
					<option value={md}>Spieltag {md}</option>
				{/each}
			</select>
		</label>
		<button
			onclick={exportPdf}
			class="rounded-md bg-[var(--accent)] px-3 py-1 text-sm font-medium text-white hover:opacity-90"
		>
			Als PDF exportieren
		</button>
	</div>
{/if}
