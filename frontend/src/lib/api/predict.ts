import { pb } from '$lib/pocketbase';
import type { PredictionResult, TrainResult } from '$lib/types';

export async function getPrediction(matchId: string): Promise<PredictionResult> {
	return pb.send(`/api/predict/${matchId}`, { method: 'GET' });
}

export async function trainModel(): Promise<TrainResult> {
	return pb.send('/api/predict/train', { method: 'POST' });
}
