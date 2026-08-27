from __future__ import annotations

from collections import defaultdict, deque

HOME_ADV = 100.0
K = 20.0
DEFAULT_ELO = 1500.0
FORM_WINDOW = 5
DEFAULT_LEAGUE_AVG_GOALS = 1.5  # sinnvoller Bundesliga-Startwert, bevor genug Daten da sind

FEATURE_COLS = [
	"elo_home_pre",
	"elo_away_pre",
	"home_form_scored",
	"home_form_conceded",
	"away_form_scored",
	"away_form_conceded",
]


def _expected_score(elo_a: float, elo_b: float) -> float:
	return 1.0 / (1.0 + 10 ** (-(elo_a - elo_b) / 400.0))


def _goal_diff_multiplier(goal_diff: int) -> float:
	"""Standard "World Football Elo"-Gewichtung: hoehere Siege zaehlen mehr."""
	ad = abs(goal_diff)
	if ad <= 1:
		return 1.0
	if ad == 2:
		return 1.5
	return 1.75 + (ad - 3) / 8.0


class TeamState:
	"""Chronologischer Zustand pro Team: Elo-Rating + rollierende Heim-/Auswaerts-Form.

	Wird Spiel fuer Spiel (in Kickoff-Reihenfolge) aktualisiert, damit jede
	Feature-Momentaufnahme nur Informationen enthaelt, die vor dem jeweiligen
	Anpfiff bereits bekannt waren (keine Leakage).
	"""

	def __init__(self) -> None:
		self.elo: dict[str, float] = defaultdict(lambda: DEFAULT_ELO)
		self.home_scored: dict[str, deque] = defaultdict(lambda: deque(maxlen=FORM_WINDOW))
		self.home_conceded: dict[str, deque] = defaultdict(lambda: deque(maxlen=FORM_WINDOW))
		self.away_scored: dict[str, deque] = defaultdict(lambda: deque(maxlen=FORM_WINDOW))
		self.away_conceded: dict[str, deque] = defaultdict(lambda: deque(maxlen=FORM_WINDOW))
		self.league_avg_scored = DEFAULT_LEAGUE_AVG_GOALS
		self._goal_total = 0
		self._goal_count = 0

	@staticmethod
	def _avg(values: deque, fallback: float) -> float:
		return (sum(values) / len(values)) if values else fallback

	def snapshot_features(self, home: str, away: str) -> dict:
		return {
			"elo_home_pre": self.elo[home],
			"elo_away_pre": self.elo[away],
			"home_form_scored": self._avg(self.home_scored[home], self.league_avg_scored),
			"home_form_conceded": self._avg(self.home_conceded[home], self.league_avg_scored),
			"away_form_scored": self._avg(self.away_scored[away], self.league_avg_scored),
			"away_form_conceded": self._avg(self.away_conceded[away], self.league_avg_scored),
		}

	def update(self, home: str, away: str, home_goals: int, away_goals: int) -> None:
		e_home = _expected_score(self.elo[home] + HOME_ADV, self.elo[away])
		if home_goals > away_goals:
			actual_home = 1.0
		elif home_goals == away_goals:
			actual_home = 0.5
		else:
			actual_home = 0.0

		mult = _goal_diff_multiplier(home_goals - away_goals)
		delta = K * mult * (actual_home - e_home)
		self.elo[home] += delta
		self.elo[away] -= delta

		self.home_scored[home].append(home_goals)
		self.home_conceded[home].append(away_goals)
		self.away_scored[away].append(away_goals)
		self.away_conceded[away].append(home_goals)

		self._goal_total += home_goals + away_goals
		self._goal_count += 2
		self.league_avg_scored = self._goal_total / self._goal_count

	def export(self) -> dict:
		return {
			"elo": dict(self.elo),
			"home_scored": {k: list(v) for k, v in self.home_scored.items()},
			"home_conceded": {k: list(v) for k, v in self.home_conceded.items()},
			"away_scored": {k: list(v) for k, v in self.away_scored.items()},
			"away_conceded": {k: list(v) for k, v in self.away_conceded.items()},
			"league_avg_scored": self.league_avg_scored,
		}


def build_feature_rows(matches: list[dict]) -> tuple[list[dict], TeamState]:
	"""`matches` muss chronologisch aufsteigend nach Kickoff sortiert sein.

	Gibt (rows, final_state) zurueck: rows enthaelt pro Spiel die Vor-Anpfiff-
	Features + die tatsaechlichen Torzahlen als Trainingsziel; final_state ist
	der Team-Zustand nach dem letzten Spiel (Basis fuer Vorhersagen auf
	kuenftige Spiele).
	"""
	state = TeamState()
	rows: list[dict] = []
	for m in matches:
		home, away = m["home_team"], m["away_team"]
		home_goals, away_goals = m.get("home_score"), m.get("away_score")
		if home_goals is None or away_goals is None:
			continue

		feats = state.snapshot_features(home, away)
		feats["home_goals"] = home_goals
		feats["away_goals"] = away_goals
		rows.append(feats)

		state.update(home, away, home_goals, away_goals)

	return rows, state
