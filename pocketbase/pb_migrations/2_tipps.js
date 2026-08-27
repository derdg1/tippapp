/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const matches = app.findCollectionByNameOrId("matches");

  const collection = new Collection({
    type: "base",
    name: "tipps",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        name: "match",
        type: "relation",
        required: true,
        collectionId: matches.id,
        cascadeDelete: true,
        maxSelect: 1,
      },
      // "required: true" fehlt hier bewusst: PocketBase behandelt bei
      // required Number-Feldern den Wert 0 als "cannot be blank" - ein 0:0-
      // oder X:0-Tipp ist im Fußball aber ein völlig gültiges Ergebnis.
      { name: "predicted_home", type: "number", onlyInt: true, min: 0 },
      { name: "predicted_away", type: "number", onlyInt: true, min: 0 },
      { name: "points", type: "number", onlyInt: true },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_tipps_match ON tipps (match)",
    ],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("tipps");
  return app.delete(collection);
})
