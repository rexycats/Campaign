"use strict";
// ── campaign.js ──
// Campaign mode: story-driven SQL quests with a continuous narrative.
// Depends on: datashop-engine.js, datashop-data.js, datashop-ui.js
//
// DEFENSIVE: All entry points are wrapped in try-catch so a campaign bug
// can never crash the core game (Start button, missions, etc.).

// ── CAMPAIGN DATA ─────────────────────────────────────────────────
const CAMPAIGN_QUESTS = [
  {
    id: 'camp_1',
    chapter: 1,
    title: { nl: 'De Eerste Klant', en: 'The First Customer' },
    story: {
      nl: 'Je webshop is net gelanceerd. <strong>Emma De Vries</strong> uit <strong>Brussel</strong> wil zich registreren. Haar email is <strong>emma@mail.be</strong>. Voeg haar toe als actieve klant!',
      en: 'Your webshop just launched. <strong>Emma De Vries</strong> from <strong>Brussels</strong> wants to register. Her email is <strong>emma@mail.be</strong>. Add her as an active customer!'
    },
    objective: {
      nl: 'INSERT INTO klant (naam, email, stad, actief) VALUES (\'Emma De Vries\', \'emma@mail.be\', \'Brussel\', 1)',
      en: 'INSERT INTO klant (naam, email, stad, actief) VALUES (\'Emma De Vries\', \'emma@mail.be\', \'Brussel\', 1)'
    },
    sqlType: 'insert',
    check: 'INSERT INTO klant',
    xp: 15,
    unlock: 0,  // always available
    time: 120,
  },
  {
    id: 'camp_2',
    chapter: 1,
    title: { nl: 'Inventaris Controle', en: 'Inventory Check' },
    story: {
      nl: 'De eerste orders stromen binnen! Voordat je verder gaat, moet je weten welke producten je verkoopt. <strong>Toon alle producten</strong> met hun naam en prijs.',
      en: 'First orders are coming in! Before continuing, check which products you sell. <strong>Show all products</strong> with their name and price.'
    },
    objective: {
      nl: 'SELECT naam, prijs FROM product',
      en: 'SELECT naam, prijs FROM product'
    },
    sqlType: 'select',
    check: 'SELECT',
    xp: 10,
    unlock: 1,
    time: 90,
  },
  {
    id: 'camp_3',
    chapter: 1,
    title: { nl: 'Prijzenslag', en: 'Price War' },
    story: {
      nl: 'Een concurrent verlaagt zijn prijzen! Je moet de prijs van het product met <strong>product_id = 3</strong> verlagen naar <strong>€19.99</strong> om competitief te blijven.',
      en: 'A competitor is cutting prices! You need to lower the price of the product with <strong>product_id = 3</strong> to <strong>€19.99</strong> to stay competitive.'
    },
    objective: {
      nl: 'UPDATE product SET prijs = 19.99 WHERE product_id = 3',
      en: 'UPDATE product SET prijs = 19.99 WHERE product_id = 3'
    },
    sqlType: 'update',
    check: 'UPDATE product SET',
    xp: 20,
    unlock: 2,
    time: 90,
  },
  {
    id: 'camp_4',
    chapter: 2,
    title: { nl: 'Klantanalyse', en: 'Customer Analysis' },
    story: {
      nl: 'Het marketingteam wil weten hoeveel klanten er per stad zijn. <strong>Groepeer de klanten op stad</strong> en tel ze.',
      en: 'The marketing team wants to know how many customers there are per city. <strong>Group customers by city</strong> and count them.'
    },
    objective: {
      nl: 'SELECT stad, COUNT(*) FROM klant GROUP BY stad',
      en: 'SELECT stad, COUNT(*) FROM klant GROUP BY stad'
    },
    sqlType: 'select',
    check: 'GROUP BY',
    xp: 25,
    unlock: 3,
    time: 120,
  },
  {
    id: 'camp_5',
    chapter: 2,
    title: { nl: 'Bestellingen Koppelen', en: 'Linking Orders' },
    story: {
      nl: 'De CEO wil een overzicht: welke <strong>klant</strong> heeft welke <strong>bestelling</strong> geplaatst? Gebruik een <strong>JOIN</strong> om klant- en bestellingtabellen te koppelen.',
      en: 'The CEO wants an overview: which <strong>customer</strong> placed which <strong>order</strong>? Use a <strong>JOIN</strong> to link the customer and order tables.'
    },
    objective: {
      nl: 'SELECT k.naam, b.bestelling_id FROM klant k JOIN bestelling b ON k.klant_id = b.klant_id',
      en: 'SELECT k.naam, b.bestelling_id FROM klant k JOIN bestelling b ON k.klant_id = b.klant_id'
    },
    sqlType: 'select',
    check: 'JOIN',
    xp: 30,
    unlock: 4,
    time: 150,
  },
];

// ── CAMPAIGN STATE ────────────────────────────────────────────────
const CAMP = {
  doneQuests: new Set(),
  _timers: {},  // campaign-specific timer handles

  init() {
    // Load saved campaign progress
    try {
      const saved = localStorage.getItem('datashop_campaign');
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.done && Array.isArray(data.done)) {
          this.doneQuests = new Set(data.done);
        }
      }
    } catch (e) {
      console.warn('Campaign: could not load saved progress', e);
    }
  },

  save() {
    try {
      localStorage.setItem('datashop_campaign', JSON.stringify({
        done: [...this.doneQuests]
      }));
    } catch (e) { /* ignore — quota or sandboxed */ }
  },

  isUnlocked(quest) {
    if (!quest) return false;
    return this.doneQuests.size >= quest.unlock;
  },

  render() {
    try {
      this._renderInner();
    } catch (e) {
      console.warn('Campaign render error:', e);
      // Don't let a render crash propagate
    }
  },

  _renderInner() {
    const content = document.getElementById('camp-content');
    if (!content) return;

    const lang = (typeof LANG !== 'undefined') ? LANG : 'nl';
    const done = this.doneQuests.size;
    const total = CAMPAIGN_QUESTS.length;
    const pct = total ? Math.round(done / total * 100) : 0;

    // Update progress bar
    const fill = document.getElementById('camp-prog-fill');
    const lbl = document.getElementById('camp-prog-lbl');
    if (fill) fill.style.width = pct + '%';
    if (lbl) lbl.textContent = done + '/' + total + ' · ' + pct + '%';

    if (!CAMPAIGN_QUESTS.length) {
      content.innerHTML = '<div class="empty-state">' + (typeof t === 'function' ? t('camp_no_quests') : 'Geen quests beschikbaar.') + '</div>';
      return;
    }

    // Group by chapter
    const chapters = {};
    CAMPAIGN_QUESTS.forEach(function(q) {
      if (!chapters[q.chapter]) chapters[q.chapter] = [];
      chapters[q.chapter].push(q);
    });

    var html = '';
    var self = this;
    Object.entries(chapters).forEach(function(entry) {
      var ch = entry[0];
      var quests = entry[1];
      html += '<div class="camp-chapter">';
      html += '<div class="camp-chapter-title">' + (lang === 'nl' ? 'Hoofdstuk ' : 'Chapter ') + ch + '</div>';
      quests.forEach(function(q) {
        var isDone = self.doneQuests.has(q.id);
        var unlocked = self.isUnlocked(q);
        var title = (q.title && q.title[lang]) || (q.title && q.title.nl) || q.id;
        var story = (q.story && q.story[lang]) || (q.story && q.story.nl) || '';
        var obj = (q.objective && q.objective[lang]) || (q.objective && q.objective.nl) || '';

        var escFn = (typeof esc === 'function') ? esc : function(s) { return String(s || ''); };

        html += '<div class="sc-card ' + (isDone ? 'done' : '') + (unlocked ? '' : ' locked') + '" id="camp-' + q.id + '">';
        html += '<div class="sc-header" data-action="toggle-camp-quest" data-quest="' + q.id + '" aria-expanded="false">';
        html += '<div class="sc-left">';
        html += '<span class="sc-status">' + (isDone ? '✅' : unlocked ? '⚔️' : '🔒') + '</span>';
        html += '<div><div class="sc-title">' + escFn(title) + '</div>';
        html += '<div class="sc-meta"><span class="sc-diff ' + q.sqlType + '">' + q.sqlType.toUpperCase() + '</span>';
        html += '<span class="sc-xp">+' + q.xp + ' XP</span>';
        if (q.time) html += '<span class="sc-timer-badge">⏱ ' + q.time + 's</span>';
        html += '</div></div></div>';
        html += '<span class="sc-chevron" id="camp-chev-' + q.id + '">▸</span>';
        html += '</div>';

        // Body (initially hidden)
        html += '<div class="sc-body" id="camp-body-' + q.id + '">';
        html += '<div class="sc-story">' + story + '</div>';
        html += '<div class="sc-obj"><strong>' + (lang === 'nl' ? 'Doel:' : 'Objective:') + '</strong> <code>' + escFn(obj) + '</code></div>';
        if (!isDone && unlocked) {
          html += '<div class="sc-input-area">';
          html += '<div class="timer-wrap" id="camp-timer-' + q.id + '">';
          html += '<div class="timer-bar"><div class="timer-fill" id="camp-tb-' + q.id + '"></div></div>';
          html += '<div class="timer-count" id="camp-tn-' + q.id + '"></div>';
          html += '</div>';
          html += '<textarea class="sql-input" id="camp-sql-' + q.id + '" placeholder="' + (lang === 'nl' ? 'Schrijf je SQL hier...' : 'Write your SQL here...') + '" spellcheck="false"></textarea>';
          html += '<div class="sc-actions">';
          html += '<button class="btn btn-primary btn-sm" data-action="camp-run" data-quest="' + q.id + '">▶ Run</button>';
          html += '</div>';
          html += '<div class="feedback" id="camp-fb-' + q.id + '"></div>';
          html += '</div>';
        } else if (isDone) {
          html += '<div class="feedback ok visible">' + (typeof t === 'function' ? t('camp_quest_completed') : '✅ Quest voltooid!') + '</div>';
        } else {
          html += '<div class="feedback hint visible">🔒 ' + (typeof t === 'function' ? t('camp_quest_locked') : 'Voltooi eerdere quests om te ontgrendelen.') + '</div>';
        }
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    });

    content.innerHTML = html;
  },

  toggleQuest(id) {
    try {
      this._toggleQuestInner(id);
    } catch (e) {
      console.warn('Campaign toggleQuest error:', e);
    }
  },

  _toggleQuestInner(id) {
    const body = document.getElementById('camp-body-' + id);
    const chev = document.getElementById('camp-chev-' + id);
    if (!body) return;
    const wasOpen = body.classList.contains('open');

    // Close all
    var campContent = document.getElementById('camp-content');
    if (campContent) {
      campContent.querySelectorAll('.sc-body').forEach(function(b) { b.classList.remove('open'); });
      campContent.querySelectorAll('.sc-chevron').forEach(function(c) { c.classList.remove('open'); });
    }

    // Clear any running campaign timer
    this._clearTimer(id);

    if (!wasOpen) {
      body.classList.add('open');
      if (chev) chev.classList.add('open');

      // Start timer if quest has one and not done
      const quest = CAMPAIGN_QUESTS.find(function(q) { return q.id === id; });
      if (quest && quest.time && !this.doneQuests.has(id) && this.isUnlocked(quest)) {
        this._startTimer(id, quest.time);
      }
    }
  },

  _clearTimer(id) {
    if (this._timers[id]) {
      cancelAnimationFrame(this._timers[id]);
      delete this._timers[id];
    }
  },

  _startTimer(id, secs) {
    this._clearTimer(id);
    const self = this;
    const end = Date.now() + secs * 1000;
    function tick() {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      const numEl = document.getElementById('camp-tn-' + id);
      const barEl = document.getElementById('camp-tb-' + id);
      if (numEl) {
        numEl.textContent = left + 's';
        numEl.className = 'timer-count' + (left <= 10 ? ' danger' : left <= 20 ? ' warn' : '');
      }
      if (barEl) {
        barEl.style.width = (left / secs * 100) + '%';
        barEl.className = 'timer-fill' + (left <= 10 ? ' danger' : left <= 20 ? ' warn' : '');
      }
      if (left <= 0) {
        self._clearTimer(id);
        const fb = document.getElementById('camp-fb-' + id);
        if (fb) {
          fb.className = 'feedback hint visible';
          var lang = (typeof LANG !== 'undefined') ? LANG : 'nl';
          fb.innerHTML = '⏰ <strong>' + (lang === 'nl' ? 'Tijd voorbij!' : 'Time\'s up!') + '</strong> ' + (lang === 'nl' ? 'Probeer opnieuw.' : 'Try again.');
        }
        return;
      }
      self._timers[id] = requestAnimationFrame(tick);
    }
    self._timers[id] = requestAnimationFrame(tick);
  },

  runQuest(id) {
    try {
      this._runQuestInner(id);
    } catch (e) {
      console.warn('Campaign runQuest error:', e);
      var fb = document.getElementById('camp-fb-' + id);
      if (fb) {
        fb.className = 'feedback err visible';
        fb.innerHTML = '⚠️ Er ging iets mis. Probeer opnieuw.';
      }
    }
  },

  _runQuestInner(id) {
    var quest = CAMPAIGN_QUESTS.find(function(q) { return q.id === id; });
    if (!quest || this.doneQuests.has(id) || !this.isUnlocked(quest)) return;

    var ta = document.getElementById('camp-sql-' + id);
    var fb = document.getElementById('camp-fb-' + id);
    if (!ta || !fb) return;

    var sql = ta.value.trim();
    if (!sql) {
      fb.className = 'feedback err visible';
      var lang = (typeof LANG !== 'undefined') ? LANG : 'nl';
      fb.innerHTML = '⚠️ ' + (lang === 'nl' ? 'Voer een SQL-query in.' : 'Enter an SQL query.');
      return;
    }

    // Check that runSQL exists
    if (typeof runSQL !== 'function') {
      fb.className = 'feedback err visible';
      fb.innerHTML = '⚠️ SQL engine niet beschikbaar.';
      return;
    }

    // Run the SQL
    var res = runSQL(sql);
    if (!res || !res.ok) {
      fb.className = 'feedback err visible';
      var escFn = (typeof esc === 'function') ? esc : function(s) { return String(s || ''); };
      fb.innerHTML = '❌ ' + escFn((res && res.msg) || 'SQL fout.');
      return;
    }

    // Check if the query matches the expected pattern
    var normalSql = sql.toLowerCase().replace(/\s+/g, ' ');
    var checkStr = (quest.check || '').toLowerCase();
    if (!normalSql.includes(checkStr)) {
      fb.className = 'feedback hint visible';
      var lang2 = (typeof LANG !== 'undefined') ? LANG : 'nl';
      fb.innerHTML = '🤔 ' + (lang2 === 'nl' ? 'Query uitgevoerd, maar dit is niet wat de opdracht vraagt. Probeer opnieuw.' : 'Query executed, but this is not what the assignment asks. Try again.');
      return;
    }

    // Quest completed!
    this.doneQuests.add(id);
    this.save();
    this._clearTimer(id);

    // Award XP safely — check every reference before using
    if (typeof G !== 'undefined' && G !== null) {
      G.xp = (G.xp || 0) + (quest.xp || 0);
      if (typeof UI !== 'undefined' && UI !== null) {
        if (typeof UI.updateXP === 'function') {
          try { UI.updateXP(); } catch(e) { console.warn('Campaign: UI.updateXP error', e); }
        }
        if (typeof UI.xpPop === 'function') {
          try { UI.xpPop('+' + (quest.xp || 0) + ' XP'); } catch(e) { /* ignore */ }
        }
        if (typeof UI.addEvent === 'function') {
          try {
            var escFn2 = (typeof esc === 'function') ? esc : function(s) { return String(s || ''); };
            var lang3 = (typeof LANG !== 'undefined') ? LANG : 'nl';
            var titleStr = (quest.title && quest.title[lang3]) || (quest.title && quest.title.nl) || quest.id;
            UI.addEvent(
              'ok',
              '⚔️ Campaign quest voltooid: <strong>' + escFn2(titleStr) + '</strong>',
              true
            );
          } catch(e) { /* ignore */ }
        }
      }
      if (typeof save === 'function') {
        try { save(); } catch(e) { console.warn('Campaign: save() error', e); }
      }
    }

    fb.className = 'feedback ok visible';
    fb.innerHTML = '✅ Quest voltooid! +' + (quest.xp || 0) + ' XP';

    // Re-render after short delay to show next quest unlocked
    var self = this;
    setTimeout(function() {
      try { self.render(); } catch(e) { /* ignore */ }
    }, 1500);
  },
};

// ── EVENT DELEGATION FOR CAMPAIGN ─────────────────────────────────
// IMPORTANT: Only handle campaign-specific actions. Never interfere with
// other data-action handlers (start-game, toggle-sc, etc.).
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-action]');
  if (!el) return;

  var action = el.dataset.action;

  // Only handle campaign actions — ignore everything else
  if (action === 'toggle-camp-quest') {
    CAMP.toggleQuest(el.dataset.quest);
    return;
  }
  if (action === 'camp-run') {
    CAMP.runQuest(el.dataset.quest);
    return;
  }
  // All other actions: do nothing, let the main event handler process them
});

// ── HOOK INTO PANEL SHOW ──────────────────────────────────────────
// Safely patch UI.showPanel to render campaign when its panel opens.
// Uses a delayed check so this works even if UI is defined later.
(function patchShowPanel() {
  try {
    if (typeof UI === 'undefined' || !UI || typeof UI.showPanel !== 'function') {
      // UI not yet available — should not happen given script load order,
      // but don't crash if it does.
      console.warn('Campaign: UI.showPanel not available for patching.');
      return;
    }
    var _origShowPanel = UI.showPanel;
    UI.showPanel = function (name) {
      // Always call the original first — campaign must never block panel switching
      _origShowPanel.call(UI, name);
      if (name === 'camp') {
        try {
          CAMP.init();
          CAMP.render();
        } catch (e) {
          console.warn('Campaign: render error on panel show', e);
        }
      }
    };
  } catch (e) {
    console.warn('Campaign: could not patch showPanel', e);
  }
})();

// Initialize campaign on load — wrapped for safety
try { CAMP.init(); } catch (e) { console.warn('Campaign init error', e); }
