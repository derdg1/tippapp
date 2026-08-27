import { pb } from '$lib/pocketbase';
import type { CurrentMatchday, MatchRecord, TableRow } from '$lib/types';

export async function listMatches(season: number, matchday: number): Promise<MatchRecord[]> {
	return pb.collection('matches').getFullList<MatchRecord>({
		filter: `season = ${season} && matchday = ${matchday}`,
		sort: 'kickoff'
	});
}

export async function listSeasonMatches(season: number): Promise<MatchRecord[]> {
	return pb.collection('matches').getFullList<MatchRecord>({
		filter: `season = ${season}`,
		sort: 'matchday,kickoff'
	});
}

export async function getCurrentMatchday(): Promise<CurrentMatchday> {
	return pb.send('/api/current-matchday', { method: 'GET' });
}

export async function getTable(season: number): Promise<TableRow[]> {
	return pb.send(`/api/table/${season}`, { method: 'GET' });
}
