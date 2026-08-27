/// <reference path="../pb_data/types.d.ts" />

// Deckt den Live-Fall ab: Tipp wurde vor Anpfiff abgegeben, das Ergebnis
// kommt erst später über den Sync -> alle zugehörigen Tipps neu speichern,
// sobald ein Match auf "finished" wechselt oder sein Ergebnis sich ändert.
// Die eigentliche Punkteberechnung übernimmt dabei der onRecordUpdate-Hook
// in tipps.pb.js (Before-Save, läuft als Teil dieses e.app.save()-Aufrufs
// und damit ohne Rekursionsgefahr, da es eine andere Collection ist).
onRecordAfterUpdateSuccess((e) => {
  if (e.record.get("finished")) {
    const tipps = e.app.findRecordsByFilter(
      "tipps",
      "match = {:matchId}",
      "",
      0,
      0,
      { matchId: e.record.id },
    );

    for (const tipp of tipps) {
      e.app.save(tipp);
    }
  }
  e.next();
}, "matches");
