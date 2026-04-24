// =============================================
// anzeige.js – Alles was der Nutzer sieht
//
// Diese Datei hat NUR eine Aufgabe:
// HTML erzeugen und in den Bildschirm schreiben.
//
// Sie darf berechnung.js und daten.js aufrufen,
// aber niemals selbst speichern oder rechnen.
// =============================================


// ========== DASHBOARD ==========

/**
 * Aktualisiert die gesamte Übersichtsseite.
 * Ruft Berechnungen aus berechnung.js auf
 * und schreibt die Ergebnisse in den Bildschirm.
 */
function aktualisiereDashboard() {
  const p = aktivesProfile();
  if (!p) return;

  // Berechnungen aus berechnung.js
  const letzt  = p.eintraege[p.eintraege.length - 1].gewicht;
  const abgen  = berechneAbgenommen(p.start, letzt);
  const gesamt = p.start - p.ziel;
  const pct    = berechneFortschrittProzent(abgen, gesamt);
  const rest   = Math.max(0, letzt - p.ziel);
  const bmi    = berechneBMI(letzt, p.groesse).toFixed(1);
  const h      = heute();

  // Werte in den Bildschirm schreiben
  document.getElementById('begruessung').textContent   = 'Hallo, ' + p.name + '!';
  document.getElementById('akt-gewicht').textContent   = letzt.toFixed(1);
  document.getElementById('m-abgenommen').textContent  = abgen.toFixed(1) + ' kg';
  document.getElementById('m-rest').textContent        = rest.toFixed(1) + ' kg';
  document.getElementById('m-pct').textContent         = pct + '%';
  document.getElementById('m-bmi').textContent         = bmi;
  document.getElementById('balken-fill').style.width   = pct + '%';
  document.getElementById('balken-text').textContent   = pct + '% des Ziels erreicht';

  // Haltegewicht-Badge ein-/ausblenden
  const badge = document.getElementById('haltegewicht-badge');
  if (p.haltegewichtModus) badge.classList.remove('versteckt');
  else badge.classList.add('versteckt');

  // Hinweis anzeigen wenn heute noch kein Eintrag
  const heuteEintrag = p.eintraege.some(e => e.datum === h);
  document.getElementById('kein-eintrag-hinweis').classList.toggle('versteckt', heuteEintrag);

  // Meilensteine anzeigen
  const ms = document.getElementById('meilensteine');
  ms.innerHTML = '';
  berechneMeilensteine(abgen).forEach(m => {
    ms.innerHTML += `<div class="meilenstein">&#127942; Meilenstein: ${m} kg abgenommen!</div>`;
  });

  // Wochenzusammenfassung nur montags zeigen
  const heute_obj = new Date();
  if (heute_obj.getDay() === 1) zeigeWochenzusammenfassung(p);
  else document.getElementById('wochen-summary').classList.add('versteckt');

  // Alle Teilbereiche aktualisieren
  zeigeAmpel(p);
  zeigeWasser(p);
  zeigePrognose(p);
  zeigePlateau(p);
  zeigeChart(p, aktuelleChartAnsicht);
}


// ========== AMPEL ==========

/**
 * Zeigt die Ampel (grün/gelb/rot) basierend auf dem Gewichtstrend.
 * Berechnung kommt aus berechnung.js → berechneTrend()
 */
function zeigeAmpel(p) {
  const container = document.getElementById('ampel-anzeige');
  const trend = berechneTrend(p.eintraege, p.haltegewichtModus);

  if (!trend) { container.classList.add('versteckt'); return; }

  container.className = 'ampel ' + trend.klasse + ' volle-breite';
  container.innerHTML = `<div class="ampel-kreis"></div><span>${trend.symbol} ${trend.text}</span>`;
  container.classList.remove('versteckt');
}


// ========== WOCHENZUSAMMENFASSUNG ==========

/**
 * Zeigt die Statistiken der letzten 7 Tage.
 * Berechnung kommt aus berechnung.js → berechneWoche()
 */
function zeigeWochenzusammenfassung(p) {
  const container = document.getElementById('wochen-summary');
  const woche = berechneWoche(p.eintraege);

  if (!woche) { container.classList.add('versteckt'); return; }

  const sign  = woche.diff <= 0 ? '' : '+';
  const farbe = woche.diff <= 0 ? '#0F6E56' : '#993C1D';

  container.className = 'karte volle-breite';
  container.innerHTML = `
    <p class="abschnitt">📊 Wochenzusammenfassung</p>
    <div class="woche-karte">
      <div class="woche-stat"><span>Einträge diese Woche</span><strong>${woche.anzahlEintraege}</strong></div>
      <div class="woche-stat"><span>Gewicht von → bis</span><strong>${woche.erstesGewicht.toFixed(1)} → ${woche.letztesGewicht.toFixed(1)} kg</strong></div>
      <div class="woche-stat"><span>Veränderung</span><strong style="color:${farbe}">${sign}${woche.diff.toFixed(1)} kg</strong></div>
      ${woche.kcalDurchschnitt ? `<div class="woche-stat"><span>Ø Kalorien/Tag</span><strong>${woche.kcalDurchschnitt} kcal</strong></div>` : ''}
      ${woche.sportTage > 0 ? `<div class="woche-stat"><span>Sport-Tage</span><strong>${woche.sportTage}x</strong></div>` : ''}
    </div>`;
  container.classList.remove('versteckt');
}


// ========== PROGNOSE ==========

/**
 * Zeigt die Ziel-Prognose (wann wird das Zielgewicht erreicht?).
 * Berechnung kommt aus berechnung.js → berechnePrognose()
 */
function zeigePrognose(p) {
  const inhalt = document.getElementById('prognose-inhalt');

  if (p.haltegewichtModus) {
    inhalt.innerHTML = '<span style="color:#0F6E56;">Du bist in der Haltephase – kein Abnahmeziel aktiv.</span>';
    return;
  }

  const prog = berechnePrognose(p.eintraege, p.ziel);

  if (!prog && p.eintraege.length < 3) {
    inhalt.innerHTML = '<span style="color:#aaa;">Noch zu wenig Daten – bitte mehr Einträge hinzufügen.</span>';
    return;
  }
  if (!prog) {
    inhalt.innerHTML = '<span style="color:#993C1D;">Aktuell keine Abnahme erkennbar – weiter dranbleiben!</span>';
    return;
  }

  inhalt.innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:0.5px solid rgba(0,0,0,0.08);">
      <span style="color:#888;">Abnahme pro Woche</span>
      <span style="font-weight:500;">${prog.abnahmeProWoche.toFixed(2)} kg</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:0.5px solid rgba(0,0,0,0.08);">
      <span style="color:#888;">Noch ca.</span>
      <span style="font-weight:500;">${prog.restWochen} Wochen</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;">
      <span style="color:#888;">Voraussichtlich am</span>
      <span style="font-weight:500;color:#0F6E56;">${prog.zielDatum}</span>
    </div>`;
}


// ========== PLATEAU ==========

/**
 * Zeigt einen Hinweis wenn der Nutzer im Plateau steckt.
 * Berechnung kommt aus berechnung.js → berechnePlateau()
 */
function zeigePlateau(p) {
  const hinweis = document.getElementById('plateau-hinweis');
  const text    = document.getElementById('plateau-text');

  if (p.haltegewichtModus) { hinweis.classList.add('versteckt'); return; }

  const plateau = berechnePlateau(p.eintraege);
  if (!plateau) { hinweis.classList.add('versteckt'); return; }

  if (plateau.istPlateau) {
    hinweis.classList.remove('versteckt');
    text.textContent = `Du bist seit ca. 2 Wochen in einem Plateau (${plateau.schwankung.toFixed(1)} kg Schwankung). Möchtest du dein Ziel oder deine Strategie anpassen?`;
  } else {
    hinweis.classList.add('versteckt');
  }
}


// ========== ZIEL-ANPASSUNG ==========

/**
 * Scrollt zur Ziel-Anpassungs-Karte im Profil-Tab.
 */
function zeigeZielanpassung() {
  wechsleTab('profil');
  setTimeout(() => document.getElementById('ziel-anpassung-karte').scrollIntoView({ behavior: 'smooth' }), 300);
}

/**
 * Baut die Ziel-Anpassungs-Karte im Profil-Tab auf.
 */
function zeigeZielAnpassungKarte() {
  const p = aktivesProfile();
  const container = document.getElementById('ziel-anpassung-inhalt');

  container.innerHTML = `
    <div style="font-size:14px;color:#888;margin-bottom:12px;">
      Aktuelles Ziel: <strong>${p.ziel.toFixed(1)} kg</strong> &nbsp;|&nbsp;
      Modus: <strong>${p.haltegewichtModus ? 'Haltephase' : 'Abnehmen'}</strong>
    </div>

    <label>Startgewicht anpassen (kg)</label>
    <input type="number" id="neues-startgewicht" placeholder="z. B. 110" step="0.1" min="30" max="300" value="${p.start.toFixed(1)}"/>
    <button class="btn" onclick="startgewichtSpeichern()" style="margin-bottom:16px;">Startgewicht aktualisieren</button>

    <label>Neues Zielgewicht (kg)</label>
    <input type="number" id="neues-ziel" placeholder="z. B. 75" step="0.1" min="30" max="300" value="${p.ziel.toFixed(1)}"/>
    <button class="btn primaer" onclick="zielSpeichern()" style="margin-bottom:8px;">Zielgewicht aktualisieren</button>
    ${p.haltegewichtModus
      ? `<button class="btn" onclick="haltegewichtToggle(false)">Abnehmphase starten</button>`
      : `<button class="btn" onclick="haltegewichtToggle(true)">🏁 Ziel erreicht – Haltephase starten</button>`
    }`;
}


// ========== WASSER ==========

/**
 * Zeigt die Wasser-Gläser und aktualisiert sie beim Anklicken.
 * Sport-Tage bekommen automatisch 10 statt 8 Gläser als Ziel.
 */
function zeigeWasser(p) {
  const h      = heute();
  const anzahl = parseInt(localStorage.getItem('wt_wasser_' + h) || '0');

  // Ziel: Sport heute → 10 Gläser, sonst 8
  let ziel = 8;
  if (p && p.eintraege) {
    const heuteE = p.eintraege.find(e => e.datum === h);
    if (heuteE && heuteE.typen && heuteE.typen.includes('Sport')) ziel = 10;
  }

  const container = document.getElementById('wasser-gläser');
  const text      = document.getElementById('wasser-text');
  container.innerHTML = '';

  // Gläser-Buttons erzeugen
  for (let i = 0; i < ziel; i++) {
    const btn = document.createElement('button');
    btn.className = 'glas' + (i < anzahl ? ' voll' : '');
    btn.innerHTML = '&#128167;';
    const idx = i;
    btn.onclick = function() {
      // Klick auf volles Glas → leert bis dort; auf leeres → füllt bis dort
      const neu = idx < anzahl ? idx : idx + 1;
      localStorage.setItem('wt_wasser_' + h, neu);
      zeigeWasser(p);
    };
    container.appendChild(btn);
  }

  // Statustext
  if (anzahl === 0)        text.textContent = 'Noch kein Glas getrunken – los geht\'s!' + (ziel === 10 ? ' (Sport-Tag: 10 Gläser)' : '');
  else if (anzahl < ziel)  text.textContent = `${anzahl} von ${ziel} Gläsern getrunken.` + (ziel === 10 ? ' (Sport-Tag)' : '');
  else                     text.textContent = 'Super! Tagesziel erreicht! 💧';
}


// ========== VERGLEICH ==========

/**
 * Vergleicht das Gewicht an zwei gewählten Daten.
 */
function zeigeVergleich() {
  const p       = aktivesProfile();
  if (!p) return;
  const datum1  = document.getElementById('vgl-datum-1').value;
  const datum2  = document.getElementById('vgl-datum-2').value;
  const ergebnis = document.getElementById('vgl-ergebnis');

  if (!datum1 || !datum2) {
    ergebnis.innerHTML = '<span style="color:#aaa;">Bitte beide Daten auswählen.</span>';
    return;
  }

  const sortiert = [...p.eintraege].sort((a, b) => a.datum.localeCompare(b.datum));
  const e1 = sortiert.filter(e => e.datum <= datum1).pop();
  const e2 = sortiert.filter(e => e.datum <= datum2).pop();

  if (!e1 || !e2) {
    ergebnis.innerHTML = '<span style="color:#aaa;">Für einen der Zeiträume sind keine Daten vorhanden.</span>';
    return;
  }

  const diff     = e2.gewicht - e1.gewicht;
  const sign     = diff <= 0 ? '' : '+';
  const farbe    = diff <= 0 ? '#0F6E56' : '#993C1D';
  const richtung = diff <= 0 ? 'abgenommen' : 'zugenommen';

  ergebnis.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:0.5px solid rgba(0,0,0,0.08);">
      <span style="color:#888;">${e1.datum}</span><span style="font-weight:500;">${e1.gewicht.toFixed(1)} kg</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:0.5px solid rgba(0,0,0,0.08);">
      <span style="color:#888;">${e2.datum}</span><span style="font-weight:500;">${e2.gewicht.toFixed(1)} kg</span>
    </div>
    <div style="text-align:center;padding:10px 0 4px;">
      <span style="font-size:20px;font-weight:500;color:${farbe};">${sign}${diff.toFixed(1)} kg ${richtung}</span>
    </div>`;
}


// ========== DIAGRAMM ==========

/**
 * Wechselt die angezeigte Messgröße im Diagramm
 * (Gewicht, Bauch, Hüfte, Brust, Oberschenkel).
 */
function wechsleChartAnsicht(ansicht, btn) {
  aktuelleChartAnsicht = ansicht;
  document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('aktiv'));
  btn.classList.add('aktiv');

  const titel = {
    gewicht: 'Gewichtsverlauf',
    bauch: 'Bauchumfang',
    huefte: 'Hüftumfang',
    brust: 'Brustumfang',
    oberschenkel: 'Oberschenkel'
  };

  document.getElementById('chart-titel').textContent = titel[ansicht] || 'Verlauf';
  const p = aktivesProfile();
  if (p) zeigeChart(p, ansicht);
}

/**
 * Zeichnet das Liniendiagramm mit Chart.js.
 * Unterstützt Gewicht (kg) und Körpermaße (cm).
 */
function zeigeChart(p, ansicht = 'gewicht') {
  const ctx = document.getElementById('chart').getContext('2d');
  if (chart) chart.destroy();   // Altes Diagramm entfernen bevor neues gezeichnet wird

  let labels, data, einheit, farbe;

  if (ansicht === 'gewicht') {
    labels  = p.eintraege.map(e => e.datum);
    data    = p.eintraege.map(e => e.gewicht);
    einheit = 'kg';
    farbe   = '#1D9E75';
  } else {
    // Körpermaße: nur Einträge mit diesem Messwert
    const koerper = (p.koerper || []).filter(k => k[ansicht] !== null && k[ansicht] !== undefined);
    labels  = koerper.map(k => k.datum);
    data    = koerper.map(k => k[ansicht]);
    einheit = 'cm';
    farbe   = '#378ADD';

    // Keine Daten → Hinweistext zeigen
    if (data.length === 0) {
      ctx.canvas.parentElement.querySelector('canvas').style.display = 'none';
      const existing = ctx.canvas.parentElement.querySelector('.keine-daten');
      if (!existing) {
        const msg = document.createElement('p');
        msg.className = 'keine-daten';
        msg.style.cssText = 'color:#aaa;font-size:13px;text-align:center;padding:2rem 0;';
        msg.textContent = 'Noch keine Körpermaße eingetragen.';
        ctx.canvas.parentElement.appendChild(msg);
      }
      return;
    }
    ctx.canvas.style.display = '';
    const existing = ctx.canvas.parentElement.querySelector('.keine-daten');
    if (existing) existing.remove();
  }

  // Plugin: Roter vertikaler Cursor beim Hover
  const cursorPlugin = {
    id: 'cursorPlugin',
    afterDraw(chart) {
      if (chart._cursorX === undefined) return;
      const ctx2 = chart.ctx;
      ctx2.save();
      ctx2.beginPath();
      ctx2.moveTo(chart._cursorX, chart.chartArea.top);
      ctx2.lineTo(chart._cursorX, chart.chartArea.bottom);
      ctx2.lineWidth = 2;
      ctx2.strokeStyle = '#E24B4A';
      ctx2.stroke();
      ctx2.restore();
    }
  };

  // Diagramm erstellen
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: farbe,
        backgroundColor: farbe.replace(')', ',0.08)').replace('rgb', 'rgba'),
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            title: items => items[0].label,
            label: item => item.parsed.y.toFixed(1) + ' ' + einheit
          }
        }
      },
      scales: {
        y: { ticks: { font: { size: 11 }, color: '#888' }, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { ticks: { font: { size: 11 }, color: '#888', maxTicksLimit: 7 }, grid: { display: false } }
      },
      onHover: (event, elements, ch) => {
        if (event.native) {
          const rect    = ch.canvas.getBoundingClientRect();
          const clientX = event.native.touches ? event.native.touches[0].clientX : event.native.clientX;
          ch._cursorX   = clientX - rect.left;
          ch.draw();
        }
      }
    },
    plugins: [cursorPlugin]
  });

  // Eigenes Tooltip-Overlay mit Uhrzeit
  const canvas  = document.getElementById('chart');
  const tooltip = document.getElementById('chart-tooltip');

  function handleMove(e) {
    const rect    = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x       = clientX - rect.left;
    const ca      = chart.chartArea;
    if (x < ca.left || x > ca.right) return;

    const pct = (x - ca.left) / (ca.right - ca.left);
    const idx = Math.round(pct * (data.length - 1));
    const i   = Math.min(Math.max(idx, 0), data.length - 1);
    const val = data[i];
    const lbl = labels[i];

    chart._cursorX = x;
    chart.draw();

    tooltip.style.display = 'block';
    tooltip.style.left    = Math.min(x + 10, rect.width - 120) + 'px';

    const uhrzeit = (ansicht === 'gewicht' && p.eintraege[i] && p.eintraege[i].uhrzeit)
      ? ' · ' + p.eintraege[i].uhrzeit + ' Uhr'
      : '';

    tooltip.innerHTML = `<strong>${lbl}${uhrzeit}</strong><br>${parseFloat(val).toFixed(1)} ${einheit}`;
  }

  function handleLeave() {
    chart._cursorX = undefined;
    chart.draw();
    tooltip.style.display = 'none';
  }

  // Alte Event-Listener entfernen bevor neue gesetzt werden
  canvas.removeEventListener('mousemove', canvas._moveHandler);
  canvas.removeEventListener('mouseleave', canvas._leaveHandler);
  canvas._moveHandler  = handleMove;
  canvas._leaveHandler = handleLeave;
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('touchmove', e => { e.preventDefault(); handleMove(e); }, { passive: false });
  canvas.addEventListener('mouseleave', handleLeave);
  canvas.addEventListener('touchend', handleLeave);
}


// ========== VERLAUF ==========

/**
 * Baut die Liste aller Gewichtseinträge auf (neueste zuerst).
 */
function zeigeVerlauf() {
  const p      = aktivesProfile();
  const liste  = document.getElementById('verlauf-liste');
  const sortiert = [...p.eintraege].reverse();   // Neueste zuerst

  liste.innerHTML = sortiert.map((e, i) => {
    const prev = sortiert[i + 1];

    // Differenz zum vorherigen Eintrag berechnen
    let diff = '';
    if (prev) {
      const d   = (e.gewicht - prev.gewicht).toFixed(1);
      const cls = d <= 0 ? 'runter' : 'hoch';
      const sign = d <= 0 ? '' : '+';
      diff = `<div class="eintrag-diff ${cls}">${sign}${d} kg</div>`;
    }

    // Optionale Felder aufbauen
    const typen         = e.typen && e.typen.length ? `<div class="eintrag-tags">${e.typen.join(' · ')}</div>` : '';
    const stimmung      = e.stimmung ? `<div class="eintrag-tags">${e.stimmung}</div>` : '';
    const kcal          = e.kalorien ? `<div class="eintrag-tags">🍽 ${e.kalorien} kcal</div>` : '';
    const uhrzeitAnzeige = e.uhrzeit ? `<span style="font-size:11px;color:#bbb;margin-left:6px;">⏱ ${e.uhrzeit} Uhr</span>` : '';
    const notiz         = e.notiz ? `<div class="eintrag-notiz">${e.notiz}</div>` : '';

    // Originalindex für das Löschen ermitteln
    const originalIndex = p.eintraege.findIndex(x => x.datum === e.datum && x.gewicht === e.gewicht);

    return `<div class="eintrag-item">
      <div style="flex:1;">
        <div class="eintrag-datum">${e.datum}${uhrzeitAnzeige}</div>
        ${typen}${stimmung}${kcal}${notiz}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
        <div class="eintrag-gewicht">${e.gewicht.toFixed(1)} kg</div>
        ${diff}
        <button onclick="eintragLoeschen(${originalIndex})"
          style="background:none;border:none;color:#ccc;cursor:pointer;font-size:16px;padding:2px 4px;line-height:1;"
          title="Eintrag löschen">🗑</button>
      </div>
    </div>`;
  }).join('');
}


// ========== KALORIEN-VERLAUF ==========

/**
 * Zeigt die letzten 14 Tage mit Kalorien-Einträgen.
 */
function zeigeKcalVerlauf() {
  const p         = aktivesProfile();
  const container = document.getElementById('kcal-verlauf');
  const mitKcal   = [...p.eintraege].filter(e => e.kalorien).reverse().slice(0, 14);

  if (mitKcal.length === 0) {
    container.innerHTML = '<p style="color:#aaa;font-size:13px;">Noch keine Kalorien eingetragen.</p>';
    return;
  }

  container.innerHTML = mitKcal.map(e => `
    <div class="kcal-zeile">
      <span class="kcal-datum">${e.datum}</span>
      <span class="kcal-wert">${e.kalorien} kcal</span>
    </div>`).join('');
}


// ========== AKTIVITÄTSFELDER ==========

/**
 * Zeigt/versteckt die passenden Felder je nach gewählter Aktivität.
 * (Laufen → Dauer + Distanz, Krafttraining → Dauer + Gewicht, usw.)
 */
function zeigeAktivitaetFelder() {
  const typ      = document.getElementById('km-aktivitaet-typ').value;
  const felder   = document.getElementById('km-aktivitaet-felder');
  const dauer    = document.getElementById('km-feld-dauer');
  const distanz  = document.getElementById('km-feld-distanz');
  const gewicht  = document.getElementById('km-feld-gewicht');
  const schritte = document.getElementById('km-feld-schritte');

  // Alle Felder verstecken
  [dauer, distanz, gewicht, schritte].forEach(f => f.style.display = 'none');

  if (!typ) { felder.style.display = 'none'; return; }

  felder.style.display = 'block';

  // Passende Felder einblenden
  if (typ === 'laufen')       { dauer.style.display = 'block'; distanz.style.display = 'block'; }
  if (typ === 'radfahren')    { dauer.style.display = 'block'; distanz.style.display = 'block'; }
  if (typ === 'gehen')        { dauer.style.display = 'block'; distanz.style.display = 'block'; }
  if (typ === 'krafttraining'){ dauer.style.display = 'block'; gewicht.style.display = 'block'; }
  if (typ === 'schritte')     { schritte.style.display = 'block'; }
}


// ========== PROFIL-ANZEIGE ==========

/**
 * Baut die Profil-Übersichtstabelle auf.
 */
function zeigeProfil() {
  const p = aktivesProfile();
  document.getElementById('profil-details').innerHTML = `
    <p class="abschnitt">Dein Profil</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#888;">Name</td>              <td style="text-align:right;font-weight:500;">${p.name}</td></tr>
      <tr><td style="padding:6px 0;color:#888;">Größe</td>             <td style="text-align:right;font-weight:500;">${p.groesse} cm</td></tr>
      <tr><td style="padding:6px 0;color:#888;">Startgewicht</td>      <td style="text-align:right;font-weight:500;">${p.start.toFixed(1)} kg</td></tr>
      <tr><td style="padding:6px 0;color:#888;">Zielgewicht</td>       <td style="text-align:right;font-weight:500;">${p.ziel.toFixed(1)} kg</td></tr>
      <tr><td style="padding:6px 0;color:#888;">Modus</td>             <td style="text-align:right;font-weight:500;">${p.haltegewichtModus ? '🏁 Haltephase' : '💪 Abnehmen'}</td></tr>
      <tr><td style="padding:6px 0;color:#888;">Gewichts-Einträge</td> <td style="text-align:right;font-weight:500;">${p.eintraege.length}</td></tr>
    </table>`;
}


// ========== PROFIL-LISTE ==========

/**
 * Baut die Liste aller Profile auf der Profilauswahl-Seite auf.
 */
function zeigeProfilListe() {
  const profile = ladeProfile();
  const liste   = document.getElementById('profil-liste');

  if (profile.length === 0) {
    liste.innerHTML = '<p style="color:#aaa;font-size:13px;text-align:center;padding:1rem 0;">Noch kein Profil vorhanden.</p>';
    return;
  }

  liste.innerHTML = profile.map((p, i) => {
    const letzt     = p.eintraege.length ? p.eintraege[p.eintraege.length - 1].gewicht : p.start;
    const abgen     = Math.max(0, p.start - letzt).toFixed(1);
    const ini       = p.name.slice(0, 2).toUpperCase();
    const halteBadge = p.haltegewichtModus
      ? '<span style="font-size:11px;background:#e1f5ee;color:#0F6E56;border-radius:99px;padding:2px 8px;margin-left:6px;">Haltephase</span>'
      : '';

    return `<div class="profil-item" onclick="profilWaehlen(${i})">
      <div style="display:flex;align-items:center;">
        <div class="profil-avatar">${ini}</div>
        <div>
          <p style="font-size:15px;font-weight:500;">${p.name}${halteBadge}</p>
          <p style="font-size:12px;color:#888;">${parseFloat(letzt).toFixed(1)} kg &bull; ${abgen} kg abgenommen</p>
        </div>
      </div>
      <span style="color:#ccc;font-size:18px;">&#8250;</span>
    </div>`;
  }).join('');
}


// ========== TOAST-FEEDBACK ==========

/**
 * Zeigt kurz eine Rückmeldung unten am Bildschirm.
 * Verschwindet automatisch nach 2.5 Sekunden.
 *
 * @param {string} text  – Anzeigetext (z.B. "✓ Gespeichert")
 * @param {string} farbe – Hintergrundfarbe (Standard: grün)
 */
function zeigeToast(text = '✓ Gespeichert', farbe = '#0F6E56') {
  const t = document.getElementById('toast');
  t.textContent = text;
  t.style.background = farbe;
  t.classList.add('sichtbar');
  setTimeout(() => t.classList.remove('sichtbar'), 2500);
}
