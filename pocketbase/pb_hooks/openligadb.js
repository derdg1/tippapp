/// <reference path="../pb_data/types.d.ts" />

// Reine Sync-Logik als require()-Modul statt als Top-Level-Funktionen in
// einer *.pb.js-Datei: Referenzen auf lokal deklarierte Top-Level-Funktionen
// aus einem Hook-Callback heraus (z.B. innerhalb von routerAdd/cronAdd)
// lösen zur Laufzeit einen ReferenceError aus, obwohl das Skript beim Start
// fehlerfrei lädt. Als require()-Modul exportierte Funktionen sind davon
// nicht betroffen.

const LEAGUE = "bl1"; // Bundesliga-Kürzel, für spätere bl2-Erweiterung als Konstante gehalten
const BASE_URL = "https://api.openligadb.de";

function fetchJson(url) {
	const res = $http.send({ method: "GET", url });
	if (res.statusCode >= 400) {
		throw new Error(`OpenLigaDB request failed (${res.statusCode}): ${url}`);
	}
	return res.json;
}

// Idempotenter Upsert per openligadb_id - macht wiederholte Syncs (Cron,
// manueller Refresh, historischer Import) sicher.
function upsertMatch(m, season) {
	let record = null;
	try {
		record = $app.findFirstRecordByFilter("matches", "openligadb_id = {:id}", {
			id: m.matchID,
		});
	} catch (e) {
		record = null;
	}

	if (!record) {
		const collection = $app.findCollectionByNameOrId("matches");
		record = new Record(collection);
		record.set("openligadb_id", m.matchID);
	}

	record.set("season", season);
	record.set("league", LEAGUE);
	record.set("matchday", m.group ? m.group.groupOrderID : record.get("matchday"));
	record.set("matchday_name", m.group ? m.group.groupName : "");
	record.set("home_team", m.team1 ? m.team1.teamName : "");
	record.set("away_team", m.team2 ? m.team2.teamName : "");
	record.set("home_team_icon", m.team1 ? m.team1.teamIconUrl : "");
	record.set("away_team_icon", m.team2 ? m.team2.teamIconUrl : "");
	record.set("kickoff", m.matchDateTime);
	record.set("finished", !!m.matchIsFinished);

	const finalResult = (m.matchResults || []).find((r) => r.resultTypeID === 2);
	if (finalResult) {
		record.set("home_score", finalResult.pointsTeam1);
		record.set("away_score", finalResult.pointsTeam2);
	}

	$app.save(record);
	return record;
}

function syncSeason(season) {
	const matches = fetchJson(`${BASE_URL}/getmatchdata/${LEAGUE}/${season}`);
	let count = 0;
	for (const m of matches) {
		upsertMatch(m, season);
		count++;
	}
	return count;
}

function syncMatchday(season, matchday) {
	const matches = fetchJson(`${BASE_URL}/getmatchdata/${LEAGUE}/${season}/${matchday}`);
	let count = 0;
	for (const m of matches) {
		upsertMatch(m, season);
		count++;
	}
	return count;
}

function fetchCurrentGroup() {
	return fetchJson(`${BASE_URL}/getcurrentgroup/${LEAGUE}`);
}

function fetchTable(season) {
	return fetchJson(`${BASE_URL}/getbltable/${LEAGUE}/${season}`);
}

// Aktuelle Bundesliga-Saison aus dem Datum ableiten: eine Saison "N" läuft
// von Sommer des Jahres N bis Frühsommer des Jahres N+1. getcurrentgroup
// liefert selbst keine Saisonjahr-Angabe.
function currentSeason() {
	const now = new Date();
	return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

module.exports = {
	LEAGUE,
	syncSeason,
	syncMatchday,
	fetchCurrentGroup,
	fetchTable,
	currentSeason,
};
