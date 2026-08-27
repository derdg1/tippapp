from __future__ import annotations

from .features import DEFAULT_ELO
from .poisson import grid_argmax, outcome_probabilities


def _avg(values: list[float], fallback: float) -> float:
	return (sum(values) / len(values)) if values else fallback


def _build_fixture_features(artifact: dict, home_team: str, away_team: str) -> list[float]:
	league_avg = artifact["league_avg_scored"]
	elo = artifact["elo"]
	return [
		elo.get(home_team, DEFAULT_ELO),
		elo.get(away_team, DEFAULT_ELO),
		_avg(artifact["home_scored"].get(home_team, []), league_avg),
		_avg(artifact["home_conceded"].get(home_team, []), league_avg),
		_avg(artifact["away_scored"].get(away_team, []), league_avg),
		_avg(artifact["away_conceded"].get(away_team, []), league_avg),
	]


def predict_fixture(artifact: dict, home_team: str, away_team: str) -> dict:
	features = [_build_fixture_features(artifact, home_team, away_team)]
	lam_home = float(artifact["model_home"].predict(features)[0])
	lam_away = float(artifact["model_away"].predict(features)[0])

	pred_home, pred_away = grid_argmax(lam_home, lam_away)
	probabilities = outcome_probabilities(lam_home, lam_away)

	return {
		"predicted_home": pred_home,
		"predicted_away": pred_away,
		"expected_home_goals": round(lam_home, 3),
		"expected_away_goals": round(lam_away, 3),
		"probabilities": probabilities,
		"model_trained_at": artifact["trained_at"],
	}
