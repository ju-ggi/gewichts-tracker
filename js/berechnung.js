// =============================================
// berechnung.js – Reine Berechnungen
//
// Diese Datei hat NUR eine Aufgabe: Rechnen.
// Kein document.getElementById()
// Kein HTML erzeugen
// Keine Anzeige-Logik
//
// Prinzip: Daten rein → Ergebnis raus
// =============================================


// ========== BMI ==========

/**
 * Berechnet den Body-Mass-Index (BMI).
 * Formel: Gewicht (kg) ÷ Größe (m)²
 *
 * Beispiel: 90 kg, 180 cm → 90 ÷ (1.80)² = 27.8
 *
 * @param {number} gewicht – in kg
 * @param {number} groesse – in cm
 * @returns {number} BMI als Zahl
 */
function berechneBMI(gewicht, groesse) {
  const groesseInMeter = groesse / 100;        // cm → m
  return gewicht / (groesseInMeter ** 2);      // ** bedeutet "hoch" (Potenz)
}


// ========== FORTSCHRITT ==========

/**
 * Berechnet wie viel kg bereits abgenommen wurden.
 * Gibt immer eine positive Zahl zurück (oder 0).
 *
 * @param {number} start    – Startgewicht in kg
 * @param {number} aktuell  – Aktuelles Gewicht in kg
 * @returns {number} Abgenommene kg
 */
function berechneAbgenommen(start, aktuell) {
  return Math.max(0, start - aktuell);
}

/**
 * Berechnet den Fortschritt in Prozent.
 * 0% = noch kein Fortschritt, 100% = Ziel erreicht
 *
 * @param {number} abgenommen – bereits abgenommene kg
 * @param {number} gesamtziel – start - ziel (Gesamtstrecke)
 * @returns {number} Prozent (0–100)
 */
function berechneFortschrittProzent(abgenommen, gesamtziel) {
  if (gesamtziel <= 0) return 100;             // Verhindert Division durch 0
  return Math.min(100, Math.round((abgenommen / gesamtziel) * 100));
}


// ========== TREND ==========

/**
 * Berechnet den Gewichtstrend der letzten 7 Einträge.
 * Negativ = Abnahme (gut), Positiv = Zunahme
 *
 * @param {Array} eintraege – alle Gewichtseinträge (mit .datum und .gewicht)
 * @returns {object} { trendWert, klasse, symbol, text }
 *   - trendWert: Zahl (z.B. -0.8 = 0.8 kg abgenommen)
 *   - klasse: 'gruen', 'gelb' oder 'rot' (für die Farbe)
 *   - symbol: '↓', '→' oder '↑'
 *   - text: Erklärungstext für den Nutzer
 */
function berechneTrend(eintraege, haltegewichtModus) {
  const sortiert = [...eintraege].sort((a, b) => a.datum.localeCompare(b.datum));

  // Zu wenig Daten für einen sinnvollen Trend
  if (sortiert.length < 3) return null;

  // Letzten 7 Einträge nehmen
  const letzteWoche = sortiert.slice(-7);

  // Differenz: letzter Wert minus erster Wert
  const trendWert = letzteWoche.length > 1
    ? letzteWoche[letzteWoche.length - 1].gewicht - letzteWoche[0].gewicht
    : 0;

  let klasse, symbol, text;

  if (haltegewichtModus) {
    // In der Haltephase: Schwankung unter 0.5 kg ist gut
    const stabil = Math.abs(trendWert) < 0.5;
    klasse  = stabil ? 'gruen' : 'gelb';
    symbol  = stabil ? '✓' : '⚠';
    text    = stabil
      ? 'Haltephase: Gewicht stabil – super!'
      : 'Haltephase: Gewicht schwankt – im Auge behalten.';
  } else {
    // Abnehmphase: Abnahme ist gut
    if (trendWert < -0.2)      { klasse = 'gruen'; symbol = '↓'; text = 'Trend: Du nimmst ab – weiter so!'; }
    else if (trendWert < 0.3)  { klasse = 'gelb';  symbol = '→'; text = 'Trend: Kaum Veränderung in den letzten 7 Tagen – dranbleiben!'; }
    else                       { klasse = 'rot';   symbol = '↑'; text = 'Trend: Leichte Zunahme diese Woche – aufpassen!'; }
  }

  return { trendWert, klasse, symbol, text };
}


// ========== PROGNOSE ==========

/**
 * Berechnet wann das Zielgewicht voraussichtlich erreicht wird.
 *
 * Methode: Durchschnittliche Abnahme pro Tag berechnen,
 * dann hochrechnen wie lange es noch dauert.
 *
 * @param {Array} eintraege – alle Gewichtseinträge
 * @param {number} zielgewicht – Zielgewicht in kg
 * @returns {object|null} { abnahmeProWoche, restWochen, zielDatum } oder null
 */
function berechnePrognose(eintraege, zielgewicht) {
  if (eintraege.length < 3) return null;

  const sortiert = [...eintraege].sort((a, b) => a.datum.localeCompare(b.datum));
  const erster = sortiert[0];
  const letzter = sortiert[sortiert.length - 1];

  // Anzahl Tage zwischen erstem und letztem Eintrag
  const tage = Math.max(1,
    (new Date(letzter.datum) - new Date(erster.datum)) / (1000 * 60 * 60 * 24)
  );

  // Abnahme pro Tag (kann 0 oder negativ sein)
  const abnahmeProTag = (erster.gewicht - letzter.gewicht) / tage;

  // Keine Abnahme erkennbar
  if (abnahmeProTag <= 0) return null;

  // Wie viele kg fehlen noch bis zum Ziel?
  const restKg = Math.max(0, letzter.gewicht - zielgewicht);

  // Wie viele Tage noch?
  const restTage = Math.round(restKg / abnahmeProTag);

  // Zieldatum berechnen
  const zielDatum = new Date();
  zielDatum.setDate(zielDatum.getDate() + restTage);

  return {
    abnahmeProWoche: abnahmeProTag * 7,          // Pro Tag → Pro Woche
    restWochen: (restTage / 7).toFixed(1),       // Auf 1 Dezimale runden
    zielDatum: zielDatum.toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  };
}


// ========== PLATEAU-ERKENNUNG ==========

/**
 * Prüft ob der Nutzer in einem Gewichts-Plateau steckt.
 * Plateau = kaum Veränderung in den letzten 14 Tagen.
 *
 * @param {Array} eintraege – alle Gewichtseinträge
 * @returns {object|null} { schwankung, istPlateau } oder null (zu wenig Daten)
 */
function berechnePlateau(eintraege) {
  if (eintraege.length < 5) return null;

  const sortiert = [...eintraege].sort((a, b) => a.datum.localeCompare(b.datum));

  // Nur Einträge der letzten 14 Tage
  const vor14 = new Date();
  vor14.setDate(vor14.getDate() - 14);
  const letzte14 = sortiert.filter(e => new Date(e.datum) >= vor14);

  if (letzte14.length < 3) return null;

  // Maximale und minimale Schwankung berechnen
  const maxGewicht = Math.max(...letzte14.map(e => e.gewicht));
  const minGewicht = Math.min(...letzte14.map(e => e.gewicht));
  const schwankung = maxGewicht - minGewicht;

  return {
    schwankung,
    istPlateau: schwankung < 0.5    // Weniger als 0.5 kg Schwankung = Plateau
  };
}


// ========== WOCHENZUSAMMENFASSUNG ==========

/**
 * Berechnet die Statistiken der letzten 7 Tage.
 *
 * @param {Array} eintraege – alle Gewichtseinträge
 * @returns {object|null} Wochenstatistik oder null (zu wenig Daten)
 */
function berechneWoche(eintraege) {
  const heute = new Date();
  const vorWoche = new Date();
  vorWoche.setDate(vorWoche.getDate() - 7);

  const vorWocheStr = vorWoche.toISOString().split('T')[0];
  const heuteStr = heute.toISOString().split('T')[0];

  // Nur Einträge der letzten 7 Tage
  const wochenEintraege = eintraege.filter(
    e => e.datum >= vorWocheStr && e.datum <= heuteStr
  );

  if (wochenEintraege.length < 2) return null;

  const erster = wochenEintraege[0];
  const letzter = wochenEintraege[wochenEintraege.length - 1];

  // Gewichtsveränderung diese Woche
  const diff = letzter.gewicht - erster.gewicht;

  // Durchschnittliche Kalorien (nur Tage mit Kalorien-Eintrag)
  const mitKalorien = wochenEintraege.filter(e => e.kalorien);
  const kcalDurchschnitt = mitKalorien.length
    ? Math.round(mitKalorien.reduce((summe, e) => summe + e.kalorien, 0) / mitKalorien.length)
    : null;

  // Anzahl Sport-Tage
  const sportTage = wochenEintraege.filter(
    e => e.typen && e.typen.includes('Sport')
  ).length;

  return {
    anzahlEintraege: wochenEintraege.length,
    erstesGewicht:   erster.gewicht,
    letztesGewicht:  letzter.gewicht,
    diff,                              // Negativ = abgenommen, Positiv = zugenommen
    kcalDurchschnitt,                  // null wenn keine Kalorien eingetragen
    sportTage
  };
}


// ========== MEILENSTEINE ==========

/**
 * Gibt alle erreichten Meilensteine zurück.
 * Meilensteine: 5, 10, 15, 20, 25, 30, 40, 50 kg abgenommen
 *
 * @param {number} abgenommen – bereits abgenommene kg
 * @returns {Array} Liste der erreichten Meilenstein-Werte
 */
function berechneMeilensteine(abgenommen) {
  const stufen = [5, 10, 15, 20, 25, 30, 40, 50];
  return stufen.filter(m => abgenommen >= m);
}


// ========== 7-TAGE-DURCHSCHNITT ==========

/**
 * Berechnet den Durchschnitt der letzten 7 Gewichtseinträge.
 * Warum? Tagesgewicht schwankt durch Wasser, Verdauung usw.
 * Der Wochendurchschnitt zeigt den echten Trend.
 *
 * @param {Array} eintraege – alle Gewichtseinträge
 * @returns {object|null} { schnitt, min, max, anzahl } oder null
 */
function berechneWochendurchschnitt(eintraege) {
  if (eintraege.length < 2) return null;

  // Neueste 7 Einträge (sortiert nach Datum)
  const sortiert = [...eintraege].sort((a, b) => a.datum.localeCompare(b.datum));
  const letzte7 = sortiert.slice(-7);

  const werte = letzte7.map(e => e.gewicht);
  const schnitt = werte.reduce((sum, w) => sum + w, 0) / werte.length;

  return {
    schnitt: schnitt,                          // Durchschnittsgewicht
    min: Math.min(...werte),                   // Tiefstwert der Woche
    max: Math.max(...werte),                   // Höchstwert der Woche
    anzahl: werte.length                       // Wie viele Einträge eingerechnet
  };
}


// ========== STREAK-COUNTER ==========

/**
 * Zählt wie viele Tage in Folge der Nutzer einen Eintrag gemacht hat.
 * Zählt rückwärts von heute. Lücken unterbrechen den Streak.
 *
 * Beispiel: Einträge an Mo, Di, Mi, Fr → Streak = 1 (Do fehlt → Kette unterbrochen)
 *
 * @param {Array} eintraege – alle Gewichtseinträge
 * @returns {number} Anzahl aufeinanderfolgender Tage mit Eintrag
 */
function berechneStreak(eintraege) {
  if (eintraege.length === 0) return 0;

  // Alle Daten als Set (schnelles Nachschlagen)
  const datumsSet = new Set(eintraege.map(e => e.datum));

  let streak = 0;
  const pruef = new Date();    // Starten wir mit heute

  // Rückwärts zählen – solange der jeweilige Tag einen Eintrag hat
  while (true) {
    const datumStr = pruef.toISOString().split('T')[0];    // Format: "2026-05-05"

    if (datumsSet.has(datumStr)) {
      streak++;                                            // Tag hat Eintrag → zählt
      pruef.setDate(pruef.getDate() - 1);                  // Einen Tag zurück
    } else {
      break;                                               // Lücke → Streak endet
    }
  }

  return streak;
}


// ========== BMR / GRUNDUMSATZ ==========

/**
 * Berechnet den Grundumsatz (BMR) nach der Mifflin-St. Jeor Formel.
 * BMR = wie viele Kalorien der Körper im Ruhezustand verbraucht.
 * Das ist die genaueste Formel für Erwachsene.
 *
 * @param {number} gewicht   – in kg
 * @param {number} groesse   – in cm
 * @param {number} alter     – in Jahren
 * @param {string} geschlecht – 'm' oder 'w'
 * @returns {number} Grundumsatz in kcal/Tag
 */
function berechneBMR(gewicht, groesse, alter, geschlecht) {
  // Mifflin-St. Jeor Formel
  const basis = (10 * gewicht) + (6.25 * groesse) - (5 * alter);
  return geschlecht === 'm' ? basis + 5 : basis - 161;
}

/**
 * Berechnet den Gesamtkalorienbedarf (TDEE) aus BMR × Aktivitätsfaktor.
 * TDEE = Total Daily Energy Expenditure = Gesamtverbrauch pro Tag.
 *
 * @param {number} bmr              – Grundumsatz aus berechneBMR()
 * @param {string} aktivitaetsLevel – 'sitzend', 'leicht', 'maessig', 'aktiv', 'sehr_aktiv'
 * @returns {number} Kalorienbedarf pro Tag (gerundet)
 */
function berechneTDEE(bmr, aktivitaetsLevel) {
  // Faktoren: je mehr Bewegung, desto höher der Verbrauch
  const faktoren = {
    sitzend:    1.2,    // Bürojob, kaum Bewegung
    leicht:     1.375,  // 1–3x Sport pro Woche
    maessig:    1.55,   // 3–5x Sport pro Woche
    aktiv:      1.725,  // 6–7x Sport pro Woche
    sehr_aktiv: 1.9     // Körperliche Arbeit + täglich Sport
  };
  const faktor = faktoren[aktivitaetsLevel] || 1.2;
  return Math.round(bmr * faktor);
}
