import { pb } from '$lib/pocketbase';
import type { TippRecord } from '$lib/types';

export async function listTipps(matchIds: string[]): Promise<TippRecord[]> {
	if (matchIds.length === 0) return [];
	const filter = matchIds.map((id) => `match = "${id}"`).join(' || ');
	return pb.collection('tipps').getFullList<TippRecord>({ filter });
}

export async function listSeasonTipps(season: number): Promise<TippRecord[]> {
	return pb.collection('tipps').getFullList<TippRecord>({
		filter: `match.season = ${season}`,
		expand: 'match',
		sort: 'match.matchday'
	});
}

// Upsert-by-match: nutzt den Unique-Index auf `match`, um "Tipp speichern"
// unabhängig davon zu machen, ob bereits ein Tipp existiert.
export async function upsertTipp(
	matchId: string,
	predictedHome: number,
	predictedAway: number
): Promise<TippRecord> {
	try {
		const existing = await pb
			.collection('tipps')
			.getFirstListItem<TippRecord>(`match = "${matchId}"`);
		return await pb.collection('tipps').update<TippRecord>(existing.id, {
			predicted_home: predictedHome,
			predicted_away: predictedAway
		});
	} catch {
		return await pb.collection('tipps').create<TippRecord>({
			match: matchId,
			predicted_home: predictedHome,
			predicted_away: predictedAway
		});
	}
}
