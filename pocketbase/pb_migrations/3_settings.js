/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "settings",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "app_name", type: "text", max: 60 },
      { name: "league_label", type: "text", max: 100 },
      { name: "accent_color", type: "text", max: 20 },
      {
        name: "logo",
        type: "file",
        maxSelect: 1,
        mimeTypes: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"],
      },
      { name: "openligadb_api_key", type: "text", max: 200 },
    ],
  });
  app.save(collection);

  // Einzelner Settings-Datensatz mit fester ID, damit Frontend/Backend ihn
  // ohne Suche direkt referenzieren koennen (Einzelbenutzer-App, es gibt nie
  // einen zweiten Datensatz).
  const record = new Record(collection);
  record.id = "settings0000001";
  record.set("app_name", "TippKick");
  record.set("league_label", "Bundesliga-Tippspiel");
  record.set("accent_color", "#2563eb");
  return app.save(record);
}, (app) => {
  const collection = app.findCollectionByNameOrId("settings");
  return app.delete(collection);
})
