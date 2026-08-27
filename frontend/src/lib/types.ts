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

export interface PredictionResult {
	predicted_home: number;
	predicted_away: number;
	expected_home_goals: number;
	expected_away_goals: number;
	probabilities: { home_win: number; draw: number; away_win: number };
	model_trained_at: string;
}

export interface TrainResult {
	status: string;
	trained_at: string;
	n_matches: number;
	n_train: number;
	n_holdout: number;
	metrics: {
		tendency_accuracy: number | null;
		exact_score_accuracy: number | null;
		mae_home: number | null;
		mae_away: number | null;
	};
}

export interface SettingsRecord {
	id: string;
	app_name: string;
	league_label: string;
	accent_color: string;
	logo: string;
	openligadb_api_key: string;
}
