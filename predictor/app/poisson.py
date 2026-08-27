from __future__ import annotations

import math

MAX_GOALS = 6  # 7x7-Raster (0..6 Tore je Team) deckt praktisch alle Bundesliga-Ergebnisse ab


def _pmf(k: int, lam: float) -> float:
	lam = max(lam, 1e-6)  # eine erwartete Torzahl von 0 wuerde exp(0)=1 fuer k=0 ergeben, aber math.factorial etc. bleiben stabil
	return math.exp(-lam) * (lam**k) / math.factorial(k)


def _grid(lambda_home: float, lambda_away: float) -> dict[tuple[int, int], float]:
	grid: dict[tuple[int, int], float] = {}
	for h in range(MAX_GOALS + 1):
		for a in range(MAX_GOALS + 1):
			grid[(h, a)] = _pmf(h, lambda_home) * _pmf(a, lambda_away)
	return grid


def grid_argmax(lambda_home: float, lambda_away: float) -> tuple[int, int]:
	"""Wahrscheinlichstes Scoreline-Paar unter Unabhaengigkeitsannahme.

	Besser als unabhaengiges Runden jedes Erwartungswerts: zwei Lambdas, die
	je fuer sich auf 1:1 runden wuerden, koennen im gemeinsamen Raster ein
	anderes Paar (z.B. 1:0) als eigentlich wahrscheinlicher ausweisen.
	"""
	grid = _grid(lambda_home, lambda_away)
	return max(grid, key=grid.get)


def outcome_probabilities(lambda_home: float, lambda_away: float) -> dict[str, float]:
	grid = _grid(lambda_home, lambda_away)
	total = sum(grid.values()) or 1.0
	home_win = sum(p for (h, a), p in grid.items() if h > a) / total
	draw = sum(p for (h, a), p in grid.items() if h == a) / total
	away_win = sum(p for (h, a), p in grid.items() if h < a) / total
	return {
		"home_win": round(home_win, 4),
		"draw": round(draw, 4),
		"away_win": round(away_win, 4),
	}
