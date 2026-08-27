/// <reference path="../pb_data/types.d.ts" />

// $os und $http sind global gebundene Werte (sharedBinds), keine
// Closure-Variablen - duerfen daher direkt im Callback benutzt werden.
// Sollte hier kuenftig geteilte Logik noetig werden, MUSS sie wie in
// openligadb.js als require()-Modul ausgelagert und innerhalb jedes
// Callbacks per require(`${__hooks}/...`) geladen werden, s. sync.pb.js.

routerAdd("GET", "/api/predict/{matchId}", (e) => {
	const matchId = e.request.pathValue("matchId");

	let match;
	try {
		match = e.app.findRecordById("matches", matchId);
	} catch (err) {
		return e.json(404, { error: "Match nicht gefunden" });
	}

	const predictorUrl = $os.getenv("PREDICTOR_URL") || "http://predictor:8000";
	try {
		const res = $http.send({
			method: "POST",
			url: `${predictorUrl}/predict`,
			body: JSON.stringify({
				home_team: match.get("home_team"),
				away_team: match.get("away_team"),
			}),
			headers: { "Content-Type": "application/json" },
		});
		if (res.statusCode === 409) {
			return e.json(409, { error: "Modell wurde noch nicht trainiert" });
		}
		if (res.statusCode >= 400) {
			return e.json(502, { error: "Vorhersage fehlgeschlagen" });
		}
		return e.json(200, res.json);
	} catch (err) {
		return e.json(503, { error: "Predictor-Service nicht erreichbar" });
	}
});

routerAdd("POST", "/api/predict/train", (e) => {
	const predictorUrl = $os.getenv("PREDICTOR_URL") || "http://predictor:8000";
	try {
		const res = $http.send({
			method: "POST",
			url: `${predictorUrl}/train`,
			body: "{}",
			headers: { "Content-Type": "application/json" },
		});
		if (res.statusCode === 422) {
			return e.json(422, res.json);
		}
		if (res.statusCode >= 400) {
			return e.json(502, { error: "Training fehlgeschlagen" });
		}
		return e.json(200, res.json);
	} catch (err) {
		return e.json(503, { error: "Predictor-Service nicht erreichbar" });
	}
});
