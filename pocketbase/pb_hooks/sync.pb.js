/// <reference path="../pb_data/types.d.ts" />

// WICHTIG: routerAdd/cronAdd-Callbacks werden von PocketBase zu Quelltext
// serialisiert und in einer separaten Executor-VM neu ausgeführt (siehe
// plugins/jsvm/binds.go) - ein außerhalb deklariertes "const openligadb =
// require(...)" wäre dort nicht mehr vorhanden. require()/__hooks müssen
// deshalb innerhalb jedes einzelnen Callback-Bodys aufgerufen werden.

routerAdd("POST", "/api/sync/season/{season}", (e) => {
	const openligadb = require(`${__hooks}/openligadb.js`);
	const season = e.request.pathValue("season");
	const count = openligadb.syncSeason(season);
	return e.json(200, { imported: count, season });
});

routerAdd("POST", "/api/sync/matchday/{season}/{matchday}", (e) => {
	const openligadb = require(`${__hooks}/openligadb.js`);
	const season = e.request.pathValue("season");
	const matchday = e.request.pathValue("matchday");
	const count = openligadb.syncMatchday(season, matchday);
	return e.json(200, { imported: count, season, matchday });
});

routerAdd("GET", "/api/current-matchday", (e) => {
	const openligadb = require(`${__hooks}/openligadb.js`);
	const group = openligadb.fetchCurrentGroup();
	return e.json(200, { ...group, season: openligadb.currentSeason() });
});

routerAdd("GET", "/api/table/{season}", (e) => {
	const openligadb = require(`${__hooks}/openligadb.js`);
	const season = e.request.pathValue("season");
	const table = openligadb.fetchTable(season);
	return e.json(200, table);
});

// Hält die laufende Saison aktuell; über den matches.pb.js-Hook werden
// betroffene Tipps automatisch neu bewertet, sobald ein Ergebnis eintrifft.
cronAdd("sync-current-matchday", "*/15 * * * *", () => {
	const openligadb = require(`${__hooks}/openligadb.js`);
	try {
		const group = openligadb.fetchCurrentGroup();
		openligadb.syncMatchday(openligadb.currentSeason(), group.groupOrderID);
	} catch (err) {
		console.log("cron sync failed:", err);
	}
});
