/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "matches",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "openligadb_id", type: "number", required: true, onlyInt: true },
      { name: "season", type: "number", required: true, onlyInt: true },
      { name: "league", type: "text", required: true, max: 10 },
      { name: "matchday", type: "number", required: true, onlyInt: true },
      { name: "matchday_name", type: "text" },
      { name: "home_team", type: "text", required: true },
      { name: "away_team", type: "text", required: true },
      { name: "home_team_icon", type: "url" },
      { name: "away_team_icon", type: "url" },
      { name: "kickoff", type: "date", required: true },
      { name: "finished", type: "bool" },
      { name: "home_score", type: "number", onlyInt: true },
      { name: "away_score", type: "number", onlyInt: true },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_matches_openligadb_id ON matches (openligadb_id)",
      "CREATE INDEX idx_matches_season_matchday ON matches (season, matchday)",
    ],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("matches");
  return app.delete(collection);
})
