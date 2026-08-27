export interface MatchRecord {
	id: string;
	openligadb_id: number;
	season: number;
	league: string;
	matchday: number;
	matchday_name: string;
	home_team: string;
	away_team: string;
	home_team_icon: string;
	away_team_icon: string;
	kickoff: string;
	finished: boolean;
	home_score: number | null;
	away_score: number | null;
	created: string;
	updated: string;
}

export interface TippRecord {
	id: string;
	match: string;
	predicted_home: number;
	predicted_away: number;
	points: number | null;
	created: string;
	updated: string;
	expand?: {
		match: MatchRecord;
	};
}

export interface CurrentMatchday {
	groupOrderID: number;
	groupName: string;
	season: number;
}

export interface TableRow {
	teamInfoId: number;
	teamName: string;
	shortName: string;
	teamIconUrl: string;
	matches: number;
	won: number;
	draw: number;
	lost: number;
	goals: number;
	opponentGoals: number;
	goalDiff: number;
	points: number;
}
