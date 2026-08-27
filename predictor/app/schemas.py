from __future__ import annotations

from pydantic import BaseModel


class PredictRequest(BaseModel):
	home_team: str
	away_team: str


class Probabilities(BaseModel):
	home_win: float
	draw: float
	away_win: float


class PredictResponse(BaseModel):
	predicted_home: int
	predicted_away: int
	expected_home_goals: float
	expected_away_goals: float
	probabilities: Probabilities
	model_trained_at: str


class TrainMetrics(BaseModel):
	tendency_accuracy: float | None
	exact_score_accuracy: float | None
	mae_home: float | None
	mae_away: float | None


class TrainResponse(BaseModel):
	status: str
	trained_at: str
	n_matches: int
	n_train: int
	n_holdout: int
	metrics: TrainMetrics
