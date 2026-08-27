from __future__ import annotations

import os

import httpx

PB_URL = os.environ.get("PB_URL", "http://pocketbase:8090")


def fetch_finished_matches() -> list[dict]:
	"""Paginated fetch of all finished matches from PocketBase's public REST API.

	`matches` has an open listRule, so no auth is needed for this read.
	"""
	matches: list[dict] = []
	page = 1
	per_page = 200
	with httpx.Client(timeout=30.0) as client:
		while True:
			res = client.get(
				f"{PB_URL}/api/collections/matches/records",
				params={
					"filter": "finished = true",
					"sort": "kickoff",
					"perPage": per_page,
					"page": page,
				},
			)
			res.raise_for_status()
			data = res.json()
			matches.extend(data["items"])
			if page * per_page >= data["totalItems"]:
				break
			page += 1
	return matches
