"use strict";
// ── datashop-data.js ──
// Game data: coaching, validation, skills, concepts, chapters, scenarios, achievements, offices, ranks
// Depends on: datashop-engine.js (for utility functions, DB, G state, etc.)


// ── DATA ──────────────────────────────────────────────────────────
// ── FEATURE 2: COACHING FEEDBACK DETECTORS ─────────────────────────
function detectMissingFrom(sql) {
  const s = sql.trim().toLowerCase();
  if (!s.startsWith('select')) return null;
  if (/\bfrom\b/.test(s)) return null;
  return { line1: '✔ Je SELECT is goed, maar je mist een <strong>FROM</strong>-clausule.', line2: '→ Voeg toe: <code>FROM tabelnaam</code> na je kolomnamen.' };
}
function detectMissingGroupBy(sql) {
  const s = sql.trim().toLowerCase();
  if (!/\bhaving\b/.test(s)) return null;
  if (/\bgroup\s+by\b/.test(s)) return null;
  return { line1: '⚠️ <code>HAVING</code> werkt alleen <strong>samen met GROUP BY</strong>.', line2: '→ Voeg <code>GROUP BY kolom</code> toe vóór HAVING.' };
}
function detectJoinWithoutOn(sql) {
  const s = sql.trim().toLowerCase();
  if (!/\bjoin\b/.test(s)) return null;
  if (/\bon\b/.test(s)) return null;
  return { line1: '⚠️ Je hebt een <code>JOIN</code> maar geen <strong>ON</strong>-conditie.', line2: '→ Voeg toe: <code>ON tabel1.id = tabel2.id</code> na elke JOIN.' };
}
function detectUpdateWithoutWhere(sql) {
  const s = sql.trim().toLowerCase();
  if (!s.startsWith('update')) return null;
  if (/\bwhere\b/.test(s)) return null;
  return { line1: '🚨 <strong>UPDATE zonder WHERE</strong> past <em>alle rijen</em> tegelijk aan!', line2: '→ Voeg <code>WHERE kolom = waarde</code> toe om slechts één rij te targeten.' };
}
// Combineer coaching checks — max 2 lijnen tegelijk
function buildCoachFeedback(sql, sc) {
  const detectors = [
    detectMissingFrom,
    detectMissingGroupBy,
    detectJoinWithoutOn,
    detectUpdateWithoutWhere,
  ];
  for (const d of detectors) {
    const r = d(sql);
    if (r) return `<div class="coach-feedback-box"><div class="coach-line">${r.line1}</div><div class="coach-next">${r.line2}</div></div>`;
  }
  return '';
}

// ── FEATURE 3: RESULTAAT-GEBASEERDE VALIDATIE (M2 fix: expanded) ─────
// Controleert na een geslaagde check: rijen, kolommen, waarden en sortering.
function validateResult(sql, validation) {
  if (!validation) return null;
  const res = runSQL(sql);
  if (!res.ok || !res.rows) return null;
  const rows = res.rows;

  // Row count check
  if (validation.expectedRowCount !== undefined) {
    if (rows.length !== validation.expectedRowCount) {
      return `Resultaat heeft ${rows.length} rij(en), verwacht ${validation.expectedRowCount}. Controleer je WHERE-filter of JOIN.`;
    }
  }

  // Minimum / maximum row count
  if (validation.minRows !== undefined && rows.length < validation.minRows) {
    return `Te weinig rijen: ${rows.length}, minstens ${validation.minRows} verwacht.`;
  }
  if (validation.maxRows !== undefined && rows.length > validation.maxRows) {
    return `Te veel rijen: ${rows.length}, maximaal ${validation.maxRows} verwacht.`;
  }

  // Column presence check
  if (validation.expectedColumns && validation.expectedColumns.length) {
    const resultCols = rows.length ? Object.keys(rows[0]).map(c => c.toLowerCase()) : [];
    const missing = validation.expectedColumns.filter(ec => {
      const ecL = ec.toLowerCase();
      return !resultCols.some(rc => rc === ecL || rc.endsWith('.' + ecL) || rc.includes(ecL));
    });
    if (missing.length) {
      return `Kolom(men) ontbreken in resultaat: <strong>${missing.join(', ')}</strong>. Controleer je SELECT-lijst.`;
    }
  }

  // Forbidden columns (e.g. "don't select *")
  if (validation.forbiddenColumns && validation.forbiddenColumns.length && rows.length) {
    const resultCols = Object.keys(rows[0]).map(c => c.toLowerCase());
    const found = validation.forbiddenColumns.filter(fc => resultCols.includes(fc.toLowerCase()));
    if (found.length) {
      return `Kolom(men) <strong>${found.join(', ')}</strong> mogen niet in het resultaat staan. Selecteer alleen de gevraagde kolommen.`;
    }
  }

  // Expected values: check that specific cell values appear in the result
  if (validation.containsValues && validation.containsValues.length) {
    for (const { column, value } of validation.containsValues) {
      const colL = column.toLowerCase();
      const found = rows.some(r => {
        const key = Object.keys(r).find(k => k.toLowerCase() === colL);
        return key !== undefined && String(r[key]).toLowerCase() === String(value).toLowerCase();
      });
      if (!found) {
        return `Verwachte waarde <strong>${esc(String(value))}</strong> niet gevonden in kolom <strong>${esc(column)}</strong>.`;
      }
    }
  }

  // Ordering check: verify the first column (or specified column) is sorted
  if (validation.orderedBy && rows.length > 1) {
    const col = validation.orderedBy.column;
    const dir = (validation.orderedBy.direction || 'asc').toLowerCase();
    const colL = col.toLowerCase();
    const vals = rows.map(r => {
      const key = Object.keys(r).find(k => k.toLowerCase() === colL);
      return key !== undefined ? r[key] : undefined;
    });
    for (let i = 1; i < vals.length; i++) {
      const a = vals[i-1], b = vals[i];
      if (a === undefined || b === undefined) continue;
      const cmp = typeof a === 'string' ? a.localeCompare(b) : a - b;
      if (dir === 'asc' && cmp > 0) return `Resultaat is niet oplopend gesorteerd op <strong>${esc(col)}</strong>. Gebruik ORDER BY.`;
      if (dir === 'desc' && cmp < 0) return `Resultaat is niet aflopend gesorteerd op <strong>${esc(col)}</strong>. Gebruik ORDER BY ... DESC.`;
    }
  }

  // Exact column count
  if (validation.exactColumnCount !== undefined && rows.length) {
    const actual = Object.keys(rows[0]).length;
    if (actual !== validation.exactColumnCount) {
      return `Resultaat heeft ${actual} kolom(men), verwacht ${validation.exactColumnCount}. Selecteer alleen de gevraagde kolommen.`;
    }
  }

  return null; // validatie geslaagd
}

// ── FEATURE 4: SKILL MASTERY ─────────────────────────────────────────
const SKILL_TYPES = [
  { key: 'select',  label: 'SELECT',   color: '#22d3ee' },
  { key: 'where',   label: 'WHERE',    color: '#a78bfa' },
  { key: 'join',    label: 'JOIN',     color: '#f472b6' },
  { key: 'groupby', label: 'GROUP BY', color: '#fbbf24' },
  { key: 'ddl',     label: 'DDL',      color: '#4ade80' },
  { key: 'case',    label: 'CASE',     color: '#fb923c' },
];
const MASTERY_BADGES = [
  { id: 'join_specialist',   label: '🔗 Join Specialist',     skill: 'join',    threshold: 80 },
  { id: 'safe_updater',      label: '🛡️ Safe Updater',        skill: 'update',  threshold: 80 },
  { id: 'agg_master',        label: '📊 Aggregation Master',  skill: 'groupby', threshold: 80 },
  { id: 'case_wizard',       label: '🧙 Case Wizard',         skill: 'case',    threshold: 80 },
];
function skillMastery() {
  const map = {};
  SKILL_TYPES.forEach(st => {
    // Q5 fix: classify by sqlType and obj fields instead of toString() on check functions
    const matching = SCENARIOS.filter(s => {
      const obj = (s.obj||'').toLowerCase();
      if (st.key === 'select')  return s.sqlType === 'select' && !obj.includes('group') && !obj.includes('join');
      if (st.key === 'where')   return s.sqlType === 'select' && obj.includes('where');
      if (st.key === 'join')    return s.sqlType === 'join'   || obj.includes('join');
      if (st.key === 'groupby') return obj.includes('group by') || obj.includes('count') || obj.includes('sum') || obj.includes('avg');
      if (st.key === 'ddl')     return s.sqlType === 'ddl';
      if (st.key === 'case')    return obj.includes('case') || s.sqlType === 'case';
      return false;
    });
    const done   = matching.filter(s => G.done.has(s.id));
    const pct    = matching.length ? Math.round(done.length / matching.length * 100) : 0;
    map[st.key] = { done: done.length, total: matching.length, pct };
  });
  return map;
}

// ── FEATURE 7: STREAK SHIELDS ─────────────────────────────────────────
function earnStreakShield() {
  G.correctThisWeek = (G.correctThisWeek || 0) + 1;
  if (G.correctThisWeek >= 7) {
    G.streakShields = Math.min(3, (G.streakShields || 0) + 1);
    G.correctThisWeek = 0;
    UI.addEvent('info', `🛡️ Streak Shield verdiend! Je hebt er nu ${G.streakShields}.`);
  }
}
function useStreakShield() {
  if ((G.streakShields || 0) > 0) {
    G.streakShields--;
    return true;
  }
  return false;
}

const CHAPTERS = [
  {id:0,title:'🏠 H1: De Startup',unlock:0,cin:{ch:'HOOFDSTUK 1',title:'De Startup 🚀',lines:[
    {av:'👔',who:'Thomas — Adviseur',txt:'Gefeliciteerd, <strong>CEO</strong>! Je hebt €50.000 opgehaald. DataShop gaat live. Maar je klantendatabank is een puinhoop.'},
    {av:'💻',who:'System',txt:'Eerste klanten wachten. Elke fout kost <strong>reputatiepunten</strong>.'},
    {av:'🤔',who:'CEO — jij',txt:'Oké. Ik pak dit aan.',right:true},
  ]}},
  {id:1,title:'⚡ H2: Crisis Mode',unlock:6,cin:{ch:'HOOFDSTUK 2',title:'Crisis Mode 🚨',lines:[
    {av:'😱',who:'Ines — PR Manager',txt:'CEO, we hebben een crisis! Een kortingscode van 99% staat actief. <strong>Social media ontploft!</strong>'},
    {av:'📱',who:'Klantenservice',txt:'Reviews over defecte USB-C Hub komen binnen. Webcam al weken uitverkocht.'},
    {av:'🤔',who:'CEO — jij',txt:'Ik regel het. Geef me database-toegang.',right:true},
  ]}},
  {id:2,title:'🔗 H3: Data Expert',unlock:14,cin:{ch:'HOOFDSTUK 3',title:'Data Expert 🧠',lines:[
    {av:'📊',who:'Alex — Data Analyst',txt:'Investeerders willen rapporten. Welke klanten bestellen het meest? Beste categorieën?'},
    {av:'🏢',who:'Raad van Bestuur',txt:'We willen de database uitbreiden met nieuwe tabellen.'},
    {av:'🤔',who:'CEO — jij',txt:'Laat me de queries schrijven.',right:true},
  ]}},
  {id:3,title:'🧬 H4: Expert Modus',unlock:22,cin:{ch:'HOOFDSTUK 4',title:'Expert Modus 🧬',lines:[
    {av:'🤖',who:'AI Systeem',txt:'Proficiat CEO! Je beheerst de basis volledig. Tijd voor <strong>gevorderde SQL</strong>: DISTINCT, aliassen, subqueries.'},
    {av:'📈',who:'Venture Capitalist',txt:'We overwegen €500.000 te investeren. We willen rapporten die onze analistensoftware niet aankan. Imponeer ons.'},
    {av:'🤔',who:'CEO — jij',txt:'Ik schrijf queries die jullie nooit eerder gezien hebben.',right:true},
  ]}},
  {id:4,title:'🏗️ H5: Data Architect',unlock:32,cin:{ch:'HOOFDSTUK 5',title:'Data Architect 🏗️',lines:[
    {av:'🌍',who:'Boardroom',txt:'DataShop expandeert internationaal. We hebben <strong>professionele JOINs, gegroepeerde rapporten en een strakke database-architectuur</strong> nodig.'},
    {av:'🧑‍💼',who:'Lena — Lead Engineer',txt:'We schakelen over naar ANSI-standaard JOIN-syntax. Schrijf queries die echte databases aankunnen: INNER JOIN, LEFT JOIN, GROUP BY met HAVING, en DDL voor nieuwe structuren.'},
    {av:'🤔',who:'CEO — jij',txt:'Ik bouw de databank die DataShop naar de beurs brengt.',right:true},
  ]}},
];

// ── SMART CHECK HELPERS ───────────────────────────────────────────
// Normalize SQL for comparison
function norm(sql) { return sql.toLowerCase().replace(/\s+/g,' ').trim(); }
// Controleer of het resultaat rijen bevat
function hasRows(res) { return res.ok && res.rows && res.rows.length > 0; }
// Controleer of het resultaat minstens n rijen heeft
function rowCount(res, min=1) { return res.ok && res.rows && res.rows.length >= min; }
// Detect common beginner mistake: missing quotes around text
function missingQuotes(sql, val) {
  const s = sql.toLowerCase();
  return s.includes(val.toLowerCase()) && !s.includes(`'${val.toLowerCase()}'`);
}
// Geef slimme feedback bij syntaxfouten van de engine
function smartRunMsg(sql) {
  const res = runSQL(sql);
  if (res.ok) return res;
  const msg = res.msg || '';
  // Enhance generic error messages
  if (msg.includes('Controleer je SELECT')) return err('Controleer je SELECT-syntax. Vergeet geen FROM, en gebruik komma\'s tussen kolomnamen.');
  if (msg.includes('bestaat niet')) return err(msg + ' — Let op de spelling van tabelnamen (kleine letters).');
  return res;
}

// ── CONCEPT SCAFFOLDING ──────────────────────────────────────────────
// Mini-uitleg die verschijnt bij het EERSTE gebruik van een nieuw concept
const CONCEPT_INTRO = {
  select: {
    icon: '🔍',
    title: 'SELECT — Gegevens opvragen',
    body: 'Met <strong>SELECT</strong> haal je rijen op uit een tabel. De basisvorm is:<br><code>SELECT kolom1, kolom2 FROM tabel WHERE conditie</code><br>Gebruik <code>*</code> voor alle kolommen.',
    tip: 'De volgorde is altijd: SELECT → FROM → WHERE → ORDER BY → LIMIT',
  },
  insert: {
    icon: '➕',
    title: 'INSERT — Nieuwe rij toevoegen',
    body: 'Met <strong>INSERT INTO</strong> voeg je een nieuwe rij toe.<br><code>INSERT INTO tabel (kolom1, kolom2) VALUES (waarde1, waarde2)</code><br>Tekst staat altijd tussen enkele aanhalingstekens.',
    tip: 'Vermeld de kolomnamen expliciet — dan hoef je de volgorde in de tabel niet te kennen.',
  },
  update: {
    icon: '✏️',
    title: 'UPDATE — Bestaande rij wijzigen',
    body: 'Met <strong>UPDATE … SET … WHERE</strong> pas je bestaande rijen aan.<br><code>UPDATE tabel SET kolom = nieuwewaarde WHERE conditie</code>',
    tip: '⚠️ Altijd WHERE gebruiken! Zonder WHERE pas je ALLE rijen tegelijk aan.',
  },
  delete: {
    icon: '🗑️',
    title: 'DELETE — Rij(en) verwijderen',
    body: 'Met <strong>DELETE FROM … WHERE</strong> verwijder je rijen.<br><code>DELETE FROM tabel WHERE conditie</code>',
    tip: '⚠️ DELETE is onomkeerbaar. Overweeg UPDATE SET actief = 0 als alternatief.',
  },
  ddl: {
    icon: '🏗️',
    title: 'DDL — Database structuur aanpassen',
    body: 'DDL-commando\'s (Data Definition Language) wijzigen de <em>structuur</em> van de database, niet de data zelf.<br><code>CREATE TABLE naam (kolom datatype, ...)</code><br><code>ALTER TABLE naam ADD COLUMN kolom datatype</code>',
    tip: 'Bestaande rijen krijgen automatisch NULL voor een nieuwe kolom via ALTER TABLE.',
  },
  like: {
    icon: '🔎',
    title: 'LIKE — Zoeken op patroon',
    body: 'Met <strong>LIKE</strong> filter je op een tekstpatroon.<br><code>WHERE naam LIKE \'%Jan%\'</code> — bevat "Jan"<br><code>WHERE naam LIKE \'J%\'</code> — begint met J<br><code>WHERE email LIKE \'%@gmail%\'</code> — Gmail-adressen',
    tip: '% staat voor nul of meer willekeurige tekens. _ staat voor precies één teken.',
  },
  between: {
    icon: '📏',
    title: 'BETWEEN — Bereikfilter',
    body: 'Met <strong>BETWEEN a AND b</strong> filter je op een bereik — inclusief de grenzen zelf.<br><code>WHERE prijs BETWEEN 10 AND 50</code><br>Werkt ook voor datums: <code>WHERE datum BETWEEN \'2024-01-01\' AND \'2024-12-31\'</code>',
    tip: 'BETWEEN a AND b is gelijk aan: WHERE kolom >= a AND kolom <= b',
  },
  isnull: {
    icon: '🕳️',
    title: 'IS NULL — Ontbrekende waarden',
    body: 'NULL is de <em>afwezigheid</em> van een waarde. Je kan er NIET op vergelijken met =.<br><code>WHERE kolom IS NULL</code> — geen waarde ingevuld<br><code>WHERE kolom IS NOT NULL</code> — waarde wél ingevuld<br>❌ <code>WHERE kolom = NULL</code> werkt nooit!',
    tip: 'Anti-join: LEFT JOIN + WHERE rechtertabel.id IS NULL → vindt rijen die NIET in de rechtertabel staan.',
  },
  casewhen: {
    icon: '🏷️',
    title: 'CASE WHEN — Conditionele labels',
    body: 'Met <strong>CASE WHEN</strong> maak je een nieuwe kolom op basis van condities — als een if/else in SQL.<br><code>CASE WHEN stock = 0 THEN \'Uitverkocht\' WHEN stock &lt; 5 THEN \'Bijna op\' ELSE \'Op voorraad\' END AS status</code>',
    tip: 'Sluit altijd af met END. Geef de kolom een naam via AS. Gebruik ELSE als standaardwaarde.',
  },
};

// Track welke concepten de speler al gezien heeft
// Sla op in G en in localStorage, zodat de introductie maar één keer getoond wordt
function seenConcept(type) {
  if (!G.seenConcepts) G.seenConcepts = new Set();
  return G.seenConcepts.has(type);
}
function markConceptSeen(type) {
  if (!G.seenConcepts) G.seenConcepts = new Set();
  G.seenConcepts.add(type);
  save();
}

// ── CONCEPT MASTERY ───────────────────────────────────────────────
// Hoeveel missies per sqlType heeft de speler voltooid?
function conceptMastery() {
  const types = ['select','insert','update','delete','ddl'];
  return types.map(tp => {
    const all  = SCENARIOS.filter(s => s.sqlType === tp);
    const done = all.filter(s => G.done.has(s.id));
    return { type: tp, done: done.length, total: all.length, pct: all.length ? Math.round(done.length / all.length * 100) : 0 };
  });
}

// ── HOOFDSTUK RECAP ───────────────────────────────────────────────
const CHAPTER_RECAP = {
  0: {
    title: 'De Startup voltooid! 🚀',
    learned: [
      { icon: '🔍', concept: 'SELECT', desc: 'Gegevens opvragen met filters (WHERE), sortering (ORDER BY) en limieten (LIMIT).' },
      { icon: '➕', concept: 'INSERT', desc: 'Nieuwe rijen toevoegen aan een tabel met INSERT INTO … VALUES.' },
      { icon: '✏️', concept: 'UPDATE', desc: 'Bestaande rijen aanpassen met UPDATE … SET … WHERE.' },
      { icon: '🗑️', concept: 'DELETE', desc: 'Rijen verwijderen met DELETE FROM … WHERE.' },
      { icon: '🔢', concept: 'COUNT(*)', desc: 'Het aantal rijen tellen met een aggregatiefunctie.' },
    ],
    nextPreview: 'In het volgende hoofdstuk ga je complexere queries schrijven: GROUP BY, JOIN, en meer.',
  },
  1: {
    title: 'Crisis Mode overleefd! 🚨',
    learned: [
      { icon: '📊', concept: 'GROUP BY', desc: 'Rijen groeperen per waarde en aggregaten per groep berekenen.' },
      { icon: '🔗', concept: 'ALTER TABLE', desc: 'Kolommen toevoegen aan bestaande tabellen zonder data te verliezen.' },
      { icon: '⚡', concept: 'URGENT queries', desc: 'Kritische updates en deletes correct uitvoeren onder tijdsdruk.' },
    ],
    nextPreview: 'Volgende stap: tabellen samenvoegen met JOIN en geavanceerde aggregaten.',
  },
  2: {
    title: 'Data Expert bereikt! 🧠',
    learned: [
      { icon: '🔗', concept: 'JOIN', desc: 'Gegevens uit meerdere tabellen combineren via FK = PK.' },
      { icon: '👑', concept: 'HAVING', desc: 'Groepen filteren ná GROUP BY — WHERE werkt vóór groepering, HAVING erna.' },
      { icon: '🏗️', concept: 'CREATE TABLE', desc: 'Nieuwe tabellen aanmaken met kolomdefinities, datatypes en constraints.' },
      { icon: '📐', concept: 'AVG / MIN / MAX', desc: 'Gemiddelde, minimum en maximum berekenen over een kolom.' },
    ],
    nextPreview: 'Nu gevorderde technieken: DISTINCT, aliassen (AS) en subqueries.',
  },
  3: {
    title: 'Expert Modus voltooid! 🧬',
    learned: [
      { icon: '🔎', concept: 'DISTINCT', desc: 'Dubbele waarden uit het resultaat verwijderen.' },
      { icon: '🏷️', concept: 'AS (aliassen)', desc: 'Kolommen en tabellen een leesbare naam geven in de query.' },
      { icon: '🧩', concept: 'Subqueries', desc: 'Een query binnen een andere query — de binnenste wordt eerst uitgevoerd.' },
    ],
    nextPreview: 'Laatste hoofdstuk: ANSI-standaard JOINs, gecombineerde queries en professionele DDL.',
  },
  4: {
    title: 'Data Architect — Meester! 🏗️',
    learned: [
      { icon: '🔗', concept: 'INNER / LEFT JOIN', desc: 'INNER JOIN voor matches, LEFT JOIN voor alle linkerijen ook zonder match.' },
      { icon: '🌐', concept: 'Multi-tabel queries', desc: 'Drie of meer tabellen koppelen met meerdere JOINs gekettend.' },
      { icon: '🎯', concept: 'GROUP BY + HAVING', desc: 'Groeperen én filteren op groepsniveau gecombineerd.' },
      { icon: '🏛️', concept: 'Volledige DDL', desc: 'CREATE TABLE én ALTER TABLE professioneel ingezet voor database-architectuur.' },
    ],
    nextPreview: null,
  },
};

const SCENARIOS = [
  // ══ H1: De Startup ══
  {id:'new_customer',ch:0,title:'Nieuwe klant registreren',icon:'🛍️',av:'👩',who:'Klantenservice',
   story:'<strong>Sophie Vermeersch</strong> uit <strong>Gent</strong> registreerde zich net. Email: <strong>sophie@mail.be</strong>. Actief account. Voeg toe!',
   obj:'INSERT INTO klant (naam, email, stad, actief) VALUES (...)',
   diff:'easy',lpd:'LPD5',xp:50,tbl:'klant',urgent:true,time:60,
   hint:"INSERT INTO klant (naam, email, stad, actief) VALUES ('Sophie Vermeersch', 'sophie@mail.be', 'Gent', 1)",
   sqlType:'insert',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('insert')) return err(stripSolution('Gebruik INSERT INTO klant (kolommen) VALUES (waarden).'));
     if(!s.includes('klant')) return err('Vergeet de tabelnaam niet: INSERT INTO <strong>klant</strong> (...)');
     if(!s.includes('sophie')) return err('Naam "Sophie Vermeersch" ontbreekt in de VALUES.');
     if(!s.includes('sophie@mail.be')) return err('E-mailadres "sophie@mail.be" ontbreekt in de VALUES.');
     if(!s.includes('gent')) return err('Stad "Gent" ontbreekt.');
     if(missingQuotes(sql,'sophie vermeersch')) return err('Tekst moet tussen aanhalingstekens: <code>\'Sophie Vermeersch\'</code>');
     const res=runSQL(sql); if(!res.ok) return res;
     return {ok:true,type:'insert',msg:'Sophie Vermeersch toegevoegd!'};
   },
   win:'Sophie staat in de databank! 🎉'},

  {id:'price_update',ch:0,title:'Prijsaanpassing doorvoeren',icon:'💰',av:'📞',who:'Leverancier',
   story:'USB-C Hub (product_id=2) krijgt nieuwe prijs: <strong>€44.99</strong>. Pas aan vóór de webshop opent.',
   obj:'UPDATE product SET prijs = 44.99 WHERE product_id = 2',
   diff:'easy',lpd:'LPD5',xp:40,tbl:'product',time:45,
   hint:'UPDATE product SET prijs = 44.99 WHERE product_id = 2',
   sqlType:'update',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('update')) return err(stripSolution('Gebruik UPDATE product SET prijs = ... WHERE ...'));
     if(!s.includes('product')) return err('Tabel moet <strong>product</strong> zijn.');
     if(!s.includes('where')) return err('⚠️ WHERE vergeten! Zonder WHERE pas je ALLE producten aan.');
     if(!s.includes('44.99')&&!s.includes('44,99')) return err('Nieuwe prijs is <strong>44.99</strong>. Gebruik een punt als decimaalteken.');
     if(!s.includes('product_id')&&!s.includes('= 2')) return err('Voeg een <strong>WHERE</strong>-clausule toe om slechts één product bij te werken.');
     return smartRunMsg(sql);
   },
   win:'Prijs bijgewerkt. Geen verlies meer. 💶'},

  {id:'query_gent',ch:0,title:'Klanten uit Gent opzoeken',icon:'🔍',av:'📣',who:'Marketing',
   story:"Marketing wil een Gent-campagne. Geef namen en e-mails van klanten uit <strong>Gent</strong>, gesorteerd op naam.",
   obj:"SELECT naam, email FROM klant WHERE stad = 'Gent' ORDER BY naam",
   diff:'easy',lpd:'LPD4',xp:45,tbl:'klant',time:40,
   hint:"SELECT naam, email FROM klant WHERE stad = 'Gent' ORDER BY naam",
   sqlType:'select',
   validation: { expectedColumns: ['naam','email'], orderedBy: { column: 'naam', direction: 'asc' }, forbiddenColumns: ['klant_id','actief'] },
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err('Begin met SELECT.');
     if(!s.includes('from klant')) return err('Gebruik FROM klant (niet FROM product of andere tabel).');
     if(!s.includes('gent')) return err("Filter op stad = 'Gent'. Let op: tekst moet tussen aanhalingstekens!");
     if(!s.includes("'gent'")&&!s.includes('"gent"')&&s.includes('gent')) return err("Schrijf Gent tussen aanhalingstekens: WHERE stad = <code>'Gent'</code>");
     const res = runSQL(sql);
     if(!res.ok) return res;
     if(!rowCount(res)) return err("Geen resultaten gevonden. Controleer de schrijfwijze van 'Gent'.");
     return res;
   },
   win:'Lijst verstuurd! Campagne gelanceerd. 📣'},

  {id:'deactivate_gdpr',ch:0,title:'GDPR — Account deactiveren',icon:'🔒',av:'⚖️',who:'Juridische Dienst',
   story:'<strong>Kobe Janssen</strong> (klant_id=4) vraagt deactivering. GDPR verbiedt verwijdering — zet enkel <strong>actief = 0</strong>.',
   obj:'UPDATE klant SET actief = 0 WHERE klant_id = 4',
   diff:'easy',lpd:'LPD5',xp:40,tbl:'klant',time:40,
   hint:'UPDATE klant SET actief = 0 WHERE klant_id = 4',
   sqlType:'update',
   check(sql){
     const s=norm(sql);
     if(s.startsWith('delete')) return err('❌ NIET VERWIJDEREN! GDPR verplicht bewaarplicht van klantdata. Gebruik UPDATE om de klant te deactiveren.');
     if(!s.startsWith('update')) return err(stripSolution('Gebruik UPDATE klant SET actief = 0 WHERE klant_id = 4'));
     if(!s.includes('klant')) return err('Tabel is <strong>klant</strong>, niet product of bestelling.');
     if(!s.includes('where')) return err('⚠️ WHERE verplicht! Anders deactiveer je ALLE klanten.');
     if(!s.includes('4')&&!s.includes('kobe')) return err('Voeg een WHERE-clausule toe om de juiste klant te filteren.');
     if(!s.includes('actief')) return err('Gebruik SET om de actief-kolom op de juiste waarde te zetten.');
     return smartRunMsg(sql);
   },
   win:'Kobe gedeactiveerd. GDPR correct nageleefd. ✅'},

  {id:'new_product',ch:0,title:'Nieuw product toevoegen',icon:'🆕',av:'📦',who:'Inkoop',
   story:'Nieuw product: <strong>Staande Lamp LED</strong>, prijs <strong>€89.99</strong>, stock <strong>10</strong>, categorie <strong>Wonen</strong>.',
   obj:"INSERT INTO product (naam, prijs, stock, categorie) VALUES ('Staande Lamp LED', 89.99, 10, 'Wonen')",
   diff:'easy',lpd:'LPD5',xp:50,tbl:'product',time:50,
   hint:"INSERT INTO product (naam, prijs, stock, categorie) VALUES ('Staande Lamp LED', 89.99, 10, 'Wonen')",
   sqlType:'insert',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('insert')) return err(stripSolution('Gebruik INSERT INTO product (...) VALUES (...)'));
     if(!s.includes('product')) return err('Tabel is <strong>product</strong>.');
     if(!s.includes('lamp')&&!s.includes('staande')) return err('Naam "Staande Lamp LED" ontbreekt in VALUES.');
     if(!s.includes('89.99')) return err('Prijs moet <strong>89.99</strong> zijn (punt als decimaalteken).');
     if(!s.includes('wonen')) return err('Categorie "Wonen" ontbreekt.');
     const res=runSQL(sql); if(!res.ok) return res;
     return {ok:true,type:'insert',msg:'Staande Lamp LED toegevoegd!'};
   },
   win:'Staande Lamp LED live! 💡'},

  {id:'active_customers',ch:0,title:'Actieve klanten opzoeken',icon:'👥',av:'📣',who:'Marketing',
   story:"Haal alle klanten op waarbij <strong>actief = 1</strong>, gesorteerd op naam. Welke zijn er?",
   obj:"SELECT naam, email, stad FROM klant WHERE actief = 1 ORDER BY naam",
   diff:'easy',lpd:'LPD4',xp:40,tbl:'klant',time:40,
   hint:"SELECT naam, email, stad FROM klant WHERE actief = 1 ORDER BY naam",
   sqlType:'select',
   validation: { expectedColumns: ['naam','email','stad'], orderedBy: { column: 'naam', direction: 'asc' } },
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT naam, ... FROM klant WHERE actief = 1'));
     if(!s.includes('from klant')) return err('Gebruik FROM klant.');
     if(!s.includes('actief')) return err('Filter op de kolom <strong>actief</strong> om alleen actieve klanten te tonen.');
     const res = runSQL(sql);
     if(!res.ok) return res;
     if(res.rows && res.rows.some(r=>String(r.actief)==='0'||r.actief===0||r.actief===false))
       return err('Je haalt te veel klanten op. Filter op de <strong>actief</strong>-kolom om alleen actieve klanten te tonen.');
     return res;
   },
   win:'Actieve klantenlijst klaar! Campagne kan starten. 📣'},

  {id:'count_products',ch:0,title:'Hoeveel producten?',icon:'🔢',av:'📦',who:'Voorraadmanager',
   story:'Hoeveel producten staan er in de databank? Gebruik <strong>COUNT(*)</strong> om het totaal te tellen.',
   obj:'SELECT COUNT(*) FROM product',
   diff:'easy',lpd:'LPD4',xp:35,tbl:'product',time:30,
   hint:'SELECT COUNT(*) FROM product',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT COUNT(*) FROM product'));
     if(!s.includes('count')) return err(stripSolution('Gebruik <strong>COUNT(*)</strong> om te tellen. Voorbeeld: SELECT COUNT(*) FROM product'));
     if(!s.includes('product')) return err('Tel producten: gebruik FROM <strong>product</strong>.');
     return smartRunMsg(sql);
   },
   win:'Productaantal geteld. Voorraadrapport klaar! 📊'},

  // ══ H2: Crisis Mode ══
  {id:'disable_coupon',ch:1,title:'🚨 CRISIS: Kortingscode deactiveren',icon:'🎟️',av:'😱',who:'Ines — PR',
   story:'<strong>ALARM!</strong> Kortingscode <strong>FOUT999</strong> geeft 99% korting. Al 23 klanten misbruiken hem. <strong>DEACTIVEER NU!</strong>',
   obj:"UPDATE kortingscode SET actief = 0 WHERE code = 'FOUT999'",
   diff:'medium',lpd:'LPD5',xp:80,tbl:'kortingscode',urgent:true,time:30,
   hint:"UPDATE kortingscode SET actief = 0 WHERE code = 'FOUT999'",
   sqlType:'update',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('update')) return err('Gebruik UPDATE kortingscode SET actief = 0 WHERE code = \'FOUT999\'');
     if(!s.includes('kortingscode')) return err('Tabel is <strong>kortingscode</strong>.');
     if(!s.includes('where')) return err('⚠️ WHERE verplicht! Anders deactiveer je ALLE kortingscodes.');
     if(!s.includes('fout999')) return err("Filter op code = 'FOUT999'. Let op de aanhalingstekens rond de tekst.");
     if(!s.includes('actief')) return err('Gebruik SET om de actief-kolom bij te werken.');
     return smartRunMsg(sql);
   },
   win:'Crisis bezworen! FOUT999 gedeactiveerd. 🎉'},

  {id:'restock_webcam',ch:1,title:'Webcam HD bijvullen',icon:'📦',av:'🏭',who:'Logistiek',
   story:'Webcam HD (product_id=5): stock=0. 20 nieuwe exemplaren zijn binnen. Verwerk dit.',
   obj:'UPDATE product SET stock = 20 WHERE product_id = 5',
   diff:'easy',lpd:'LPD5',xp:40,tbl:'product',urgent:true,time:35,
   hint:'UPDATE product SET stock = 20 WHERE product_id = 5',
   sqlType:'update',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('update')) return err(stripSolution('Gebruik UPDATE product SET stock = 20 WHERE product_id = 5'));
     if(!s.includes('product')) return err('Tabel is <strong>product</strong>.');
     if(!s.includes('where')) return err('⚠️ WHERE verplicht! Anders pas je de stock van ALLE producten aan.');
     if(!s.includes('stock')) return err('Gebruik <strong>SET</strong> om de stock-kolom bij te werken naar de gevraagde waarde');
     if(!s.includes('5')&&!s.includes('webcam')) return err('Voeg een WHERE-clausule toe om enkel het gevraagde product te filteren.');
     return smartRunMsg(sql);
   },
   win:'Webcam HD terug in stock! 📷'},

  {id:'new_order',ch:1,title:'Bestelling verwerken',icon:'🛒',av:'📬',who:'Orderverwerking',
   story:'Jana Pieters (klant_id=1) bestelde 3× Notitieboek A5 (product_id=3) op 2024-12-01. Status: "verwerking".',
   obj:"INSERT INTO bestelling (klant_id, product_id, datum, aantal, status) VALUES (1, 3, '2024-12-01', 3, 'verwerking')",
   diff:'medium',lpd:'LPD5',xp:60,tbl:'bestelling',time:55,
   hint:"INSERT INTO bestelling (klant_id, product_id, datum, aantal, status) VALUES (1, 3, '2024-12-01', 3, 'verwerking')",
   sqlType:'insert',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('insert')) return err(stripSolution('Gebruik INSERT INTO bestelling (...) VALUES (...)'));
     if(!s.includes('bestelling')) return err('Tabel is <strong>bestelling</strong>.');
     if(!s.includes('2024-12-01')) return err('Datum 2024-12-01 ontbreekt. Schrijf datums als <code>\'2024-12-01\'</code>');
     if(!s.includes('verwerking')) return err('Status "verwerking" ontbreekt in VALUES.');
     const res=runSQL(sql); if(!res.ok) return res;
     return {ok:true,type:'insert',msg:'Bestelling verwerkt!'};
   },
   win:'Bestelling verwerkt! Jana krijgt een bevestiging. 📧'},

  {id:'count_orders',ch:1,title:'Bestellingen per klant tellen',icon:'📊',av:'📊',who:'Analytics',
   story:'Investeerders willen weten welke klanten het meest actief zijn. Gebruik GROUP BY.',
   obj:'SELECT klant_id, COUNT(*) FROM bestelling GROUP BY klant_id',
   diff:'medium',lpd:'LPD4',xp:65,tbl:'bestelling',time:60,
   hint:'SELECT klant_id, COUNT(*) FROM bestelling GROUP BY klant_id',
   sqlType:'select',
   validation: { expectedColumns: ['klant_id'], minRows: 1 },
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT klant_id, COUNT(*) FROM bestelling GROUP BY klant_id'));
     if(!s.includes('count')) return err('Gebruik <strong>COUNT(*)</strong> om bestellingen per klant te tellen.');
     if(!s.includes('bestelling')) return err('Gebruik FROM <strong>bestelling</strong>.');
     if(!s.includes('group by')) return err('Gebruik <strong>GROUP BY</strong> om per klant te groeperen.');
     if(s.includes('where')&&!s.includes('group by')) return err('Tip: gebruik GROUP BY, niet WHERE, om te groeperen.');
     return smartRunMsg(sql);
   },
   win:'Rapport klaar! Investeerders tevreden. 📈'},

  {id:'delete_test',ch:1,title:'Test-bestellingen opruimen',icon:'🗑️',av:'🔍',who:'Auditor',
   story:'Testbestellingen van vóór 2024-11-12 moeten weg. Altijd WHERE bij DELETE!',
   obj:"DELETE FROM bestelling WHERE datum < '2024-11-12'",
   diff:'medium',lpd:'LPD5',xp:60,tbl:'bestelling',time:50,
   hint:"DELETE FROM bestelling WHERE datum < '2024-11-12'",
   sqlType:'delete',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('delete')) return err('Gebruik DELETE FROM bestelling WHERE datum < \'2024-11-12\'');
     if(!s.includes('bestelling')) return err('Tabel is <strong>bestelling</strong>.');
     if(!s.includes('where')) return err('⚠️ WHERE verplicht bij DELETE! Zonder WHERE verwijder je ALLE bestellingen.');
     if(!s.includes('datum')) return err('Filter op de kolom <strong>datum</strong>. Bestellingen vóór 2024-11-12 moeten weg.');
     if(!s.includes('2024')) return err('Voeg de datum 2024-11-12 toe als grens: WHERE datum < \'2024-11-12\'');
     return smartRunMsg(sql);
   },
   win:'Testdata verwijderd. Database proper voor het fiscale jaar. 🧹'},

  {id:'add_telefoon',ch:1,title:'Telefoon: kolom aanmaken & controleren',icon:'📵',av:'📞',who:'Klantenservice Chef',
   story:'Stap 1: Voeg kolom <strong>telefoon VARCHAR(20)</strong> toe aan <strong>klant</strong>. Stap 2: Zoek daarna alle klanten waarbij <strong>telefoon IS NULL</strong> — dat zijn de klanten die nog gebeld moeten worden.',
   obj:'Stap 1: ALTER TABLE klant ADD COLUMN telefoon · Stap 2: SELECT ... WHERE telefoon IS NULL',
   diff:'medium',lpd:'LPD3',xp:80,tbl:'klant',time:70,
   sqlType:'ddl',
   hint:'ALTER TABLE klant ADD COLUMN telefoon VARCHAR(20)',
   steps:[
     {
       label:'ALTER TABLE — kolom aanmaken',
       sqlType:'ddl',
       placeholder:'ALTER TABLE klant ADD COLUMN telefoon VARCHAR(20)',
       hint:'ALTER TABLE klant ADD COLUMN telefoon VARCHAR(20)',
       check(sql){
         const s=norm(sql);
         if(!s.startsWith('alter')) return err('Begin met <strong>ALTER TABLE klant</strong>.');
         if(!s.includes('klant')) return err('Pas tabel <strong>klant</strong> aan.');
         if(!s.includes('add')) return err('Gebruik <strong>ADD COLUMN</strong> om een kolom toe te voegen.');
         if(!s.includes('telefoon')) return err('De kolom heet <strong>telefoon</strong>.');
         if(!s.includes('varchar')&&!s.includes('text')) return err('Gebruik <strong>VARCHAR(20)</strong> als datatype.');
         const res=runSQL(sql); if(!res.ok) return res;
         return {ok:true,type:'ddl',msg:'Kolom telefoon toegevoegd! Alle klanten hebben nu telefoon = NULL.'};
       },
       successMsg:'Kolom bestaat nu. Merk op: alle bestaande klanten krijgen automatisch NULL. Gebruik dat nu in stap 2.',
     },
     {
       label:'SELECT IS NULL — wie heeft nog geen nummer?',
       sqlType:'select',
       placeholder:'SELECT naam, email FROM klant WHERE telefoon IS NULL',
       hint:'SELECT naam, email\nFROM klant\nWHERE telefoon IS NULL',
       check(sql){
         const s=norm(sql);
         if(!s.startsWith('select')) return err('Begin met <strong>SELECT naam, email FROM klant</strong>.');
         if(!s.includes('telefoon')) return err('Filter op de kolom <strong>telefoon</strong>.');
         if(s.includes('= null')||s.includes('=null')) return err('❌ <code>= NULL</code> werkt nooit! Gebruik <strong>IS NULL</strong>.');
         if(!s.includes('is null')) return err('Gebruik <strong>IS NULL</strong> — nooit = NULL!');
         const res=runSQL(sql); if(!res.ok) return res;
         return res;
       },
     },
   ],
   win:'Kolom aangemaakt én NULL-controle geslaagd! Het outreach-team weet nu wie gebeld moet worden. ☎️'},

  {id:'low_stock',ch:1,title:'Producten met lage stock',icon:'⚠️',av:'🏭',who:'Logistiek',
   story:'Welke producten hebben een <strong>stock van minder dan 5</strong>? Maak een urgentielijst — inclusief stock=0!',
   obj:'SELECT naam, stock FROM product WHERE stock < 5 ORDER BY stock ASC',
   diff:'medium',lpd:'LPD4',xp:55,tbl:'product',time:40,
   hint:'SELECT naam, stock FROM product WHERE stock < 5 ORDER BY stock ASC',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT naam, stock FROM product WHERE stock < 5'));
     if(!s.includes('product')) return err('Gebruik FROM <strong>product</strong>.');
     if(!s.includes('stock')) return err('Filter op de kolom <strong>stock</strong> met de juiste drempelwaarde.');
     if(!s.includes('<')&&!s.includes('<=4')&&!s.includes('<= 4')) return err('Gebruik de operator < (kleiner dan): WHERE stock <strong>&lt;</strong> 5');
     const res = runSQL(sql);
     if(!res.ok) return res;
     if(res.rows&&res.rows.some(r=>Number(r.stock)>=5)) return err('Je filtert te ruim. Controleer je drempelwaarde in de WHERE-clausule.');
     return res;
   },
   win:'Urgentielijst klaar! Bestelling geplaatst bij leverancier. 📦'},

  {id:'update_order_status',ch:1,title:'Bestellingsstatus bijwerken',icon:'🚚',av:'🚚',who:'Leveringsdienst',
   story:'Bestelling 4 (status "onderweg") is aangekomen! Zet status op <strong>"geleverd"</strong>.',
   obj:"UPDATE bestelling SET status = 'geleverd' WHERE bestelling_id = 4",
   diff:'medium',lpd:'LPD5',xp:50,tbl:'bestelling',time:40,
   hint:"UPDATE bestelling SET status = 'geleverd' WHERE bestelling_id = 4",
   sqlType:'update',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('update')) return err('Gebruik UPDATE bestelling SET status = \'geleverd\' WHERE bestelling_id = 4');
     if(!s.includes('bestelling')) return err('Tabel is <strong>bestelling</strong>.');
     if(!s.includes('where')) return err('⚠️ WHERE verplicht! Anders update je ALLE bestellingen.');
     if(!s.includes('geleverd')) return err('Status moet <strong>"geleverd"</strong> zijn. Schrijf: SET status = \'geleverd\'');
     if(!s.includes('4')&&!s.includes('bestelling_id')) return err('Voeg een WHERE-clausule toe om slechts één bestelling bij te werken.');
     return smartRunMsg(sql);
   },
   win:'Bestelling gemarkeerd als geleverd! Klant krijgt bevestiging. ✅'},

  // ══ H3: Data Expert ══
  {id:'create_leverancier',ch:2,title:'Leverancier: tabel aanmaken & eerste rij invoegen',icon:'🏗️',av:'🤝',who:'Inkoopmanager',
   story:'DataShop werkt samen met externe leveranciers. Stap 1: Maak tabel <strong>leverancier</strong> aan (leverancier_id PK AUTO, naam NOT NULL, email, land). Stap 2: Voeg eerste leverancier toe: <strong>TechParts BV</strong>, info@techparts.be, Belgie.',
   obj:'Stap 1: CREATE TABLE leverancier · Stap 2: INSERT INTO leverancier',
   diff:'hard',lpd:'LPD3',xp:110,tbl:null,time:120,
   sqlType:'ddl',
   hint:'CREATE TABLE leverancier (\n  leverancier_id INT PRIMARY KEY AUTO_INCREMENT,\n  naam VARCHAR(100) NOT NULL,\n  email VARCHAR(150),\n  land VARCHAR(80)\n)',
   steps:[
     {
       label:'CREATE TABLE leverancier',
       sqlType:'ddl',
       placeholder:'CREATE TABLE leverancier (...)',
       hint:'CREATE TABLE leverancier (\n  leverancier_id INT PRIMARY KEY AUTO_INCREMENT,\n  naam VARCHAR(100) NOT NULL,\n  email VARCHAR(150),\n  land VARCHAR(80)\n)',
       check(sql){
         const s=norm(sql);
         if(!s.startsWith('create table')) return err('Begin met <strong>CREATE TABLE leverancier</strong> (...)');
         if(!s.includes('leverancier')) return err('Noem de tabel <strong>leverancier</strong>.');
         if(!s.includes('primary key')) return err('Voeg <strong>PRIMARY KEY</strong> toe aan het ID-veld.');
         if(!s.includes('naam')) return err('Kolom <strong>naam</strong> ontbreekt. Vergeet NOT NULL niet.');
         return smartRunMsg(sql);
       },
       successMsg:'Tabel aangemaakt! Nu kun je er meteen data in zetten.',
     },
     {
       label:'INSERT INTO leverancier',
       sqlType:'insert',
       placeholder:"INSERT INTO leverancier (naam, email, land) VALUES (...)",
       hint:"INSERT INTO leverancier (naam, email, land)\nVALUES ('TechParts BV', 'info@techparts.be', 'Belgie')",
       check(sql){
         const s=norm(sql);
         if(!s.startsWith('insert')) return err('Begin met <strong>INSERT INTO leverancier</strong>.');
         if(!s.includes('leverancier')) return err('Voeg in in tabel <strong>leverancier</strong>.');
         if(!s.includes('techparts')) return err('Naam "TechParts BV" ontbreekt.');
         if(!s.includes('info@techparts.be')) return err('E-mailadres "info@techparts.be" ontbreekt.');
         if(!s.includes('belgi')) return err('Land "Belgie" ontbreekt.');
         return smartRunMsg(sql);
       },
     },
   ],
   win:'Tabel aangemaakt en eerste leverancier geregistreerd! DataShop is klaar voor partnerships. 🤝'},

  {id:'avg_review',ch:2,title:'Gemiddelde reviewscore',icon:'⭐',av:'📊',who:'Productmanager',
   story:'Bereken de <strong>gemiddelde score</strong> van alle reviews. Gebruik AVG().',
   obj:'SELECT AVG(score) FROM review',
   diff:'medium',lpd:'LPD4',xp:55,tbl:'review',time:35,
   hint:'SELECT AVG(score) FROM review',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT AVG(score) FROM review'));
     if(!s.includes('avg')) return err('Gebruik de <strong>AVG()</strong>-functie om het gemiddelde te berekenen.');
     if(!s.includes('review')) return err('Gebruik FROM <strong>review</strong> (daar staan de scores).');
     if(!s.includes('score')&&!s.includes('*')) return err('Bereken het gemiddelde van de score-kolom met de juiste aggregatiefunctie.');
     return smartRunMsg(sql);
   },
   win:'Gemiddelde score berekend. ⭐'},

  {id:'expensive',ch:2,title:'Premium producten raadplegen',icon:'💎',av:'📈',who:'CFO',
   story:'Lijst van producten duurder dan <strong>€50</strong>, duurste eerst, voor marge-analyse.',
   obj:'SELECT naam, prijs FROM product WHERE prijs > 50 ORDER BY prijs DESC',
   diff:'easy',lpd:'LPD4',xp:45,tbl:'product',time:45,
   hint:'SELECT naam, prijs FROM product WHERE prijs > 50 ORDER BY prijs DESC',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT naam, prijs FROM product WHERE prijs > 50 ORDER BY prijs DESC'));
     if(!s.includes('product')) return err('Gebruik FROM <strong>product</strong>.');
     if(!s.includes('50')) return err('Filter op prijs > 50. Vergeet het getal 50 niet.');
     if(!s.includes('>')) return err('Gebruik een vergelijkingsoperator in je WHERE-clausule om op prijs te filteren.');
     const res = runSQL(sql);
     if(!res.ok) return res;
     if(res.rows&&res.rows.some(r=>Number(r.prijs)<=50)) return err('Je lijst bevat ook producten van €50 of minder. Gebruik > (niet >=).');
     return res;
   },
   win:'CFO heeft zijn rapport. Marges goed! 💰'},

  {id:'join_orders',ch:2,title:'JOIN — Bestellingen met klantnamen',icon:'🔗',av:'📊',who:'Analytics',
   story:'Logistiek wil klantnamen, datum en status. Twee tabellen: klant en bestelling. Gebruik impliciete JOIN.',
   obj:'SELECT k.naam, b.datum, b.status FROM bestelling b, klant k WHERE b.klant_id = k.klant_id',
   diff:'hard',lpd:'LPD4',xp:110,tbl:null,time:90,
   hint:'SELECT k.naam, b.datum, b.status\nFROM bestelling b, klant k\nWHERE b.klant_id = k.klant_id',
   sqlType:'join',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT ... FROM bestelling, klant WHERE ...'));
     if(!s.includes('bestelling')) return err('Vergeet tabel <strong>bestelling</strong> niet in FROM.');
     if(!s.includes('klant')) return err('Vergeet tabel <strong>klant</strong> niet in FROM.');
     if(!s.includes('klant_id')) return err('Koppel de tabellen via <strong>klant_id</strong>: WHERE b.klant_id = k.klant_id');
     if(!s.includes('=')&&!s.includes('klant_id')) return err('JOIN-voorwaarde ontbreekt: WHERE b.klant_id = k.klant_id');
     const res = smartRunMsg(sql);
     if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten. Controleer je JOIN-voorwaarde: b.klant_id = k.klant_id');
     return res;
   },
   win:'JOIN geslaagd! Logistiek heeft overzicht. 🔗'},

  {id:'having',ch:2,title:'VIP-klanten (HAVING)',icon:'👑',av:'🎯',who:'Marketing Director',
   story:'VIP-programma voor klanten met <strong>méér dan 1 bestelling</strong>. Gebruik HAVING.',
   obj:'SELECT klant_id, COUNT(*) FROM bestelling GROUP BY klant_id HAVING COUNT(*) > 1',
   diff:'hard',lpd:'LPD4',xp:110,tbl:'bestelling',time:80,
   hint:'SELECT klant_id, COUNT(*) FROM bestelling GROUP BY klant_id HAVING COUNT(*) > 1',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT klant_id, COUNT(*) FROM bestelling GROUP BY klant_id HAVING COUNT(*) > 1'));
     if(!s.includes('count')) return err('Gebruik <strong>COUNT(*)</strong> om bestellingen per klant te tellen.');
     if(!s.includes('group by')) return err('Gebruik <strong>GROUP BY</strong> om per klant te groeperen.');
     if(!s.includes('having')) return err(stripSolution('Gebruik <strong>HAVING</strong> (niet WHERE) om op groepsresultaten te filteren. HAVING COUNT(*) > 1'));
     if(s.includes('where count')) return err(stripSolution('Gebruik HAVING om op COUNT() te filteren, niet WHERE. WHERE werkt vóór groepering, HAVING erna.'));
     return smartRunMsg(sql);
   },
   win:'VIP-lijst klaar! Jana Pieters is onze trouwste klant. 👑'},

  {id:'max_stock',ch:2,title:'Product met meeste voorraad',icon:'📈',av:'🏭',who:'Warehouse',
   story:'Welk product heeft de <strong>hoogste stock</strong>? Gebruik ORDER BY + LIMIT 1.',
   obj:'SELECT naam, stock FROM product ORDER BY stock DESC LIMIT 1',
   diff:'hard',lpd:'LPD4',xp:80,tbl:'product',time:50,
   hint:'SELECT naam, stock FROM product ORDER BY stock DESC LIMIT 1',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT naam, stock FROM product ORDER BY stock DESC LIMIT 1'));
     if(!s.includes('product')) return err('Gebruik FROM <strong>product</strong>.');
     if(!s.includes('stock')) return err('Je hebt kolom <strong>stock</strong> nodig.');
     const hasMax = s.includes('max(stock)');
     const hasOrderLimit = s.includes('order by')&&s.includes('limit')&&s.includes('desc');
     if(!hasMax&&!hasOrderLimit) return err(stripSolution('Gebruik ORDER BY stock DESC LIMIT 1 om het hoogste te vinden. Of gebruik MAX(stock).'));
     return smartRunMsg(sql);
   },
   win:'Notitieboek A5 heeft hoogste stock. Opslag geoptimaliseerd! 📦'},

  {id:'products_per_category',ch:2,title:'Producten per categorie',icon:'🗂️',av:'📊',who:'Product Manager',
   story:"Investeerders willen weten hoeveel producten per <strong>categorie</strong> we hebben. Gebruik <strong>GROUP BY</strong>.",
   obj:'SELECT categorie, COUNT(*) FROM product GROUP BY categorie',
   diff:'medium',lpd:'LPD4',xp:70,tbl:'product',time:55,
   hint:'SELECT categorie, COUNT(*) FROM product GROUP BY categorie',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT categorie, COUNT(*) FROM product GROUP BY categorie'));
     if(!s.includes('categorie')) return err('Selecteer de <strong>categorie</strong>-kolom en groepeer erop.');
     if(!s.includes('count')) return err('Gebruik <strong>COUNT(*)</strong> om het aantal per categorie te tellen.');
     if(!s.includes('group by')) return err('Gebruik <strong>GROUP BY</strong> om per categorie te groeperen.');
     return smartRunMsg(sql);
   },
   win:'Categorieoverzicht klaar. Elektronica domineert! 🏆'},

  {id:'min_max_prijs',ch:2,title:'Goedkoopste & duurste product',icon:'💰',av:'💼',who:'CFO',
   story:'De CFO wil de <strong>goedkoopste</strong> én <strong>duurste</strong> prijs weten in één query. Gebruik MIN() en MAX().',
   obj:'SELECT MIN(prijs), MAX(prijs) FROM product',
   diff:'medium',lpd:'LPD4',xp:60,tbl:'product',time:35,
   hint:'SELECT MIN(prijs), MAX(prijs) FROM product',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT MIN(prijs), MAX(prijs) FROM product'));
     if(!s.includes('min')) return err('Gebruik de juiste aggregatiefunctie voor de goedkoopste prijs.');
     if(!s.includes('max')) return err('Voeg ook de aggregatiefunctie voor de duurste prijs toe in dezelfde SELECT.');
     if(!s.includes('product')) return err('Gebruik FROM <strong>product</strong>.');
     return smartRunMsg(sql);
   },
   win:'Prijsbereik bepaald. Perfecte input voor de winststrategie! 💶'},

  {id:'join_all',ch:2,title:'Megaoverzicht: klant + bestelling + product',icon:'🌐',av:'🌐',who:'Raad van Bestuur',
   story:'De Raad van Bestuur wil <strong>één overzicht</strong>: klantnaam, productnaam en datum. Koppel drie tabellen.',
   obj:'SELECT k.naam, p.naam, b.datum FROM bestelling b, klant k, product p WHERE b.klant_id = k.klant_id AND b.product_id = p.product_id',
   diff:'hard',lpd:'LPD4',xp:130,tbl:null,time:120,
   hint:'SELECT k.naam, p.naam, b.datum\nFROM bestelling b, klant k, product p\nWHERE b.klant_id = k.klant_id\nAND b.product_id = p.product_id',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT ... FROM bestelling, klant, product WHERE ...'));
     if(!s.includes('bestelling')) return err('Voeg tabel <strong>bestelling</strong> toe aan FROM.');
     if(!s.includes('klant')) return err('Voeg tabel <strong>klant</strong> toe aan FROM.');
     if(!s.includes('product')) return err('Voeg tabel <strong>product</strong> toe aan FROM.');
     if(!s.includes('klant_id')) return err('Koppel bestelling ↔ klant via <strong>klant_id</strong>: b.klant_id = k.klant_id');
     if(!s.includes('product_id')) return err('Koppel bestelling ↔ product via <strong>product_id</strong>: b.product_id = p.product_id');
     const res = runSQL(sql);
     if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten. Controleer beide JOIN-voorwaarden.');
     return res;
   },
   win:'Megaoverzicht geleverd! De raad is onder de indruk. 🌐'},

  // ══ H4: Expert Mode ══
  {id:'distinct_steden',ch:3,title:'Unieke steden (DISTINCT)',icon:'🏙️',av:'📣',who:'Marketing',
   story:'Marketing wil weten in welke <strong>unieke steden</strong> onze klanten wonen — zonder duplicaten. Gebruik <strong>DISTINCT</strong>.',
   obj:'SELECT DISTINCT stad FROM klant',
   diff:'easy',lpd:'LPD4',xp:50,tbl:'klant',time:35,
   hint:'SELECT DISTINCT stad FROM klant',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err('Begin met SELECT DISTINCT stad FROM klant');
     if(!s.includes('distinct')) return err('Gebruik het sleutelwoord <strong>DISTINCT</strong> om duplicaten te verwijderen: SELECT DISTINCT stad FROM klant');
     if(!s.includes('stad')) return err('Selecteer de kolom <strong>stad</strong>.');
     if(!s.includes('klant')) return err('Gebruik FROM <strong>klant</strong>.');
     const res = runSQL(sql);
     if(!res.ok) return res;
     // Check no duplicates
     const vals = res.rows.map(r=>r.stad);
     if(new Set(vals).size !== vals.length) return err('Er zitten nog duplicaten in het resultaat. Gebruik DISTINCT.');
     return res;
   },
   win:'Unieke steden gevonden! Campagne per regio kan starten. 🗺️'},

  {id:'alias_products',ch:3,title:'Kolomaliassen gebruiken (AS)',icon:'🏷️',av:'💼',who:'CFO',
   story:'Het rapport moet leesbare kolomnamen bevatten. Noem <strong>naam</strong> om als <strong>product</strong> en <strong>prijs</strong> als <strong>verkoopprijs</strong>. Gebruik het sleutelwoord <strong>AS</strong>.',
   obj:"SELECT naam AS product, prijs AS verkoopprijs FROM product ORDER BY verkoopprijs DESC",
   diff:'easy',lpd:'LPD4',xp:55,tbl:'product',time:45,
   hint:'SELECT naam AS product, prijs AS verkoopprijs FROM product ORDER BY verkoopprijs DESC',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err('Begin met SELECT naam AS product, prijs AS verkoopprijs FROM product');
     if(!s.includes(' as ')) return err('Gebruik het sleutelwoord <strong>AS</strong> voor aliassen: naam AS product');
     if(!s.includes('product')&&!s.includes('naam')) return err('Gebruik kolom <strong>naam</strong> met alias <strong>product</strong>: naam AS product');
     if(!s.includes('prijs')&&!s.includes('verkoopprijs')) return err('Gebruik kolom <strong>prijs</strong> met alias <strong>verkoopprijs</strong>: prijs AS verkoopprijs');
     const res = runSQL(sql);
     if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten.');
     const cols = res.rows.length ? Object.keys(res.rows[0]) : [];
     if(!cols.some(c=>c.toLowerCase().includes('product')||c.toLowerCase().includes('naam')))
       return err('Kolomnaam "product" niet gevonden in resultaat. Gebruik: naam AS product');
     return res;
   },
   win:'Rapport met leesbare kolomnamen klaar! CFO tevreden. 📋'},

  {id:'subquery_above_avg',ch:3,title:'Producten boven gemiddelde prijs',icon:'📊',av:'📈',who:'Pricing Team',
   story:'Welke producten kosten <strong>meer dan de gemiddelde prijs</strong>? Los dit op met een <strong>subquery</strong> in de WHERE-clausule.',
   obj:'SELECT naam, prijs FROM product WHERE prijs > (SELECT AVG(prijs) FROM product)',
   diff:'hard',lpd:'LPD4',xp:120,tbl:'product',time:100,
   hint:'SELECT naam, prijs FROM product WHERE prijs > (SELECT AVG(prijs) FROM product)',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT naam, prijs FROM product WHERE prijs > (SELECT AVG(prijs) FROM product)'));
     if(!s.includes('product')) return err('Gebruik FROM <strong>product</strong>.');
     if(!s.includes('avg')) return err(stripSolution('Gebruik een subquery met <strong>AVG(prijs)</strong> als drempel: WHERE prijs > (SELECT AVG(prijs) FROM product)'));
     if(!s.includes('(select')) return err(stripSolution('Gebruik een subquery tussen haakjes: WHERE prijs > <strong>(SELECT AVG(prijs) FROM product)</strong>'));
     const res = runSQL(sql);
     if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten. Is de subquery correct?');
     // Valideer: alle teruggegeven prijzen moeten boven het gemiddelde liggen
     const avg = DB.product.rows.reduce((s,r)=>s+r.prijs,0)/DB.product.rows.length;
     if(res.rows.some(r=>Number(r.prijs)<=avg)) return err('Resultaat bevat producten onder het gemiddelde. Controleer de WHERE-conditie.');
     return res;
   },
   win:'Subquery geslaagd! Premium producten geïdentificeerd. 🏆'},

  {id:'subquery_in',ch:3,title:'Klanten die ooit besteld hebben',icon:'🛒',av:'📊',who:'Analytics',
   story:'Welke klanten hebben <strong>minstens één bestelling</strong> geplaatst? Gebruik een subquery met <strong>IN</strong> om klant_id\'s op te zoeken in de bestelling-tabel.',
   obj:'SELECT naam, email FROM klant WHERE klant_id IN (SELECT klant_id FROM bestelling)',
   diff:'hard',lpd:'LPD4',xp:120,tbl:null,time:100,
   hint:'SELECT naam, email FROM klant WHERE klant_id IN (SELECT klant_id FROM bestelling)',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT naam, email FROM klant WHERE klant_id IN (SELECT klant_id FROM bestelling)'));
     if(!s.includes('klant')) return err('Gebruik FROM <strong>klant</strong> voor de buitenste query.');
     if(!s.includes('bestelling')) return err('De subquery moet FROM <strong>bestelling</strong> bevatten om klant_id\'s op te zoeken.');
     if(!s.includes(' in ')) return err(stripSolution('Gebruik het sleutelwoord <strong>IN</strong>: WHERE klant_id IN (SELECT klant_id FROM bestelling)'));
     if(!s.includes('(select')) return err(stripSolution('Gebruik een subquery: WHERE klant_id IN <strong>(SELECT klant_id FROM bestelling)</strong>'));
     const res = runSQL(sql);
     if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten. Controleer de subquery.');
     return res;
   },
   win:'Klanten met bestellingen gevonden via subquery! Gerichte marketing mogelijk. 📧'},

  {id:'distinct_count',ch:3,title:'Hoeveel unieke steden?',icon:'🔢',av:'📣',who:'Marketing Director',
   story:'Hoeveel <strong>verschillende steden</strong> zijn er in de klantendatabank? Gebruik <strong>COUNT(DISTINCT stad)</strong> om unieke steden te tellen.',
   obj:'SELECT COUNT(DISTINCT stad) FROM klant',
   diff:'medium',lpd:'LPD4',xp:70,tbl:'klant',time:40,
   hint:'SELECT COUNT(DISTINCT stad) FROM klant',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT COUNT(DISTINCT stad) FROM klant'));
     if(!s.includes('count')) return err('Gebruik <strong>COUNT()</strong> om te tellen.');
     if(!s.includes('distinct')) return err('Gebruik <strong>DISTINCT</strong> binnen COUNT om enkel unieke steden te tellen: COUNT(DISTINCT stad)');
     if(!s.includes('stad')) return err('Tel de kolom <strong>stad</strong>: COUNT(DISTINCT stad)');
     if(!s.includes('klant')) return err('Gebruik FROM <strong>klant</strong>.');
     return smartRunMsg(sql);
   },
   win:'Unieke steden geteld! Marketinggebieden bepaald. 🗺️'},

  {id:'join_alias_order',ch:3,title:'JOIN met aliassen en sortering',icon:'🔗',av:'🌐',who:'Raad van Bestuur',
   story:'Overzicht van alle bestellingen: <strong>klantnaam als "klant"</strong>, <strong>productnaam als "artikel"</strong>, datum gesorteerd van nieuwste naar oudste. Combineer JOIN + AS + ORDER BY.',
   obj:'SELECT k.naam AS klant, p.naam AS artikel, b.datum FROM bestelling b, klant k, product p WHERE b.klant_id = k.klant_id AND b.product_id = p.product_id ORDER BY b.datum DESC',
   diff:'hard',lpd:'LPD4',xp:140,tbl:null,time:120,
   hint:'SELECT k.naam AS klant, p.naam AS artikel, b.datum\nFROM bestelling b, klant k, product p\nWHERE b.klant_id = k.klant_id AND b.product_id = p.product_id\nORDER BY b.datum DESC',
   sqlType:'join',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err('Begin met SELECT k.naam AS klant, p.naam AS artikel, b.datum FROM ...');
     if(!s.includes('bestelling')) return err('Voeg <strong>bestelling</strong> toe aan FROM.');
     if(!s.includes('klant')) return err('Voeg <strong>klant</strong> toe aan FROM.');
     if(!s.includes('product')) return err('Voeg <strong>product</strong> toe aan FROM.');
     if(!s.includes('klant_id')) return err('Koppelconditie ontbreekt: b.klant_id = k.klant_id');
     if(!s.includes('product_id')) return err('Koppelconditie ontbreekt: b.product_id = p.product_id');
     if(!s.includes('order by')) return err('Sorteer op datum in aflopende volgorde (nieuwste eerst)');
     const res = runSQL(sql);
     if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten. Controleer de JOIN-voorwaarden.');
     return res;
   },
   win:'Meesterwerk! JOIN + AS + ORDER BY in één query. Raad van Bestuur staat te klappen. 👏'},

  // ══ H5: Data Architect ══
  {id:'inner_join_basic',ch:4,title:'INNER JOIN: klanten en bestellingen',icon:'🔗',av:'🧑‍💼',who:'Lena — Lead Engineer',
   story:'Tijd voor de ANSI-standaard! Haal alle klanten op <strong>samen met hun besteldatum</strong> via een <strong>INNER JOIN</strong>. Alleen klanten die besteld hebben verschijnen in het resultaat.',
   obj:'SELECT klant.naam, bestelling.datum FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id',
   diff:'easy',lpd:'LPD4',xp:60,tbl:null,time:90,
   hint:'SELECT klant.naam, bestelling.datum\nFROM klant\nINNER JOIN bestelling ON klant.klant_id = bestelling.klant_id',
   sqlType:'join',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT klant.naam, bestelling.datum FROM klant INNER JOIN bestelling ...'));
     if(!s.includes('inner join')&&!s.includes('join')) return err('Gebruik <strong>INNER JOIN</strong> om de tabellen te koppelen: FROM klant INNER JOIN bestelling');
     if(!s.includes('on')) return err('Voeg een <strong>ON</strong>-conditie toe om de tabellen te koppelen via de gemeenschappelijke sleutel.');
     if(!s.includes('klant_id')) return err('Koppel de tabellen via het gemeenschappelijke <strong>klant_id</strong>-veld.');
     const res=runSQL(sql); if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten. Controleer de ON-conditie.');
     return res;
   },
   win:'Perfecte INNER JOIN! Enkel klanten met bestellingen zichtbaar. ANSI-syntax onder de knie. ✅'},

  {id:'left_join_all',ch:4,title:'LEFT JOIN: ook klanten zonder bestelling',icon:'⬅️',av:'📊',who:'Alex — Data Analyst',
   story:'We willen <strong>ALLE klanten</strong> zien, ook wie nog nooit iets besteld heeft. Gebruik een <strong>LEFT JOIN</strong> zodat klanten zonder bestelling ook verschijnen (met NULL als datum).',
   obj:'SELECT klant.naam, bestelling.datum FROM klant LEFT JOIN bestelling ON klant.klant_id = bestelling.klant_id',
   diff:'easy',lpd:'LPD4',xp:70,tbl:null,time:90,
   hint:'SELECT klant.naam, bestelling.datum\nFROM klant\nLEFT JOIN bestelling ON klant.klant_id = bestelling.klant_id',
   sqlType:'join',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT klant.naam, bestelling.datum FROM klant LEFT JOIN ...'));
     if(!s.includes('left join')) return err('Gebruik <strong>LEFT JOIN</strong> (niet INNER JOIN) om ook klanten zonder bestelling te tonen.');
     if(!s.includes('on')) return err('Voeg een <strong>ON</strong>-conditie toe om de tabellen te koppelen via de gemeenschappelijke sleutel.');
     const res=runSQL(sql); if(!res.ok) return res;
     // LEFT JOIN moet meer rijen geven dan INNER JOIN
     const innerRes=runSQL('SELECT klant.naam, bestelling.datum FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id');
     if(res.rows.length<=innerRes.rows.length) return err('Een LEFT JOIN geeft méér rijen dan een INNER JOIN (ook klanten zonder bestelling). Controleer je JOIN-type.');
     return res;
   },
   win:'LEFT JOIN geslaagd! Lena is onder de indruk: ook klanten zonder bestelling zijn zichtbaar. 🎯'},

  {id:'join_three_tables',ch:4,title:'3-weg JOIN: klant + bestelling + product',icon:'🔀',av:'🌍',who:'Boardroom',
   story:'De board wil weten <strong>wie wat besteld heeft</strong>: klantnaam, productnaam en aankoopprijs. Koppel <strong>drie tabellen</strong> via twee INNER JOINs.',
   obj:'SELECT klant.naam, product.naam, product.prijs FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id INNER JOIN product ON bestelling.product_id = product.product_id',
   diff:'medium',lpd:'LPD4',xp:100,tbl:null,time:120,
   hint:'SELECT klant.naam, product.naam, product.prijs\nFROM klant\nINNER JOIN bestelling ON klant.klant_id = bestelling.klant_id\nINNER JOIN product ON bestelling.product_id = product.product_id',
   sqlType:'join',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT klant.naam, product.naam, product.prijs FROM klant INNER JOIN ...'));
     if((s.match(/inner join|join/g)||[]).length<2) return err('Je hebt <strong>twee JOINs</strong> nodig: klant→bestelling én bestelling→product.');
     if(!s.includes('klant_id')) return err('Koppel de eerste JOIN via het gemeenschappelijke klant_id-veld.');
     if(!s.includes('product_id')) return err('Koppel de tweede JOIN via het gemeenschappelijke product_id-veld.');
     const res=runSQL(sql); if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten. Controleer beide ON-condities.');
     return res;
   },
   win:'3-tabel JOIN in één query! Dit is enterprise-niveau SQL. Board of Directors applauds. 👏'},

  {id:'join_with_where',ch:4,title:'JOIN + WHERE: Gentse bestellingen',icon:'📍',av:'📣',who:'Marketing Director',
   story:'Marketing wil een lijst van klanten uit <strong>Gent</strong> met hun bestellingen. Combineer een <strong>INNER JOIN</strong> met een <strong>WHERE</strong>-filter op stad.',
   obj:"SELECT klant.naam, bestelling.datum, bestelling.status FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id WHERE klant.stad = 'Gent'",
   diff:'medium',lpd:'LPD4',xp:90,tbl:null,time:100,
   hint:"SELECT klant.naam, bestelling.datum, bestelling.status\nFROM klant\nINNER JOIN bestelling ON klant.klant_id = bestelling.klant_id\nWHERE klant.stad = 'Gent'",
   sqlType:'join',
   check(sql){
     const s=norm(sql);
     if(!s.includes('join')) return err('Gebruik een <strong>INNER JOIN</strong> om klant en bestelling te koppelen.');
     if(!s.includes('where')) return err("Filter op stad via <strong>WHERE klant.stad = 'Gent'</strong>");
     if(!s.includes("'gent'")&&!s.includes('"gent"')) return err("Filter op <strong>Gent</strong> (met aanhalingstekens): WHERE klant.stad = 'Gent'");
     const res=runSQL(sql); if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten voor Gent. Controleer de WHERE-conditie en de JOIN.');
     // Verify all results are from Gent
     const klantGentIds = new Set(DB.klant.rows.filter(r=>r.stad==='Gent').map(r=>r.klant_id));
     const resultKlantIds = res.rows.map(r=>r['klant.klant_id']||r.klant_id).filter(Boolean);
     if(resultKlantIds.length && resultKlantIds.some(id=>!klantGentIds.has(id)))
       return err('Resultaat bevat klanten die niet uit Gent komen. Controleer de WHERE.');
     return res;
   },
   win:'JOIN + WHERE gecombineerd! Gentse klanten met hun orders in beeld voor gerichte campagnes. 📍'},

  {id:'groupby_category',ch:4,title:'Omzet per categorie',icon:'📊',av:'💰',who:'Financieel Directeur',
   story:'Kwartaalrapport! Bereken de <strong>totale omzet per productcategorie</strong> via <strong>SUM(prijs)</strong> gegroepeerd op categorie. Sorteer van hoog naar laag.',
   obj:'SELECT categorie, SUM(prijs) FROM product GROUP BY categorie ORDER BY SUM(prijs) DESC',
   diff:'medium',lpd:'LPD4',xp:85,tbl:'product',time:80,
   hint:'SELECT categorie, SUM(prijs) FROM product GROUP BY categorie ORDER BY SUM(prijs) DESC',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.includes('sum')) return err('Gebruik de <strong>SUM()</strong>-functie om de totale prijs te berekenen.');
     if(!s.includes('group by')) return err('Gebruik <strong>GROUP BY</strong> om per categorie te berekenen.');
     if(!s.includes('categorie')) return err('Groepeer op de kolom <strong>categorie</strong>.');
     const res=runSQL(sql); if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten. Controleer je GROUP BY-syntax.');
     return res;
   },
   win:'Omzet per categorie berekend! Elektronica loopt duidelijk het best. Financieel rapport klaar. 📈'},

  {id:'groupby_having',ch:4,title:'HAVING: categorieën met hoge gemiddelde prijs',icon:'🎯',av:'📊',who:'Alex — Data Analyst',
   story:'We willen enkel categorieën zien met een <strong>gemiddelde prijs boven €30</strong>. Gebruik <strong>GROUP BY + HAVING</strong> om groepen te filteren na aggregatie.',
   obj:'SELECT categorie, AVG(prijs) FROM product GROUP BY categorie HAVING AVG(prijs) > 30',
   diff:'hard',lpd:'LPD4',xp:120,tbl:'product',time:100,
   hint:'SELECT categorie, AVG(prijs) FROM product GROUP BY categorie HAVING AVG(prijs) > 30',
   sqlType:'select',
   validation: { expectedColumns: ['categorie'] },
   check(sql){
     const s=norm(sql);
     if(!s.includes('avg')) return err('Gebruik de <strong>AVG()</strong>-functie om het gemiddelde te berekenen.');
     if(!s.includes('group by')) return err('Gebruik <strong>GROUP BY</strong> om te groeperen.');
     if(!s.includes('having')) return err(stripSolution('Gebruik <strong>HAVING</strong> (niet WHERE) om op het groepsgemiddelde te filteren: HAVING AVG(prijs) > 30'));
     const res=runSQL(sql); if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten. Is de HAVING-drempel correct? Probeer een lagere waarde om te testen.');
     // Valideer: alle teruggegeven gemiddelden moeten > 30 zijn
     const allAbove = res.rows.every(r => {
       const v = Object.values(r).find(v => typeof v === 'string' && !isNaN(parseFloat(v)));
       return v ? parseFloat(v) > 30 : true;
     });
     if(!allAbove) return err('Resultaat bevat categorieën met gemiddelde prijs ≤ 30. Controleer de HAVING-conditie.');
     return res;
   },
   win:'HAVING gemeisterd! Enkel dure categorieën zichtbaar. Dit is het verschil tussen WHERE en HAVING. 🏆'},

  {id:'groupby_count_status',ch:4,title:'Bestellingen per status tellen',icon:'📦',who:'Logistiek Manager',av:'🚚',
   story:'Logistiek wil weten hoeveel bestellingen er per status zijn (geleverd, onderweg, verwerking). Gebruik <strong>COUNT(*) + GROUP BY status</strong>.',
   obj:'SELECT status, COUNT(*) FROM bestelling GROUP BY status',
   diff:'easy',lpd:'LPD4',xp:65,tbl:'bestelling',time:60,
   hint:'SELECT status, COUNT(*) FROM bestelling GROUP BY status',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.includes('count')) return err('Gebruik <strong>COUNT(*)</strong> om het aantal bestellingen te tellen.');
     if(!s.includes('group by')) return err('Gebruik <strong>GROUP BY</strong> om per status te groeperen.');
     if(!s.includes('status')) return err('Groepeer op de kolom <strong>status</strong>.');
     const res=runSQL(sql); if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten. Controleer je GROUP BY-syntax.');
     return res;
   },
   win:'Logistiek rapport klaar! Per status weten we exact hoeveel bestellingen wachten. 🚚'},

  {id:'create_table_leverancier',ch:4,title:'CREATE TABLE + INSERT: leveranciers beheren',icon:'🏗️',av:'🧑‍💼',who:'Lena — Lead Engineer',
   story:'Herhaling op expert-niveau. Stap 1: Maak tabel <strong>leverancier</strong> opnieuw aan (leverancier_id PK AUTO_INCREMENT, naam NOT NULL, email, land). Stap 2: Voeg meteen een tweede leverancier in: <strong>CloudBase NV</strong>, cloud@cloudbase.be, Nederland.',
   obj:'Stap 1: CREATE TABLE leverancier · Stap 2: INSERT tweede leverancier',
   diff:'medium',lpd:'LPD5',xp:110,tbl:null,time:120,
   sqlType:'ddl',
   hint:'CREATE TABLE leverancier (\n  leverancier_id INT PRIMARY KEY AUTO_INCREMENT,\n  naam VARCHAR(100) NOT NULL,\n  email VARCHAR(150),\n  land VARCHAR(80)\n)',
   steps:[
     {
       label:'CREATE TABLE leverancier',
       sqlType:'ddl',
       placeholder:'CREATE TABLE leverancier (...)',
       hint:'CREATE TABLE leverancier (\n  leverancier_id INT PRIMARY KEY AUTO_INCREMENT,\n  naam VARCHAR(100) NOT NULL,\n  email VARCHAR(150),\n  land VARCHAR(80)\n)',
       check(sql){
         const s=norm(sql);
         // Reset tabel zodat dit scenario altijd werkt, ook als H2-combo al uitgevoerd was
         if(DB.leverancier) delete DB.leverancier;
         if(!s.startsWith('create table')) return err('Begin met <strong>CREATE TABLE leverancier</strong> (...)');
         if(!s.includes('leverancier')) return err('Noem de tabel <strong>leverancier</strong>.');
         if(!s.includes('primary key')) return err('Voeg <strong>PRIMARY KEY</strong> toe aan leverancier_id.');
         if(!s.includes('auto_increment')) return err('Voeg <strong>AUTO_INCREMENT</strong> toe.');
         if(!s.includes('not null')) return err('Maak <strong>naam</strong> verplicht via <strong>NOT NULL</strong>.');
         if(!s.includes('varchar')) return err('Gebruik <strong>VARCHAR</strong> voor tekstvelden.');
         const res=runSQL(sql); if(!res.ok) return res;
         if(!DB.leverancier) return err('Tabel niet aangemaakt. Controleer je syntax.');
         return res;
       },
       successMsg:'Tabel leverancier aangemaakt! Voeg nu een leverancier in.',
     },
     {
       label:'INSERT CloudBase NV',
       sqlType:'insert',
       placeholder:"INSERT INTO leverancier (naam, email, land) VALUES (...)",
       hint:"INSERT INTO leverancier (naam, email, land)\nVALUES ('CloudBase NV', 'cloud@cloudbase.be', 'Nederland')",
       check(sql){
         const s=norm(sql);
         if(!s.startsWith('insert')) return err('Begin met <strong>INSERT INTO leverancier</strong>.');
         if(!s.includes('leverancier')) return err('Voeg in in tabel <strong>leverancier</strong>.');
         if(!s.includes('cloudbase')) return err('Naam "CloudBase NV" ontbreekt.');
         if(!s.includes('cloud@cloudbase.be')) return err('E-mailadres "cloud@cloudbase.be" ontbreekt.');
         if(!s.includes('nederland')) return err('Land "Nederland" ontbreekt.');
         return smartRunMsg(sql);
       },
     },
   ],
   win:'Expert-niveau bereikt! CREATE TABLE + INSERT uitgevoerd als een pro. 🏗️'},

  {id:'alter_add_column',ch:4,title:'ALTER TABLE: kolom toevoegen & vullen',icon:'📞',av:'🧑‍💼',who:'Lena — Lead Engineer',
   story:'Stap 1: Voeg kolom <strong>geboortedatum DATE</strong> toe aan tabel <strong>klant</strong>. Stap 2: Vul het geboortedatum van Jana Pieters (klant_id=1) in: <strong>1990-03-15</strong>. Zo zie je het verschil tussen structuur aanpassen (DDL) en data aanpassen (DML).',
   obj:'Stap 1: ALTER TABLE klant ADD COLUMN geboortedatum · Stap 2: UPDATE klant SET geboortedatum',
   diff:'medium',lpd:'LPD5',xp:90,tbl:'klant',time:90,
   sqlType:'ddl',
   hint:'ALTER TABLE klant ADD COLUMN geboortedatum DATE',
   steps:[
     {
       label:'ALTER TABLE — kolom aanmaken',
       sqlType:'ddl',
       placeholder:'ALTER TABLE klant ADD COLUMN geboortedatum DATE',
       hint:'ALTER TABLE klant ADD COLUMN geboortedatum DATE',
       check(sql){
         const s=norm(sql);
         // Reset kolom als al eerder aangemaakt zodat dit scenario altijd werkt
         const existing = DB.klant.cols.findIndex(c=>c.n==='geboortedatum');
         if(existing !== -1) DB.klant.cols.splice(existing, 1);
         if(!s.startsWith('alter')) return err('Begin met <strong>ALTER TABLE klant</strong>.');
         if(!s.includes('klant')) return err('Pas de tabel <strong>klant</strong> aan.');
         if(!s.includes('add')) return err('Gebruik <strong>ADD COLUMN</strong>.');
         if(!s.includes('geboortedatum')) return err('Geef de kolom de naam <strong>geboortedatum</strong>.');
         if(!s.includes('date')) return err('Gebruik datatype <strong>DATE</strong> voor datumvelden.');
         const res=runSQL(sql); if(!res.ok) return res;
         return {ok:true,type:'ddl',msg:'Kolom geboortedatum toegevoegd! Alle klanten hebben nu geboortedatum = NULL.'};
       },
       successMsg:'DDL geslaagd — de structuur is aangepast. Nu vul je de data in met UPDATE.',
     },
     {
       label:"UPDATE klant SET geboortedatum WHERE klant_id=1",
       sqlType:'update',
       placeholder:"UPDATE klant SET geboortedatum = '1990-03-15' WHERE klant_id = 1",
       hint:"UPDATE klant\nSET geboortedatum = '1990-03-15'\nWHERE klant_id = 1",
       check(sql){
         const s=norm(sql);
         if(!s.startsWith('update')) return err('Begin met <strong>UPDATE klant</strong>.');
         if(!s.includes('geboortedatum')) return err('Stel de kolom <strong>geboortedatum</strong> in via SET.');
         if(!s.includes('1990')) return err("Vul de datum <strong>'1990-03-15'</strong> in.");
         if(!s.includes('klant_id')) return err('Voeg een <strong>WHERE klant_id = 1</strong> toe — anders update je alle klanten!');
         const res=runSQL(sql); if(!res.ok) return res;
         return res;
       },
     },
   ],
   win:'Structuur aangepast én data ingevuld! Je kent nu het verschil tussen DDL (schema) en DML (data). 🧬'},

  {id:'join_having_advanced',ch:4,title:'JOIN + GROUP BY + HAVING: topklanten',icon:'🌟',av:'📈',who:'Venture Capitalist',
   story:'De investeerders willen de <strong>klanten die meer dan 1 bestelling</strong> geplaatst hebben. Koppel klant aan bestelling, groepeer per klant en filter via HAVING. Dit is het meest geavanceerde patroon in SQL.',
   obj:'SELECT klant.naam, COUNT(*) FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id GROUP BY klant.naam HAVING COUNT(*) > 1',
   diff:'hard',lpd:'LPD4',xp:150,tbl:null,time:150,
   hint:'SELECT klant.naam, COUNT(*)\nFROM klant\nINNER JOIN bestelling ON klant.klant_id = bestelling.klant_id\nGROUP BY klant.naam\nHAVING COUNT(*) > 1',
   sqlType:'join',
   check(sql){
     const s=norm(sql);
     if(!s.includes('join')) return err('Gebruik een <strong>INNER JOIN</strong> om klant en bestelling te koppelen.');
     if(!s.includes('count')) return err('Gebruik <strong>COUNT(*)</strong> om het aantal bestellingen per klant te tellen.');
     if(!s.includes('group by')) return err('Gebruik <strong>GROUP BY</strong> om per klant te groeperen.');
     if(!s.includes('having')) return err('Gebruik <strong>HAVING COUNT(*) > 1</strong> om enkel klanten met meer dan 1 bestelling te tonen.');
     const res=runSQL(sql); if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten. Zijn er klanten met meer dan 1 bestelling in de data?');
     return res;
   },
   win:'JOIN + GROUP BY + HAVING in één query! Dit is het niveau van een senior data engineer. Investeerders tekenen. 🌟💰'},

  // ── NIEUWE SCENARIO'S: Betere diversiteit voor dagelijkse uitdagingen ──

  // EASY — DELETE
  {id:'delete_review',ch:0,title:'Slechte review verwijderen',icon:'🗑️',av:'😠',who:'Klant',
   story:'Klant Lena Maes dient een verwijderverzoek in voor haar review (review_id=3). Verwijder alleen die review.',
   obj:'DELETE FROM review WHERE review_id = 3',
   diff:'easy',lpd:'LPD5',xp:45,tbl:'review',time:40,
   hint:'DELETE FROM review WHERE review_id = 3',
   sqlType:'delete',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('delete')) return err(stripSolution('Gebruik DELETE FROM review WHERE review_id = 3'));
     if(!s.includes('review')) return err('Tabel is <strong>review</strong>.');
     if(!s.includes('where')) return err('⚠️ WHERE verplicht bij DELETE! Zonder WHERE verwijder je ALLE reviews.');
     if(!s.includes('3')&&!s.includes('review_id')) return err('Voeg een WHERE-clausule toe om slechts één review te verwijderen.');
     return smartRunMsg(sql);
   },
   win:'Review verwijderd. Verzoek GDPR-conform verwerkt. ✅'},

  // EASY — INSERT (review)
  {id:'insert_review',ch:0,title:'Klantreview toevoegen',icon:'⭐',av:'😊',who:'Tevreden Klant',
   story:'Jana Pieters (klant_id=1) geeft product 3 (Notitieboek A5) een score van <strong>5</strong> met commentaar <strong>"Top kwaliteit!"</strong>.',
   obj:"INSERT INTO review (klant_id, product_id, score, commentaar) VALUES (1, 3, 5, 'Top kwaliteit!')",
   diff:'easy',lpd:'LPD5',xp:50,tbl:'review',time:50,
   hint:"INSERT INTO review (klant_id, product_id, score, commentaar) VALUES (1, 3, 5, 'Top kwaliteit!')",
   sqlType:'insert',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('insert')) return err(stripSolution('Gebruik INSERT INTO review (...) VALUES (...)'));
     if(!s.includes('review')) return err('Tabel is <strong>review</strong>.');
     if(!s.includes('score')) return err('Vergeet kolom <strong>score</strong> niet in de kolomlijst.');
     if(!s.includes('5')) return err('Score is <strong>5</strong>. Voeg die toe in VALUES.');
     if(!s.includes('top')) return err('Commentaar "Top kwaliteit!" ontbreekt in VALUES.');
     return smartRunMsg(sql);
   },
   win:'Review opgeslagen! Jana is blij gehoord te worden. ⭐'},

  // EASY — UPDATE (kortingscode activeren)
  {id:'activate_coupon',ch:0,title:'Kortingscode activeren',icon:'🎟️',av:'💼',who:'Marketing',
   story:'Zomercampagne! Kortingscode <strong>ZOMER20</strong> moet geactiveerd worden (actief = 1).',
   obj:"UPDATE kortingscode SET actief = 1 WHERE code = 'ZOMER20'",
   diff:'easy',lpd:'LPD5',xp:40,tbl:'kortingscode',time:35,
   hint:"UPDATE kortingscode SET actief = 1 WHERE code = 'ZOMER20'",
   sqlType:'update',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('update')) return err("Gebruik UPDATE kortingscode SET actief = 1 WHERE code = 'ZOMER20'");
     if(!s.includes('kortingscode')) return err('Tabel is <strong>kortingscode</strong>.');
     if(!s.includes('where')) return err('⚠️ WHERE verplicht! Anders activeer je ALLE kortingscodes.');
     if(!s.includes('zomer20')) return err("Filter op code = 'ZOMER20'. Vergeet de aanhalingstekens niet.");
     if(!s.includes('actief')) return err('Gebruik SET om de actief-kolom op de juiste waarde te zetten.');
     return smartRunMsg(sql);
   },
   win:'ZOMER20 geactiveerd! Campagne kan starten. 🌞'},

  // MEDIUM — DELETE (klant zonder bestellingen)
  {id:'delete_inactive',ch:1,title:'Inactieve klant verwijderen',icon:'🧹',av:'⚖️',who:'Juridische Dienst',
   story:'Audit resultaat: klant_id=4 (Kobe Janssen) is inactief en heeft nooit besteld. Hij mag volledig verwijderd worden.',
   obj:'DELETE FROM klant WHERE klant_id = 4',
   diff:'medium',lpd:'LPD5',xp:65,tbl:'klant',time:45,
   hint:'DELETE FROM klant WHERE klant_id = 4',
   sqlType:'delete',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('delete')) return err(stripSolution('Gebruik DELETE FROM klant WHERE klant_id = 4'));
     if(!s.includes('klant')) return err('Tabel is <strong>klant</strong>.');
     if(!s.includes('where')) return err('⚠️ WHERE verplicht bij DELETE! Zonder WHERE verwijder je ALLE klanten.');
     if(!s.includes('4')&&!s.includes('klant_id')) return err('Voeg een WHERE-clausule toe om de juiste klant te filteren.');
     return smartRunMsg(sql);
   },
   win:'Kobe correct verwijderd uit de databank. 🧹'},

  // MEDIUM — INSERT (kortingscode)
  {id:'insert_coupon',ch:1,title:'Nieuwe kortingscode aanmaken',icon:'🎁',av:'💼',who:'Marketing Manager',
   story:'Zwarte Vrijdag! Maak kortingscode <strong>BLACK30</strong> aan: <strong>30%</strong> korting, actief (1), gebruik <strong>0</strong>.',
   obj:"INSERT INTO kortingscode (code, korting, actief, gebruik) VALUES ('BLACK30', 30, 1, 0)",
   diff:'medium',lpd:'LPD5',xp:65,tbl:'kortingscode',time:55,
   hint:"INSERT INTO kortingscode (code, korting, actief, gebruik) VALUES ('BLACK30', 30, 1, 0)",
   sqlType:'insert',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('insert')) return err(stripSolution('Gebruik INSERT INTO kortingscode (...) VALUES (...)'));
     if(!s.includes('kortingscode')) return err('Tabel is <strong>kortingscode</strong>.');
     if(!s.includes('black30')) return err('Code "BLACK30" ontbreekt in VALUES. Zet tekst tussen aanhalingstekens.');
     if(!s.includes('30')) return err('Korting van <strong>30</strong> ontbreekt in VALUES.');
     if(!s.includes('gebruik')) return err('Vergeet kolom <strong>gebruik</strong> niet (waarde: 0).');
     return smartRunMsg(sql);
   },
   win:'BLACK30 aangemaakt! Klanten gaan genieten van 30% korting. 🛍️'},

  // MEDIUM — UPDATE (stock verhogen per categorie)
  {id:'update_stock_category',ch:1,title:'Elektronicastock verhogen',icon:'🔋',av:'🏭',who:'Inkoopmanager',
   story:'Grote levering elektronica binnen! Verhoog de stock van <strong>alle Elektronica-producten</strong> met <strong>10</strong>.',
   obj:"UPDATE product SET stock = stock + 10 WHERE categorie = 'Elektronica'",
   diff:'medium',lpd:'LPD5',xp:75,tbl:'product',time:60,
   hint:"UPDATE product SET stock = stock + 10 WHERE categorie = 'Elektronica'",
   sqlType:'update',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('update')) return err("Gebruik UPDATE product SET stock = stock + 10 WHERE categorie = 'Elektronica'");
     if(!s.includes('product')) return err('Tabel is <strong>product</strong>.');
     if(!s.includes('where')) return err('⚠️ WHERE verplicht! Anders pas je de stock van ALLE producten aan.');
     if(!s.includes('elektronica')) return err("Filter op categorie = 'Elektronica'. Vergeet de aanhalingstekens niet.");
     if(!s.includes('stock + 10')&&!s.includes('stock+10')&&!s.includes('stock +10')) return err('Gebruik een <strong>relatieve optelling</strong> in SET — voeg het getal bij de huidige waarde op.');
     return smartRunMsg(sql);
   },
   win:'Elektronicastock opgehoogd! Geen tekorten meer. ⚡'},

  // MEDIUM — DELETE (reviews van product)
  {id:'delete_product_reviews',ch:1,title:'Reviews van gestopt product wissen',icon:'🗑️',av:'📦',who:'Productmanager',
   story:'Product 3 (Notitieboek A5) wordt stopgezet. Verwijder alle reviews van product_id=3 vóór het product zelf weg kan.',
   obj:'DELETE FROM review WHERE product_id = 3',
   diff:'medium',lpd:'LPD5',xp:60,tbl:'review',time:45,
   hint:'DELETE FROM review WHERE product_id = 3',
   sqlType:'delete',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('delete')) return err(stripSolution('Gebruik DELETE FROM review WHERE product_id = 3'));
     if(!s.includes('review')) return err('Verwijder uit tabel <strong>review</strong>, niet uit product.');
     if(!s.includes('where')) return err('⚠️ WHERE verplicht! Anders verwijder je ALLE reviews.');
     if(!s.includes('product_id')) return err('Voeg een WHERE-clausule toe om te filteren op het juiste product.');
     if(!s.includes('3')) return err('Filter op product_id = <strong>3</strong> (Notitieboek A5).');
     return smartRunMsg(sql);
   },
   win:'Reviews verwijderd. Product kan nu volledig uit de databank. 🧹'},

  // HARD — DELETE met subquery
  {id:'delete_no_orders',ch:2,title:'Klanten zonder bestelling verwijderen',icon:'🧹',av:'📊',who:'Data Engineer',
   story:'Dataopschoning: verwijder alle klanten die <strong>nooit een bestelling</strong> hebben geplaatst. Gebruik NOT IN met een subquery.',
   obj:'DELETE FROM klant WHERE klant_id NOT IN (SELECT klant_id FROM bestelling)',
   diff:'hard',lpd:'LPD5',xp:115,tbl:'klant',time:90,
   hint:'DELETE FROM klant WHERE klant_id NOT IN (SELECT klant_id FROM bestelling)',
   sqlType:'delete',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('delete')) return err(stripSolution('Gebruik DELETE FROM klant WHERE klant_id NOT IN (SELECT klant_id FROM bestelling)'));
     if(!s.includes('klant')) return err('Verwijder uit tabel <strong>klant</strong>.');
     if(!s.includes('where')) return err('⚠️ WHERE verplicht! Filter klanten zonder bestelling via een subquery.');
     if(!s.includes('not in')) return err('Gebruik <strong>NOT IN</strong>: WHERE klant_id NOT IN (...)');
     if(!s.includes('(select')) return err(stripSolution('Gebruik een subquery: WHERE klant_id NOT IN <strong>(SELECT klant_id FROM bestelling)</strong>'));
     if(!s.includes('bestelling')) return err('De subquery haalt klant_ids op uit tabel <strong>bestelling</strong>.');
     return smartRunMsg(sql);
   },
   win:'Klanten zonder bestellingen opgeruimd. Zuivere databank! 🧹'},

  // HARD — INSERT (complexe bestelling)
  {id:'insert_bulk_order',ch:2,title:'Bestelling van topklant verwerken',icon:'🛒',av:'📬',who:'Orderverwerking',
   story:'Fatima El Asri (klant_id=5) bestelde 2x Ergonomische stoel (product_id=4) op <strong>2025-01-15</strong>. Status: <strong>"verwerking"</strong>.',
   obj:"INSERT INTO bestelling (klant_id, product_id, datum, aantal, status) VALUES (5, 4, '2025-01-15', 2, 'verwerking')",
   diff:'hard',lpd:'LPD5',xp:100,tbl:'bestelling',time:70,
   hint:"INSERT INTO bestelling (klant_id, product_id, datum, aantal, status) VALUES (5, 4, '2025-01-15', 2, 'verwerking')",
   sqlType:'insert',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('insert')) return err(stripSolution('Gebruik INSERT INTO bestelling (...) VALUES (...)'));
     if(!s.includes('bestelling')) return err('Tabel is <strong>bestelling</strong>.');
     if(!s.includes('2025-01-15')) return err("Datum 2025-01-15 ontbreekt. Schrijf datums als <code>'2025-01-15'</code>");
     if(!s.includes('verwerking')) return err('Status "verwerking" ontbreekt in VALUES. Tekst hoort tussen aanhalingstekens.');
     if(!s.includes('5')) return err('klant_id = <strong>5</strong> (Fatima El Asri) ontbreekt in VALUES.');
     if(!s.includes('4')) return err('product_id = <strong>4</strong> (Ergonomische stoel) ontbreekt in VALUES.');
     return smartRunMsg(sql);
   },
   win:'Bestellingsverwerking afgerond. Fatima krijgt een bevestiging. 📧'},

  // HARD — UPDATE met meerdere kolommen
  {id:'update_top_discount',ch:2,title:'VIP kortingscode upgraden',icon:'👑',av:'🎯',who:'Marketing Director',
   story:'VIP-actie: verhoog de korting van <strong>TROUW15</strong> naar <strong>25%</strong> én verhoog het gebruik met 1 (loyaliteitsbonus).',
   obj:"UPDATE kortingscode SET korting = 25, gebruik = gebruik + 1 WHERE code = 'TROUW15'",
   diff:'hard',lpd:'LPD5',xp:105,tbl:'kortingscode',time:75,
   hint:"UPDATE kortingscode SET korting = 25, gebruik = gebruik + 1 WHERE code = 'TROUW15'",
   sqlType:'update',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('update')) return err("Gebruik UPDATE kortingscode SET korting = 25, gebruik = gebruik + 1 WHERE code = 'TROUW15'");
     if(!s.includes('kortingscode')) return err('Tabel is <strong>kortingscode</strong>.');
     if(!s.includes('where')) return err('⚠️ WHERE verplicht! Anders pas je ALLE kortingscodes aan.');
     if(!s.includes('trouw15')) return err("Filter op code = 'TROUW15'. Vergeet de aanhalingstekens niet.");
     if(!s.includes('25')) return err('Nieuwe korting is <strong>25</strong>. Vergeet dat niet in SET.');
     if(!s.includes('gebruik')) return err('Verhoog ook <strong>gebruik</strong> met 1: gebruik = gebruik + 1');
     return smartRunMsg(sql);
   },
   win:'TROUW15 bijgewerkt naar 25% korting. VIP-klant in de wolken! 👑'},

  // HARD — DELETE (score filter)
  {id:'delete_old_reviews',ch:3,title:'Negatieve reviews opschonen',icon:'🗑️',av:'📈',who:'Reputatiemanager',
   story:'Negatieve reviews (score ≤ 2) schaden de reputatie. Verwijder alle reviews met score <strong>kleiner dan of gelijk aan 2</strong>.',
   obj:'DELETE FROM review WHERE score <= 2',
   diff:'hard',lpd:'LPD5',xp:100,tbl:'review',time:55,
   hint:'DELETE FROM review WHERE score <= 2',
   sqlType:'delete',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('delete')) return err('Schrijf een DELETE-statement met een WHERE-clausule die de gevraagde scores filtert.');
     if(!s.includes('review')) return err('Verwijder uit tabel <strong>review</strong>.');
     if(!s.includes('where')) return err('⚠️ WHERE verplicht! Zonder WHERE verwijder je ALLE reviews.');
     if(!s.includes('score')) return err('Filter op kolom <strong>score</strong>. Reviews met score ≤ 2 moeten weg.');
     if(!s.includes('<=')&&!s.includes('< 3')&&!s.includes('<3')) return err('Gebruik de juiste vergelijkingsoperator in je WHERE-clausule om lage scores te filteren.');
     return smartRunMsg(sql);
   },
   win:'Lage reviews verwijderd. Reputatie hersteld! ⭐'},

  // HARD — INSERT (leverancier)
  // ── NIEUWE MISSIES: LIKE / BETWEEN / IS NULL / NOT IN / CASE WHEN ──

  // H2 — LIKE (easy)
  {id:'like_search',ch:1,title:'Klanten zoeken op naam',icon:'🔎',av:'📣',who:'Marketing',
   story:'Marketing wil een campagne sturen naar alle klanten waarvan de naam begint met de letter <strong>J</strong>. Gebruik <strong>LIKE</strong> om op naampatroon te filteren.',
   obj:"SELECT naam, email FROM klant WHERE naam LIKE 'J%'",
   diff:'easy',lpd:'LPD4',xp:50,tbl:'klant',time:45,conceptType:'like',
   hint:"SELECT naam, email FROM klant WHERE naam LIKE 'J%'",
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err("Begin met SELECT naam, email FROM klant WHERE naam LIKE 'J%'");
     if(!s.includes('from klant')) return err('Gebruik FROM <strong>klant</strong>.');
     if(!s.includes('like')) return err("Gebruik <strong>LIKE</strong> om op patroon te filteren: WHERE naam LIKE 'J%'");
     if(!s.includes("'j%'")&&!s.includes('"j%"')) return err("Gebruik het patroon <code>'J%'</code> — % staat voor nul of meer tekens na de J.");
     const res=runSQL(sql); if(!res.ok) return res;
     if(!rowCount(res)) return err("Geen resultaten. Controleer het LIKE-patroon: 'J%' (hoofdletter of kleine letter).");
     return res;
   },
   win:'J-klanten gevonden! Campagne verstuurd. 📣'},

  // H2 — BETWEEN (easy)
  {id:'between_price',ch:1,title:'Middensegment producten',icon:'💰',av:'📦',who:'Inkoopmanager',
   story:'Inkoop zoekt producten in het middensegment: prijs <strong>tussen €20 en €80</strong> (inclusief). Gebruik <strong>BETWEEN</strong>.',
   obj:'SELECT naam, prijs FROM product WHERE prijs BETWEEN 20 AND 80',
   diff:'easy',lpd:'LPD4',xp:50,tbl:'product',time:40,conceptType:'between',
   hint:'SELECT naam, prijs FROM product WHERE prijs BETWEEN 20 AND 80',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err('Begin met SELECT naam, prijs FROM product WHERE prijs BETWEEN 20 AND 80');
     if(!s.includes('product')) return err('Gebruik FROM <strong>product</strong>.');
     if(!s.includes('between')) return err('Gebruik <strong>BETWEEN ... AND ...</strong> om een prijsbereik te filteren.');
     if(!s.includes('20')&&!s.includes('and')) return err('Schrijf het bereik als: BETWEEN <strong>20</strong> AND <strong>80</strong>');
     const res=runSQL(sql); if(!res.ok) return res;
     if(res.rows&&res.rows.some(r=>Number(r.prijs)<20||Number(r.prijs)>80)) return err('Resultaat bevat producten buiten het bereik €20–€80. Controleer je BETWEEN-waarden.');
     return res;
   },
   win:'Middensegment in kaart gebracht! Inkoopstrategie klaar. 💼'},

  // H3 — IS NULL (medium)
  {id:'null_email',ch:2,title:'Klanten zonder e-mailadres',icon:'📭',av:'📊',who:'Analytics',
   story:'Dataopschoning: welke klanten hebben <strong>geen e-mailadres</strong> ingevuld? Gebruik <strong>IS NULL</strong> — nooit <code>= NULL</code>!',
   obj:'SELECT naam FROM klant WHERE email IS NULL',
   diff:'medium',lpd:'LPD4',xp:65,tbl:'klant',time:35,conceptType:'isnull',
   hint:'SELECT naam FROM klant WHERE email IS NULL',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err('Begin met SELECT naam FROM klant WHERE email IS NULL');
     if(!s.includes('klant')) return err('Gebruik FROM <strong>klant</strong>.');
     if(s.includes('= null')||s.includes('=null')) return err('❌ <code>= NULL</code> werkt nooit in SQL! Gebruik altijd <strong>IS NULL</strong>.');
     if(!s.includes('is null')) return err('Gebruik <strong>IS NULL</strong> om op ontbrekende waarden te filteren: WHERE email IS NULL');
     if(!s.includes('email')) return err('Filter op kolom <strong>email</strong>: WHERE email IS NULL');
     return smartRunMsg(sql);
   },
   win:'Klanten zonder e-mail gevonden. Klantenservice neemt contact op via post. 📬'},

  // H3 — NOT IN (medium)
  {id:'not_in_products',ch:2,title:'Producten zonder reviews',icon:'⭐',av:'📊',who:'Productmanager',
   story:'Welke producten hebben <strong>nog nooit een review</strong> ontvangen? Gebruik <strong>NOT IN</strong> met een subquery op de review-tabel.',
   obj:'SELECT naam FROM product WHERE product_id NOT IN (SELECT product_id FROM review)',
   diff:'medium',lpd:'LPD4',xp:90,tbl:null,time:80,
   hint:'SELECT naam FROM product WHERE product_id NOT IN (SELECT product_id FROM review)',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err(stripSolution('Begin met SELECT naam FROM product WHERE product_id NOT IN (SELECT product_id FROM review)'));
     if(!s.includes('product')) return err('Gebruik FROM <strong>product</strong> voor de buitenste query.');
     if(!s.includes('not in')) return err('Gebruik <strong>NOT IN</strong> om producten uit te sluiten die al een review hebben.');
     if(!s.includes('(select')) return err(stripSolution('Gebruik een subquery: WHERE product_id NOT IN <strong>(SELECT product_id FROM review)</strong>'));
     if(!s.includes('review')) return err('De subquery haalt product_ids op uit tabel <strong>review</strong>.');
     const res=runSQL(sql); if(!res.ok) return res;
     // Check: no returned product should have a review
     const reviewedIds=new Set(DB.review.rows.map(r=>r.product_id));
     if(res.rows.some(r=>{const p=DB.product.rows.find(pr=>pr.naam===r.naam||pr.naam===r['naam']);return p&&reviewedIds.has(p.product_id);}))
       return err('Resultaat bevat producten die al een review hebben. Controleer je NOT IN-subquery.');
     return res;
   },
   win:'Producten zonder feedback geïdentificeerd. Inkoopteam stuurt testpakketjes. 📦'},

  // H3 — Anti-JOIN IS NULL (hard)
  {id:'anti_join_no_orders',ch:2,title:'Klanten die nog nooit besteld hebben',icon:'😴',av:'📣',who:'Marketing Director',
   story:'Marketing wil klanten activeren die <strong>nooit een bestelling</strong> hebben geplaatst. Gebruik een <strong>LEFT JOIN + WHERE IS NULL</strong> (anti-join patroon).',
   obj:'SELECT klant.naam, klant.email FROM klant LEFT JOIN bestelling ON klant.klant_id = bestelling.klant_id WHERE bestelling.klant_id IS NULL',
   diff:'hard',lpd:'LPD4',xp:125,tbl:null,time:110,
   hint:'SELECT klant.naam, klant.email\nFROM klant\nLEFT JOIN bestelling ON klant.klant_id = bestelling.klant_id\nWHERE bestelling.klant_id IS NULL',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.includes('left join')) return err('Gebruik <strong>LEFT JOIN</strong> — alle klanten blijven zichtbaar, ook zonder bestelling.');
     if(!s.includes('is null')) return err('Voeg <strong>WHERE bestelling.klant_id IS NULL</strong> toe om enkel klanten zonder bestelling te tonen.');
     if(!s.includes('bestelling')) return err('JOIN de tabel <strong>bestelling</strong> en koppel via het gemeenschappelijke sleutelveld.');
     const res=runSQL(sql); if(!res.ok) return res;
     // All returned klanten should have NO bestelling
     const bestellingIds=new Set(DB.bestelling.rows.map(r=>r.klant_id));
     const klantIdMap=Object.fromEntries(DB.klant.rows.map(r=>[r.naam,r.klant_id]));
     if(res.rows.some(r=>{
       // Support both raw 'naam', aliased 'klant.naam', or any alias like 'klant'
       const nameVal=r.naam||r['klant.naam']||r.klant||Object.values(r)[0];
       const kid=klantIdMap[nameVal];
       return kid&&bestellingIds.has(kid);
     }))
       return err('Resultaat bevat klanten die wél bestellingen hebben. Controleer de IS NULL-conditie.');
     if(!rowCount(res)) return err('Geen klanten gevonden zonder bestelling. Controleer de LEFT JOIN + IS NULL combinatie.');
     return res;
   },
   win:'Slapende klanten gevonden! Win-back campagne gestart. 📧'},

  // H4 — LIKE met JOIN (medium)
  {id:'like_product_search',ch:3,title:'Producten zoeken op sleutelwoord',icon:'🔍',av:'🛒',who:'Webshop Team',
   story:'De zoekbalk van de webshop filtert producten op naam. Zoek alle producten waarvan de naam <strong>"Cam"</strong> bevat — klanten zoeken naar camera\'s en webcams.',
   obj:"SELECT naam, prijs, stock FROM product WHERE naam LIKE '%Cam%'",
   diff:'medium',lpd:'LPD4',xp:70,tbl:'product',time:45,
   hint:"SELECT naam, prijs, stock FROM product WHERE naam LIKE '%Cam%'",
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err("Begin met SELECT naam, prijs, stock FROM product WHERE naam LIKE '%Cam%'");
     if(!s.includes('product')) return err('Gebruik FROM <strong>product</strong>.');
     if(!s.includes('like')) return err("Gebruik <strong>LIKE</strong> met wildcard: WHERE naam LIKE '%Cam%'");
     if(!s.includes('%cam%')&&!s.includes("'%cam%'")&&!s.includes('"cam"')) return err("Gebruik <code>'%Cam%'</code> — % aan beide kanten betekent 'bevat Cam'.");
     const res=runSQL(sql); if(!res.ok) return res;
     if(!rowCount(res)) return err("Geen producten gevonden. Controleer het patroon '%Cam%'.");
     return res;
   },
   win:'Zoekresultaten gevonden! Webcam HD en Camera-producten zichtbaar. 📷'},

  // H4 — BETWEEN datum (medium)
  {id:'between_dates',ch:3,title:'Bestellingen van Q4 2024',icon:'📅',av:'📊',who:'Alex — Data Analyst',
   story:'Kwartaalrapport: haal alle bestellingen op van <strong>Q4 2024</strong> — van 1 oktober tot en met 31 december 2024. Gebruik <strong>BETWEEN</strong> met datums.',
   obj:"SELECT bestelling_id, datum, status FROM bestelling WHERE datum BETWEEN '2024-10-01' AND '2024-12-31'",
   diff:'medium',lpd:'LPD4',xp:80,tbl:'bestelling',time:60,
   hint:"SELECT bestelling_id, datum, status FROM bestelling WHERE datum BETWEEN '2024-10-01' AND '2024-12-31'",
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err("Begin met SELECT ... FROM bestelling WHERE datum BETWEEN '2024-10-01' AND '2024-12-31'");
     if(!s.includes('bestelling')) return err('Gebruik FROM <strong>bestelling</strong>.');
     if(!s.includes('between')) return err("Gebruik <strong>BETWEEN '2024-10-01' AND '2024-12-31'</strong> voor het datumbereik.");
     if(!s.includes('datum')) return err('Filter op kolom <strong>datum</strong>: WHERE datum BETWEEN ...');
     if(!s.includes('2024-10-01')&&!s.includes('2024-10')) return err("Startdatum is <strong>'2024-10-01'</strong> (begin Q4). Datums schrijf je als tekst tussen aanhalingstekens.");
     if(!s.includes('2024-12-31')&&!s.includes('2024-12')) return err("Einddatum is <strong>'2024-12-31'</strong> (einde Q4).");
     const res=runSQL(sql); if(!res.ok) return res;
     return res;
   },
   win:'Q4-rapport klaar! Alle bestellingen van het laatste kwartaal in beeld. 📊'},

  // H5 — CASE WHEN (hard)
  {id:'case_stock_status',ch:4,title:'Stockstatus labelen met CASE WHEN',icon:'🏷️',av:'📦',who:'Logistiek Manager',
   story:'Logistiek wil een overzicht met een leesbare <strong>stockstatus</strong>: "Uitverkocht" als stock = 0, "Bijna op" als stock < 5, anders "Op voorraad". Gebruik <strong>CASE WHEN</strong>.',
   obj:"SELECT naam, stock, CASE WHEN stock = 0 THEN 'Uitverkocht' WHEN stock < 5 THEN 'Bijna op' ELSE 'Op voorraad' END AS status FROM product",
   diff:'hard',lpd:'LPD4',xp:130,tbl:'product',time:120,conceptType:'casewhen',
   hint:"SELECT naam, stock,\n  CASE\n    WHEN stock = 0 THEN 'Uitverkocht'\n    WHEN stock < 5 THEN 'Bijna op'\n    ELSE 'Op voorraad'\n  END AS status\nFROM product",
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('select')) return err("Begin met SELECT naam, stock, CASE WHEN ... END AS status FROM product");
     if(!s.includes('product')) return err('Gebruik FROM <strong>product</strong>.');
     if(!s.includes('case')) return err("Gebruik <strong>CASE WHEN ... THEN ... ELSE ... END</strong> voor conditionele labels.");
     if(!s.includes('when')) return err("Voeg WHEN-clausules toe: <code>WHEN stock = 0 THEN 'Uitverkocht'</code>");
     if(!s.includes('uitverkocht')&&!s.includes("'uitverkocht'")) return err("Label 'Uitverkocht' ontbreekt in je CASE WHEN (voor stock = 0).");
     if(!s.includes('bijna')&&!s.includes("'bijna")) return err("Label 'Bijna op' ontbreekt (voor stock < 5).");
     if(!s.includes('end')) return err("Sluit het CASE-blok af met <strong>END</strong>. Vergeet ook <code>AS status</code> niet.");
     const res=runSQL(sql);
     if(!res.ok) return err('SQL-fout. Controleer de CASE WHEN structuur: CASE WHEN ... THEN ... ELSE ... END AS status');
     if(!rowCount(res)) return err('Geen resultaten. Controleer je CASE WHEN en FROM product.');
     const hasStatus=res.rows.length&&Object.keys(res.rows[0]).some(k=>k.toLowerCase().includes('status')||k.toLowerCase()==='case');
     if(!hasStatus) return err('Geef de CASE WHEN kolom een naam via <strong>AS status</strong>.');
     return res;
   },
   win:'CASE WHEN gemeisterd! Logistiek heeft nu een leesbaar stockoverzicht. Warehouse team juicht. 🎉'}
,

  // ── NIEUWE SCENARIO'S ─────────────────────────────────────────\n\n  // JOIN scenario (medium)\n  {id:'join_product_review',ch:2,title:'Producten met hun reviews',icon:'⭐',av:'📊',who:'Marketing Manager',\n   story:'Marketing wil een overzicht van <strong>producten met hun gemiddelde reviewscore</strong>. Koppel de tabel product aan review via product_id.',\n   obj:'SELECT p.naam, AVG(r.score) AS gemiddelde FROM product p INNER JOIN review r ON p.product_id = r.product_id GROUP BY p.product_id, p.naam',\n   diff:'medium',lpd:'LPD4',xp:75,tbl:'product',time:60,\n   hint:'SELECT p.naam, AVG(r.score) AS gemiddelde\nFROM product p\nINNER JOIN review r ON p.product_id = r.product_id\nGROUP BY p.product_id, p.naam',\n   sqlType:'join',\n   check(sql){\n     const s=norm(sql);\n     if(!s.startsWith('select')) return err('Begin met SELECT om de gewenste kolommen en aggregatie te definiëren.');\n     if(!s.includes('review')) return err('JOIN de tabel <strong>review</strong> via product_id.');\n     if(!s.includes('join')) return err('Gebruik <strong>INNER JOIN</strong> om product aan review te koppelen.');\n     if(!s.includes('avg')) return err('Gebruik de <strong>AVG()</strong>-functie op de score-kolom.');\n     if(!s.includes('group by')) return err('Groepeer met <strong>GROUP BY</strong> op de productvelden.');\n     const res=runSQL(sql); if(!res.ok) return err('SQL-fout: '+res.msg);\n     return res;\n   },\n   win:'Reviewoverzicht klaar! Marketing heeft nu een duidelijk beeld van klanttevredenheid per product. 🌟'},\n\n  // SUBQUERY scenario (hard)\n  {id:'subquery_expensive',ch:3,title:'Producten duurder dan gemiddeld',icon:'💰',av:'💼',who:'Finance Director',\n   story:'Finance wil een lijst van <strong>producten die duurder zijn dan het gemiddelde</strong>. Gebruik een subquery om het gemiddelde te berekenen.',\n   obj:"SELECT naam, prijs FROM product WHERE prijs > (SELECT AVG(prijs) FROM product) ORDER BY prijs DESC",\n   diff:'hard',lpd:'LPD5',xp:110,tbl:'product',time:90,\n   hint:"SELECT naam, prijs\nFROM product\nWHERE prijs > (SELECT AVG(prijs) FROM product)\nORDER BY prijs DESC",\n   sqlType:'select',\n   check(sql){\n     const s=norm(sql);\n     if(!s.startsWith('select')) return err('Begin met SELECT naam, prijs FROM product.');\n     if(!s.includes('select avg') && !s.includes('(select')) return err('Gebruik een <strong>subquery</strong> in de WHERE-clausule om het gemiddelde te berekenen');\n     if(!s.includes('avg')) return err('Bereken het gemiddelde met de <strong>AVG()</strong>-functie in de subquery.');\n     const res=runSQL(sql); if(!res.ok) return err('SQL-fout: '+res.msg);\n     if(!rowCount(res)) return err('Geen resultaten. Controleer je subquery en WHERE-conditie.');\n     return res;\n   },\n   win:'Subquery gemeisterd! Finance heeft nu een lijst van premium producten boven het gemiddelde. 💎'},\n\n  // UPDATE scenario (easy)  \n  {id:'update_email',ch:0,title:'E-mailadres bijwerken',icon:'📧',av:'👤',who:'Klantenservice',\n   story:'Klant Jana Pieters (klant_id=1) heeft haar e-mailadres gewijzigd naar <strong>jana.pieters@nieuw.be</strong>. Update de database.',\n   obj:"UPDATE klant SET email = 'jana.pieters@nieuw.be' WHERE klant_id = 1",\n   diff:'easy',lpd:'LPD2',xp:30,tbl:'klant',time:35,\n   hint:"UPDATE klant\nSET email = 'jana.pieters@nieuw.be'\nWHERE klant_id = 1",\n   sqlType:'update',\n   check(sql){\n     const s=norm(sql);\n     if(!s.startsWith('update')) return err('Begin met <strong>UPDATE klant</strong>.');\n     if(!s.includes('klant')) return err('Werk de tabel <strong>klant</strong> bij.');\n     if(!s.includes('email')) return err('Zet de kolom <strong>email</strong> via SET.');\n     if(!s.includes('klant_id')) return err('Voeg een <strong>WHERE</strong>-clausule toe op klant_id — anders worden alle klanten bijgewerkt!');\n     const res=runSQL(sql); if(!res.ok) return err('SQL-fout: '+res.msg);\n     return res;\n   },\n   win:'E-mail bijgewerkt! Jana kan nu inloggen met haar nieuwe adres. 📬'},\n\n  // SELECT + LIKE (easy)\n  {id:'search_by_email_domain',ch:1,title:'Klanten op e-maildomein zoeken',icon:'🔍',av:'🛡️',who:'IT Security',\n   story:'IT wil alle klanten vinden met een <strong>@mail.be</strong> e-mailadres voor een security-controle.',\n   obj:"SELECT naam, email FROM klant WHERE email LIKE '%@mail.be'",\n   diff:'easy',lpd:'LPD2',xp:35,tbl:'klant',time:40,\n   hint:"SELECT naam, email\nFROM klant\nWHERE email LIKE '%@mail.be'",\n   sqlType:'select',\n   check(sql){\n     const s=norm(sql);\n     if(!s.startsWith('select')) return err('Begin met SELECT naam, email.');\n     if(!s.includes('like')) return err('Gebruik <strong>LIKE</strong> voor patroonzoekopdrachten.');\n     if(!s.includes('@mail.be')) return err("Zoek op het patroon <strong>'%@mail.be'</strong> — % matcht alles voor het @.");\n     const res=runSQL(sql); if(!res.ok) return err('SQL-fout: '+res.msg);\n     return res;\n   },\n   win:'Security-controle klaar! Alle @mail.be klanten gevonden. 🔐'},\n\n  // JOIN + GROUP BY (hard)\n  {id:'revenue_per_customer',ch:4,title:'Omzet per klant berekenen',icon:'💹',av:'📈',who:'CFO',\n   story:'De CFO wil weten hoeveel <strong>elke klant totaal heeft besteld</strong> (som van totaal_prijs). Sorteer op omzet aflopend.',\n   obj:'SELECT k.naam, SUM(b.totaal_prijs) AS omzet FROM klant k INNER JOIN bestelling b ON k.klant_id = b.klant_id GROUP BY k.klant_id, k.naam ORDER BY omzet DESC',\n   diff:'hard',lpd:'LPD5',xp:140,tbl:'bestelling',time:120,\n   hint:'SELECT k.naam, SUM(b.totaal_prijs) AS omzet\nFROM klant k\nINNER JOIN bestelling b ON k.klant_id = b.klant_id\nGROUP BY k.klant_id, k.naam\nORDER BY omzet DESC',\n   sqlType:'join',\n   check(sql){\n     const s=norm(sql);\n     if(!s.startsWith('select')) return err('Begin met SELECT om de klantnaam en de berekende totaalwaarde te selecteren.');\n     if(!s.includes('join')) return err('Gebruik <strong>INNER JOIN bestelling b</strong> om klant aan bestelling te koppelen.');\n     if(!s.includes('sum')) return err('Bereken de totale omzet met de <strong>SUM()</strong>-functie.');\n     if(!s.includes('group by')) return err('Groepeer met <strong>GROUP BY</strong> op de klantvelden.');\n     if(!s.includes('order by')) return err('Sorteer het resultaat aflopend op de berekende omzetkolom.');\n     const res=runSQL(sql); if(!res.ok) return err('SQL-fout: '+res.msg);\n     return res;\n   },\n   win:'Omzetranking klaar! De CFO ziet nu wie de top-klanten zijn. 🏆'},\n\n  // ── EXTRA SCENARIO'S (v5) ─────────────────────────────────────\n\n  // Easy SELECT – chapter 0 (beginner-friendly intro)\n  {id:'select_all_products',ch:0,title:'Alle producten bekijken',icon:'📦',av:'👔',who:'Thomas — Adviseur',\n   story:'Je hebt net toegang tot de database. Bekijk alle producten om een overzicht te krijgen van het assortiment.',\n   obj:'SELECT * FROM product',\n   diff:'easy',lpd:'LPD1',xp:15,tbl:'product',time:20,\n   hint:'SELECT *\nFROM product',\n   sqlType:'select',\n   check(sql){\n     const s=norm(sql);\n     if(!s.startsWith('select')) return err('Begin met <strong>SELECT</strong>.');\n     if(!s.includes('product')) return err('Haal gegevens op <strong>FROM product</strong>.');\n     const res=runSQL(sql); if(!res.ok) return err('SQL-fout: '+res.msg);\n     if(!rowCount(res)) return err('Geen rijen gevonden. Controleer de tabelnaam.');\n     return res;\n   },\n   win:'Perfect! Je ziet nu alle producten. Zo krijg je snel overzicht. 🎉'},\n\n  // Easy SELECT – chapter 0\n  {id:'count_klanten',ch:0,title:'Hoeveel klanten zijn er?',icon:'🔢',av:'💻',who:'System',\n   story:'Een investeerder vraagt hoeveel klanten DataShop heeft. Tel alle rijen in de klant-tabel.',\n   obj:'SELECT COUNT(*) AS aantal_klanten FROM klant',\n   diff:'easy',lpd:'LPD1',xp:20,tbl:'klant',time:25,\n   hint:'SELECT COUNT(*) AS aantal_klanten\nFROM klant',\n   sqlType:'select',\n   check(sql){\n     const s=norm(sql);\n     if(!s.startsWith('select')) return err('Begin met SELECT COUNT(*).');\n     if(!s.includes('count')) return err('Gebruik <strong>COUNT(*)</strong> om rijen te tellen.');\n     if(!s.includes('klant')) return err('Tel rijen in de tabel <strong>klant</strong>.');\n     const res=runSQL(sql); if(!res.ok) return err('SQL-fout: '+res.msg);\n     return res;\n   },\n   win:'Geteld! Je weet nu exact hoeveel klanten er zijn. 📊'},\n\n  // Hard JOIN – chapter 3\n  {id:'join_top_products',ch:3,title:'Bestsellers via bestellingen',icon:'🏆',av:'📈',who:'Venture Capitalist',\n   story:'De investeerder wil weten welke producten het vaakst besteld zijn. JOIN product en bestelling, tel bestellingen per product, sorteer aflopend.',\n   obj:'SELECT p.naam, COUNT(b.bestelling_id) AS aantal FROM product p LEFT JOIN bestelling b ON p.product_id = b.product_id GROUP BY p.product_id, p.naam ORDER BY aantal DESC',\n   diff:'hard',lpd:'LPD4',xp:135,tbl:'bestelling',time:120,\n   hint:'SELECT p.naam, COUNT(b.bestelling_id) AS aantal\nFROM product p\nLEFT JOIN bestelling b ON p.product_id = b.product_id\nGROUP BY p.product_id, p.naam\nORDER BY aantal DESC',\n   sqlType:'join',\n   check(sql){\n     const s=norm(sql);\n     if(!s.startsWith('select')) return err('Begin met SELECT om de productnaam en het berekende aantal te selecteren.');\n     if(!s.includes('join')) return err('Gebruik een <strong>JOIN</strong> op bestelling via product_id.');\n     if(!s.includes('count')) return err('Gebruik <strong>COUNT()</strong> om het aantal bestellingen te tellen.');\n     if(!s.includes('group by')) return err('Groepeer met <strong>GROUP BY</strong> op de productvelden.');\n     if(!s.includes('order by')) return err('Sorteer met <strong>ORDER BY aantal DESC</strong>.');\n     const res=runSQL(sql); if(!res.ok) return err('SQL-fout: '+res.msg);\n     return res;\n   },\n   win:'Bestseller-ranking klaar! De investor is onder de indruk. 🏆'},\n\n  // Medium UPDATE – chapter 2\n  {id:'update_stock_bulk',ch:2,title:'Stock aanvullen na levering',icon:'🚚',av:'📦',who:'Warehouse Manager',\n   story:'Er is een levering binnengekomen. Verhoog de stock van ALLE producten met categorie "Elektronica" met 10.',\n   obj:"UPDATE product SET stock = stock + 10 WHERE categorie = 'Elektronica'",\n   diff:'medium',lpd:'LPD3',xp:65,tbl:'product',time:55,\n   hint:"UPDATE product\nSET stock = stock + 10\nWHERE categorie = 'Elektronica'",\n   sqlType:'update',\n   check(sql){\n     const s=norm(sql);\n     if(!s.startsWith('update')) return err('Begin met <strong>UPDATE product</strong>.');\n     if(!s.includes('stock')) return err('Verhoog de kolom <strong>stock</strong> via SET.');\n     if(!s.includes('+ 10') && !s.includes('+10')) return err('Gebruik <strong>stock + 10</strong> om relatief te verhogen (niet een absoluut getal).');\n     if(!s.includes('elektronica')) return err("Filter op <strong>WHERE categorie = 'Elektronica'</strong>.");\n     const res=runSQL(sql); if(!res.ok) return err('SQL-fout: '+res.msg);\n     return res;\n   },\n   win:'Voorraad bijgewerkt! Alle elektronica-producten hebben 10 extra stuks. 📦'},\n\n  // Easy SELECT – chapter 1\n  {id:'select_active_products',ch:1,title:'Producten in stock',icon:'✅',av:'🛒',who:'Webshop Team',\n   story:'De webshop toont alleen producten met meer dan 0 stuks op voorraad. Haal alle producten op waar <strong>stock > 0</strong>.',\n   obj:'SELECT naam, prijs, stock FROM product WHERE stock > 0 ORDER BY stock DESC',\n   diff:'easy',lpd:'LPD1',xp:25,tbl:'product',time:30,\n   hint:'SELECT naam, prijs, stock\nFROM product\nWHERE stock > 0\nORDER BY stock DESC',\n   sqlType:'select',\n   check(sql){\n     const s=norm(sql);\n     if(!s.startsWith('select')) return err('Begin met SELECT naam, prijs, stock.');\n     if(!s.includes('product')) return err('Haal op FROM <strong>product</strong>.');\n     if(!s.includes('stock > 0') && !s.includes('stock>0')) return err('Filter op <strong>stock > 0</strong>.');\n     const res=runSQL(sql); if(!res.ok) return err('SQL-fout: '+res.msg);\n     return res;\n   },\n   win:'Productoverzicht klaar! De webshop toont nu alleen leverbare producten. ✅'},\n\n  // Hard SELECT subquery – chapter 4\n  {id:'subquery_top_customer',ch:4,title:'Klant met meeste bestellingen',icon:'👑',av:'📈',who:'VIP Manager',\n   story:'Zoek de naam van de klant die de <strong>meeste bestellingen</strong> heeft geplaatst. Gebruik een subquery of GROUP BY + LIMIT.',\n   obj:'SELECT k.naam, COUNT(b.bestelling_id) AS totaal FROM klant k JOIN bestelling b ON k.klant_id = b.klant_id GROUP BY k.klant_id, k.naam ORDER BY totaal DESC LIMIT 1',\n   diff:'hard',lpd:'LPD5',xp:145,tbl:'bestelling',time:110,\n   hint:'SELECT k.naam, COUNT(b.bestelling_id) AS totaal\nFROM klant k\nJOIN bestelling b ON k.klant_id = b.klant_id\nGROUP BY k.klant_id, k.naam\nORDER BY totaal DESC\nLIMIT 1',\n   sqlType:'join',\n   check(sql){\n     const s=norm(sql);\n     if(!s.startsWith('select')) return err('Begin met SELECT om de klantnaam en het berekende aantal te selecteren.');\n     if(!s.includes('join')) return err('Gebruik een <strong>JOIN</strong> op bestelling.');\n     if(!s.includes('count')) return err('Gebruik <strong>COUNT()</strong> om het aantal bestellingen te tellen.');\n     if(!s.includes('group by')) return err('Groepeer met <strong>GROUP BY</strong> op de klantvelden.');\n     if(!s.includes('limit')) return err('Beperk het resultaat tot de eerste rij met <strong>LIMIT</strong>.');\n     const res=runSQL(sql); if(!res.ok) return err('SQL-fout: '+res.msg);\n     return res;\n   },\n   win:'VIP-klant gevonden! Dit is goud voor de marketingafdeling. 👑'},\n\n  // Easy DELETE – chapter 0\n  {id:'delete_test_klant',ch:0,title:'Testklant verwijderen',icon:'🧹',av:'💻',who:'System',\n   story:'Bij de opstart werd een testklant (klant_id=99) aangemaakt. Verwijder die rij.',\n   obj:'DELETE FROM klant WHERE klant_id = 99',\n   diff:'easy',lpd:'LPD2',xp:25,tbl:'klant',time:25,\n   hint:'DELETE FROM klant\nWHERE klant_id = 99',\n   sqlType:'delete',\n   check(sql){\n     const s=norm(sql);\n     if(!s.startsWith('delete')) return err('Begin met <strong>DELETE FROM klant</strong>.');\n     if(!s.includes('klant')) return err('Verwijder uit de tabel <strong>klant</strong>.');\n     if(!s.includes('where')) return err('Voeg een <strong>WHERE</strong>-clausule toe op klant_id — anders verwijder je alle klanten!');\n     const res=runSQL(sql); if(!res.ok) return err('SQL-fout: '+res.msg);\n     return res;\n   },\n   win:'Testdata opgeruimd! De database is nu schoon. 🧹'},\n\n  // Medium JOIN – chapter 2\n  {id:'join_klant_review',ch:2,title:'Klanten met hun reviews',icon:'💬',av:'📊',who:'Alex — Data Analyst',\n   story:'Welke klanten hebben reviews geschreven? Gebruik een JOIN om namen en reviewscores samen te tonen.',\n   obj:'SELECT k.naam, r.score, r.tekst FROM klant k INNER JOIN review r ON k.klant_id = r.klant_id ORDER BY r.score DESC',\n   diff:'medium',lpd:'LPD3',xp:75,tbl:'review',time:65,\n   hint:'SELECT k.naam, r.score, r.tekst\nFROM klant k\nINNER JOIN review r ON k.klant_id = r.klant_id\nORDER BY r.score DESC',\n   sqlType:'join',\n   check(sql){\n     const s=norm(sql);\n     if(!s.startsWith('select')) return err('Begin met SELECT k.naam, r.score, r.tekst.');\n     if(!s.includes('join')) return err('Gebruik <strong>INNER JOIN review r</strong>.');\n     if(!s.includes('klant_id')) return err('Koppel de tabellen via het klant_id-veld.');\n     const res=runSQL(sql); if(!res.ok) return err('SQL-fout: '+res.msg);\n     return res;\n   },\n   win:'Review-overzicht per klant klaar! Analysts zijn blij. 📋'},

  // ── FEATURE 5: DEBUG MISSIES ──────────────────────────────────────
  // Studenten krijgen een foutieve query en moeten deze repareren

  {id:'debug_missing_groupby',ch:1,title:'🐛 Debug: GROUP BY vergeten',icon:'🐛',av:'🔧',who:'Lena — Lead Engineer',
   type:'debug',
   story:'Lena heeft een query geschreven om de <strong>totale stock per categorie</strong> te berekenen, maar krijgt een fout. Kun jij de bug vinden en repareren?',
   obj:'Herstel de query zodat de stock per categorie gegroepeerd wordt.',
   buggyQuery:'SELECT categorie, SUM(stock)\nFROM product;',
   diff:'easy',lpd:'LPD4',xp:60,tbl:'product',time:45,
   hint:'SELECT categorie, SUM(stock)\nFROM product\nGROUP BY categorie',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.includes('sum')) return err('De <code>SUM(stock)</code>-aanroep moet behouden blijven.');
     if(!s.includes('group by')) return err('De bug is: <strong>GROUP BY ontbreekt</strong>! Voeg <code>GROUP BY categorie</code> toe aan het einde.');
     if(!s.includes('categorie')) return err('Groepeer op de kolom <strong>categorie</strong>.');
     const res=runSQL(sql); if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten. Controleer de GROUP BY-clausule.');
     return res;
   },
   win:'Bug gevonden! Zonder GROUP BY kan SUM() niet per categorie berekenen. 🐛→✅'},

  {id:'debug_update_no_where',ch:1,title:'🐛 Debug: UPDATE zonder WHERE',icon:'🐛',av:'🚨',who:'Alex — Data Analyst',
   type:'debug',
   story:'Alex stuurde deze UPDATE naar productie en heeft <strong>per ongeluk alle prijzen op €99 gezet</strong>. Repareer de query zodat ze enkel de Ergonomische stoel (product_id=4) aanpast.',
   obj:'Voeg een WHERE-clausule toe zodat enkel product_id = 4 bijgewerkt wordt.',
   buggyQuery:'UPDATE product\nSET prijs = 99;',
   diff:'easy',lpd:'LPD5',xp:55,tbl:'product',time:40,
   hint:'UPDATE product SET prijs = 99 WHERE product_id = 4',
   sqlType:'update',
   check(sql){
     const s=norm(sql);
     if(!s.startsWith('update')) return err('De query moet beginnen met <code>UPDATE product</code>.');
     if(!s.includes('where')) return err('De bug is: <strong>WHERE ontbreekt</strong>! Voeg <code>WHERE product_id = 4</code> toe.');
     if(!s.includes('prijs')) return err('Behou <code>SET prijs = 99</code> in de query.');
     const res=runSQL(sql); if(!res.ok) return res;
     return res;
   },
   win:'Bug gerepareerd! WHERE is verplicht bij UPDATE. Zonder WHERE worden ALLE rijen aangepast. 🛡️'},

  {id:'debug_having_no_groupby',ch:2,title:'🐛 Debug: HAVING zonder GROUP BY',icon:'🐛',av:'📊',who:'Alex — Data Analyst',
   type:'debug',
   story:'Deze query zou klanten moeten tonen met meer dan 1 bestelling, maar gooit een fout. Repareer hem.',
   obj:'Voeg GROUP BY toe zodat HAVING correct werkt.',
   buggyQuery:'SELECT klant_id, COUNT(*) AS bestellingen\nFROM bestelling\nHAVING COUNT(*) > 1;',
   diff:'medium',lpd:'LPD4',xp:80,tbl:'bestelling',time:55,
   hint:'SELECT klant_id, COUNT(*) AS bestellingen\nFROM bestelling\nGROUP BY klant_id\nHAVING COUNT(*) > 1',
   sqlType:'select',
   check(sql){
     const s=norm(sql);
     if(!s.includes('having')) return err('Behou de <code>HAVING COUNT(*) > 1</code>-clausule.');
     if(!s.includes('group by')) return err('De bug is: <strong>HAVING vereist een GROUP BY</strong>! Voeg <code>GROUP BY klant_id</code> toe vóór HAVING.');
     const res=runSQL(sql); if(!res.ok) return res;
     if(!rowCount(res)) return err('Geen resultaten. Zijn er klanten met meer dan 1 bestelling?');
     return res;
   },
   win:'Bug gevonden! HAVING werkt altijd samen met GROUP BY — zo kun je groepen filteren na aggregatie. 🎯'},

  {id:'debug_join_no_on',ch:3,title:'🐛 Debug: JOIN zonder ON',icon:'🐛',av:'🔧',who:'Lena — Lead Engineer',
   type:'debug',
   story:'Deze JOIN-query mist de verbindingsconditie en geeft een verkeerd resultaat (kruis-product). Repareer hem.',
   obj:'Voeg de ON-clausule toe om klant en bestelling correct te koppelen.',
   buggyQuery:'SELECT klant.naam, bestelling.datum\nFROM klant\nINNER JOIN bestelling;',
   diff:'medium',lpd:'LPD4',xp:85,tbl:null,time:60,
   hint:'SELECT klant.naam, bestelling.datum\nFROM klant\nINNER JOIN bestelling ON klant.klant_id = bestelling.klant_id',
   sqlType:'join',
   check(sql){
     const s=norm(sql);
     if(!s.includes('join')) return err('Behou de <code>INNER JOIN bestelling</code>.');
     if(!s.includes(' on ')) return err('De bug is: <strong>ON ontbreekt</strong>! Voeg toe: <code>ON klant.klant_id = bestelling.klant_id</code>');
     if(!s.includes('klant_id')) return err('Koppel via het gemeenschappelijke <strong>klant_id</strong>-veld.');
     const res=runSQL(sql); if(!res.ok) return res;
     return res;
   },
   win:'Bug gevonden! Zonder ON-conditie krijg je een Cartesisch product — elke rij gecombineerd met elke rij. 🔗'},

];

const ACHIEVEMENTS = [
  {id:'first_insert', icon:'🎯', name:'Eerste INSERT',      desc:'Je eerste rij toegevoegd.'},
  {id:'first_update', icon:'✏️', name:'Data Wijziger',      desc:'Je eerste UPDATE uitgevoerd.'},
  {id:'first_delete', icon:'🗑️', name:'Opruimer',           desc:'Je eerste DELETE uitgevoerd.'},
  {id:'first_select', icon:'🔍', name:'Data Analist',       desc:'Je eerste SELECT uitgevoerd.'},
  {id:'ddl_master',   icon:'🏗️', name:'Architect',          desc:'Tabel aangemaakt of gewijzigd.'},
  {id:'speed',        icon:'⚡', name:'Snelheidsdemon',         desc:'Scenario opgelost in < 10 seconden.'},
  {id:'streak3',      icon:'🔥', name:'In Vuur en Vlam',            desc:'3 op rij correct.'},
  {id:'streak5',      icon:'🌋', name:'Vulkaan',            desc:'5 op rij correct.'},
  {id:'gdpr',         icon:'🔒', name:'GDPR-held',          desc:'Klant correct gedeactiveerd.'},
  {id:'join',         icon:'🔗', name:'JOIN Meester',        desc:'JOIN-query geslaagd.'},
  {id:'agg',          icon:'📐', name:'Aggregatie Expert',  desc:'AVG, SUM, MAX of MIN gebruikt.'},
  {id:'security',     icon:'🛡️', name:'Beveiligingschef',   desc:'Foute kortingscode gedeactiveerd.'},
  {id:'ch1',          icon:'🚀', name:'Startup CEO',        desc:'Hoofdstuk 1 voltooid.'},
  {id:'ch2',          icon:'🚨', name:'Crisis Manager',     desc:'Hoofdstuk 2 voltooid.'},
  {id:'ch3',          icon:'🧠', name:'Data Expert',        desc:'Hoofdstuk 3 voltooid.'},
  {id:'rep100',       icon:'⭐', name:'Perfecte CEO',       desc:'Reputatie op 100 gehouden.'},
  {id:'xp500',        icon:'💎', name:'500 XP Elite',       desc:'500 XP bereikt.'},
  {id:'ch4',          icon:'🧬', name:'Expert Modus',         desc:'Hoofdstuk 4 voltooid.'},
  {id:'distinct_pro',  icon:'🔎', name:'DISTINCT Pro',         desc:'DISTINCT query geslaagd.'},
  {id:'subquery_pro',  icon:'🧩', name:'Subquery Tovenaar',      desc:'Subquery in WHERE geslaagd.'},
  {id:'alias_pro',     icon:'🏷️', name:'Alias Artiest',         desc:'AS-alias query geslaagd.'},
  {id:'all_done',      icon:'🌟', name:'Data Legende',         desc:'Alle missies voltooid!'},
  {id:'ch5',           icon:'🏗️', name:'Data Architect',        desc:'Hoofdstuk 5 voltooid.'},
  {id:'inner_join_pro',icon:'🔗', name:'JOIN Meester',            desc:'INNER JOIN met ON-syntax geslaagd.'},
  {id:'left_join_pro', icon:'⬅️', name:'LEFT JOIN Expert',       desc:'LEFT JOIN met nulls geslaagd.'},
  {id:'having_pro',    icon:'🎯', name:'HAVING Tovenaar',          desc:'GROUP BY + HAVING gecombineerd.'},
  {id:'ddl_architect', icon:'🏛️', name:'Database Architect',     desc:'CREATE TABLE én ALTER TABLE uitgevoerd.'},
  {id:'xp1000',        icon:'🚀', name:'1000 XP Legende',        desc:'1000 XP bereikt.'},
  {id:'tut_complete',   icon:'🎓', name:'Tutorial Meester',          desc:'Alle tutoriallessen voltooid.'},
  {id:'sql_polyglot',   icon:'🌐', name:'SQL Polyglot',              desc:'SELECT, INSERT, UPDATE en DELETE gebruikt in missies.'},
  {id:'no_hint_ch1',    icon:'🧠', name:'Geen hints nodig',          desc:'Hoofdstuk 1 voltooid zonder één hint te gebruiken.'},
  {id:'speedster',      icon:'⚡', name:'Snelheidsduivel',           desc:'Een missie met 25+ snelheidsbonus voltooid.'},
  {id:'rep_recovered',  icon:'📈', name:'Comeback',                  desc:'Reputatie hersteld van onder 50% naar boven 80%.'},
  {id:'like_pro',       icon:'🔎', name:'Patroonzoeker',             desc:'LIKE-query met wildcard geslaagd.'},
  {id:'between_pro',    icon:'📏', name:'Bereikfilter',              desc:'BETWEEN-query geslaagd.'},
  {id:'null_hunter',    icon:'🕳️', name:'NULL Hunter',               desc:'IS NULL query geslaagd.'},
  {id:'anti_join_pro',  icon:'🚫', name:'Anti-Join Expert',          desc:'LEFT JOIN + IS NULL anti-join geslaagd.'},
  {id:'not_in_pro',     icon:'🚷', name:'NOT IN Specialist',         desc:'NOT IN subquery geslaagd.'},
  {id:'case_when_pro',  icon:'🏷️', name:'Label Artiest',             desc:'CASE WHEN query geslaagd.'},
];

const OFFICES = [
  {min:0,    e:'🏠', name:'Thuiskantoor',          desc:'Vanuit je slaapkamer. De droom is groot.',           perks:['☕ Eigen koffie']},
  {min:150,  e:'🏪', name:'Gehuurd Kantoor',       desc:'Een echt kantoor in de stad.',                       perks:['🖨️ Printer','📡 Snel WiFi']},
  {min:350,  e:'🏢', name:'DataShop HQ',           desc:'10 medewerkers, investeerders kijken toe.',           perks:['☕ Koffieautomaat','🎮 Gamekamer']},
  {min:650,  e:'🏙️', name:'Glazen Wolkenkrabber',  desc:'30e verdieping, je bent een succesverhaal.',          perks:['🍽️ Restaurant','🚁 Helipad']},
  {min:1000, e:'🌐', name:'Global DataShop',       desc:'Internationaal bedrijf. Forbes schrijft over jou.',  perks:['✈️ Privéjet','🌍 12 landen']},
  {min:1500, e:'🛰️', name:'DataShop Universe',     desc:'Jij bent de standaard. Harvard doceert over jou.',   perks:['🛰️ Eigen satelliet','📡 AI-datacenter','🏆 Nobel Data Prize']},
];

const RANKS = [
  {min:0,    title:'Startup CEO'},
  {min:150,  title:'Junior Data Analist'},
  {min:350,  title:'SQL Specialist'},
  {min:650,  title:'Senior Data Engineer'},
  {min:1000, title:'Chief Data Officer'},
  {min:1500, title:'Data Architect — Legende'},
];

// ── END datashop-data.js ──
// Continues in datashop-ui.js
