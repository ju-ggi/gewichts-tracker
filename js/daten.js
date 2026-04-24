// =============================================
// daten.js – Datenspeicherung & Datenzugriff
//
// Diese Datei hat NUR eine Aufgabe:
// Daten lesen und schreiben (localStorage).
//
// Alle anderen Dateien rufen diese Funktionen
// auf – aber wissen nicht WIE gespeichert wird.
// =============================================


// ========== PROFILE LADEN & SPEICHERN ==========

/**
 * Lädt alle Profile aus dem Browser-Speicher.
 * Gibt ein leeres Array zurück, falls noch nichts gespeichert ist.
 *
 * localStorage ist der eingebaute Speicher des Browsers –
 * er bleibt erhalten, auch wenn du die Seite schließt.
 */
function ladeProfile() {
  try {
    // localStorage.getItem() holt den gespeicherten Text
    // JSON.parse() wandelt den Text zurück in ein JavaScript-Objekt
    return JSON.parse(localStorage.getItem('wt_profile') || '[]');
  } catch(e) {
    // Falls der gespeicherte Text kaputt ist → leeres Array zurückgeben
    return [];
  }
}

/**
 * Speichert alle Profile im Browser-Speicher.
 * @param {Array} p – das Array aller Profile
 *
 * JSON.stringify() wandelt das JavaScript-Objekt in Text um,
 * weil localStorage nur Text speichern kann.
 */
function speichereProfile(p) {
  localStorage.setItem('wt_profile', JSON.stringify(p));
}

/**
 * Gibt das aktuell ausgewählte Profil zurück.
 * aktivesProfilIndex ist eine globale Variable aus app.js
 */
function aktivesProfile() {
  return ladeProfile()[aktivesProfilIndex];
}


// ========== HILFSFUNKTIONEN FÜR DATUM & ZEIT ==========

/**
 * Gibt das heutige Datum im Format "YYYY-MM-DD" zurück.
 * Beispiel: "2026-04-24"
 * Dieses Format brauchen wir intern für Vergleiche.
 */
function heute() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Wandelt ein ISO-Datum (YYYY-MM-DD) in deutsches Format um.
 * Beispiel: "2026-04-24" → "24.04.2026"
 * @param {string} iso – Datum im Format YYYY-MM-DD
 */
function formatDatum(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Gibt die aktuelle Uhrzeit als "HH:MM" zurück.
 * Beispiel: 7 Uhr 5 → "07:05"
 * padStart(2, '0') stellt sicher, dass einstellige Zahlen
 * mit einer führenden Null aufgefüllt werden.
 */
function jetztuhrzeit() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
