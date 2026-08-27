from __future__ import annotations

from datetime import datetime, timezone

import pandas as pd
from sklearn.linear_model import PoissonRegressor

from .features import FEATURE_COLS, build_feature_rows
from .poisson import grid_argmax

MIN_MATCHES = 30
HOLDOUT_FRACTION = 0.2
MIN_HOLDOUT = 20
MIN_TRAIN_ROWS = 10


def _tendency(home_goals: float, away_goals: float) -> int:
	if home_goals > away_goals:
		return 1
	if home_goals < away_goals:
		return -1
	return 0


def run_training(matches: list[dict]) -> dict:
	"""Trainiert Heim-/Auswaerts-Torerwartung auf allen `finished`-Matches.

	Wirft ValueError bei zu wenig Daten (vom Aufrufer als 422 durchzureichen).
	"""
	matches = sorted(matches, key=lambda m: m["kickoff"])
	rows, final_state = build_feature_rows(matches)

	if len(rows) < MIN_MATCHES:
		raise ValueError(
			f"Nicht genug abgeschlossene Spiele zum Trainieren ({len(rows)} von mindestens {MIN_MATCHES})"
		)

	df = pd.DataFrame(rows)

	n_holdout = max(MIN_HOLDOUT, int(len(df) * HOLDOUT_FRACTION))
	n_holdout = min(n_holdout, max(len(df) - MIN_TRAIN_ROWS, 0))
	split = len(df) - n_holdout

	train_df = df.iloc[:split]
	holdout_df = df.iloc[split:]

	model_home = PoissonRegressor(alpha=1.0, max_iter=300)
	model_away = PoissonRegressor(alpha=1.0, max_iter=300)
	model_home.fit(train_df[FEATURE_COLS].values, train_df["home_goals"].values)
	model_away.fit(train_df[FEATURE_COLS].values, train_df["away_goals"].values)

	metrics = {
		"tendency_accuracy": None,
		"exact_score_accuracy": None,
		"mae_home": None,
		"mae_away": None,
	}
	if len(holdout_df) > 0:
		pred_home = model_home.predict(holdout_df[FEATURE_COLS].values)
		pred_away = model_away.predict(holdout_df[FEATURE_COLS].values)

		correct_tendency = 0
		correct_exact = 0
		abs_err_home = 0.0
		abs_err_away = 0.0

		for i, actual_home_goals, actual_away_goals in zip(
			range(len(holdout_df)), holdout_df["home_goals"], holdout_df["away_goals"]
		):
			lam_h, lam_a = float(pred_home[i]), float(pred_away[i])
			pred_h, pred_a = grid_argmax(lam_h, lam_a)

			if _tendency(pred_h, pred_a) == _tendency(actual_home_goals, actual_away_goals):
				correct_tendency += 1
			if pred_h == actual_home_goals and pred_a == actual_away_goals:
				correct_exact += 1
			abs_err_home += abs(lam_h - actual_home_goals)
			abs_err_away += abs(lam_a - actual_away_goals)

		n = len(holdout_df)
		metrics = {
			"tendency_accuracy": round(correct_tendency / n, 4),
			"exact_score_accuracy": round(correct_exact / n, 4),
			"mae_home": round(abs_err_home / n, 4),
			"mae_away": round(abs_err_away / n, 4),
		}

	artifact = {
		"model_home": model_home,
		"model_away": model_away,
		**final_state.export(),
		"trained_at": datetime.now(timezone.utc).isoformat(),
		"n_matches": len(rows),
		"n_train": len(train_df),
		"n_holdout": len(holdout_df),
		"metrics": metrics,
	}
	return artifact
