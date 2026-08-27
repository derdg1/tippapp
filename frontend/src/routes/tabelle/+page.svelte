<script lang="ts">
	import { onMount } from 'svelte';
	import { getTable } from '$lib/api/matches';
	import type { TableRow } from '$lib/types';

	let season = $state(new Date().getFullYear());
	let table = $state<TableRow[]>([]);
	let loading = $state(true);

	async function load() {
		loading = true;
		table = await getTable(season);
		loading = false;
	}

	onMount(load);
</script>

<h1 class="mb-4 text-xl font-semibold">Tabelle</h1>

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
	<table class="w-full border-collapse text-sm">
		<thead>
			<tr class="border-b border-gray-300 text-left dark:border-gray-700">
				<th class="py-2 pr-2">#</th>
				<th class="py-2 pr-2">Team</th>
				<th class="py-2 pr-2 text-right">Sp</th>
				<th class="py-2 pr-2 text-right">S</th>
				<th class="py-2 pr-2 text-right">U</th>
				<th class="py-2 pr-2 text-right">N</th>
				<th class="py-2 pr-2 text-right">Tore</th>
				<th class="py-2 pr-2 text-right">Diff</th>
				<th class="py-2 text-right">Pkt</th>
			</tr>
		</thead>
		<tbody>
			{#each table as team, i (team.teamInfoId ?? i)}
				<tr class="border-b border-gray-100 dark:border-gray-800">
					<td class="py-2 pr-2">{i + 1}</td>
					<td class="py-2 pr-2">{team.teamName}</td>
					<td class="py-2 pr-2 text-right">{team.matches}</td>
					<td class="py-2 pr-2 text-right">{team.won}</td>
					<td class="py-2 pr-2 text-right">{team.draw}</td>
					<td class="py-2 pr-2 text-right">{team.lost}</td>
					<td class="py-2 pr-2 text-right">{team.goals}:{team.opponentGoals}</td>
					<td class="py-2 pr-2 text-right">{team.goalDiff}</td>
					<td class="py-2 text-right font-semibold">{team.points}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
