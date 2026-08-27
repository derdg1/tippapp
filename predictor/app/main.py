from __future__ import annotations

import os
import threading
from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException

from .pb_client import fetch_finished_matches
from .predict import predict_fixture
from .schemas import PredictRequest, PredictResponse, TrainResponse
from .train import run_training

MODEL_PATH = Path(os.environ.get("MODEL_PATH", "/app/models/model.joblib"))

app = FastAPI(title="TippKick Predictor")

_lock = threading.Lock()


def _load_artifact_from_disk() -> dict | None:
	if MODEL_PATH.exists():
		return joblib.load(MODEL_PATH)
	return None


_artifact: dict | None = _load_artifact_from_disk()


@app.get("/health")
def health() -> dict:
	return {"status": "ok", "model_loaded": _artifact is not None}


@app.post("/train", response_model=TrainResponse)
def train() -> TrainResponse:
	global _artifact

	matches = fetch_finished_matches()
	try:
		artifact = run_training(matches)
	except ValueError as e:
		raise HTTPException(status_code=422, detail=str(e)) from e

	MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
	with _lock:
		joblib.dump(artifact, MODEL_PATH)
		_artifact = artifact

	return TrainResponse(
		status="ok",
		trained_at=artifact["trained_at"],
		n_matches=artifact["n_matches"],
		n_train=artifact["n_train"],
		n_holdout=artifact["n_holdout"],
		metrics=artifact["metrics"],
	)


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> dict:
	with _lock:
		artifact = _artifact
	if artifact is None:
		raise HTTPException(status_code=409, detail="Modell wurde noch nicht trainiert")
	return predict_fixture(artifact, req.home_team, req.away_team)
