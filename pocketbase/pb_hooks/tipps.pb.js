/// <reference path="../pb_data/types.d.ts" />

// WICHTIG: PocketBase führt Hook-Callbacks nicht als echte Closures aus,
// sondern serialisiert sie zu Quelltext und kompiliert/führt diesen neu in
// einer separaten Executor-VM aus (siehe plugins/jsvm/binds.go). Dadurch
// gehen Referenzen auf außerhalb des Callbacks deklarierte Variablen
// (const/require/Top-Level-Funktionen) verloren ("X is not defined").
// require() und __hooks sind aber in jeder Executor-VM selbst verfügbar,
// solange sie INNERHALB des Callback-Bodys aufgerufen werden.
//
// Before-Save-Hooks (nicht "...Success"): das Setzen von "points" ist Teil
// der laufenden Save-Transaktion, braucht daher kein separates e.app.save()
// und löst dadurch keine Rekursion/erneute Speicherung aus. Deckt sowohl
// den historischen Fall (Tipp auf bereits abgeschlossenes Match) als auch
// nachträgliche Tipp-Änderungen ab.
onRecordCreate((e) => {
	const scoring = require(`${__hooks}/scoring.js`);
	const match = e.app.findRecordById("matches", e.record.get("match"));
	if (match && match.get("finished")) {
		const points = scoring.calcPoints(
			e.record.get("predicted_home"),
			e.record.get("predicted_away"),
			match.get("home_score"),
			match.get("away_score"),
		);
		e.record.set("points", points);
	}
	e.next();
}, "tipps");

onRecordUpdate((e) => {
	const scoring = require(`${__hooks}/scoring.js`);
	const match = e.app.findRecordById("matches", e.record.get("match"));
	if (match && match.get("finished")) {
		const points = scoring.calcPoints(
			e.record.get("predicted_home"),
			e.record.get("predicted_away"),
			match.get("home_score"),
			match.get("away_score"),
		);
		e.record.set("points", points);
	}
	e.next();
}, "tipps");
