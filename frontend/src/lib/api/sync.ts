import { pb } from '$lib/pocketbase';

export interface SyncResult {
	imported: number;
	season: string;
	matchday?: string;
}

export async function syncSeason(season: number): Promise<SyncResult> {
	return pb.send(`/api/sync/season/${season}`, { method: 'POST' });
}

export async function syncMatchday(season: number, matchday: number): Promise<SyncResult> {
	return pb.send(`/api/sync/matchday/${season}/${matchday}`, { method: 'POST' });
}
