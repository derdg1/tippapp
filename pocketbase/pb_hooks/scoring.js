/// <reference path="../pb_data/types.d.ts" />

// Klassisches Tippspiel-Schema:
// exaktes Ergebnis = 4, richtige Tordifferenz = 3, richtige Tendenz = 2, sonst 0.
function calcPoints(predHome, predAway, actualHome, actualAway) {
  if (predHome === actualHome && predAway === actualAway) return 4;

  const predDiff = predHome - predAway;
  const actualDiff = actualHome - actualAway;
  if (predDiff === actualDiff) return 3;

  const tendency = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);
  if (tendency(predDiff) === tendency(actualDiff)) return 2;

  return 0;
}

module.exports = { calcPoints };
