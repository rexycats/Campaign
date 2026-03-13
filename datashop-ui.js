"use strict";
// ── datashop-ui.js ──
// UI, APP logic, Timer, Daily, Tutorial, Settings, Theme, Syntax Highlighter, Init, Events
// Depends on: datashop-engine.js + datashop-data.js


// ── TIMER ─────────────────────────────────────────────────────────
const timers  = {};
const tStart  = {};

function startTimer(id, secs) {
  clearTimer(id);
  tStart[id] = Date.now();
  const end  = Date.now() + secs * 1000;
  function tick() {
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    const numEl = $('tn-'+id);
    const barEl = $('tb-'+id);
    if (numEl) {
      numEl.textContent = left + 's';
      numEl.className = 'timer-count' + (left<=10?' danger':left<=20?' warn':'');
    }
    if (barEl) {
      barEl.style.width = (left / secs * 100) + '%';
      barEl.className = 'timer-fill' + (left<=10?' danger':left<=20?' warn':'');
    }
    if (left <= 0) { clearTimer(id); onTimeout(id); return; }
    timers[id] = requestAnimationFrame(tick);
  }
  timers[id] = requestAnimationFrame(tick);
}

function clearTimer(id) {
  if (timers[id]) cancelAnimationFrame(timers[id]);
  delete timers[id]; delete tStart[id];
}

function clearAllTimers() { Object.keys(timers).forEach(clearTimer); }

// ── TIMER PAUZEREN BIJ TABWISSEL ──────────────────────────────────
// Wanneer een leerling van tab wisselt loopt de timer door in Date.now()
// maar requestAnimationFrame pauzeert → tijd-delta klopt niet meer.
// We bewaren de resterende tijd en hervatten correct bij terugkeer.
const _timerPaused = {};  // id → resterende milliseconden bij pauzeren
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pauzeer: sla resterende tijd op
    Object.keys(timers).forEach(id => {
      const numEl = document.getElementById('tn-' + id);
      if (numEl) {
        const left = parseInt(numEl.textContent) || 0;
        _timerPaused[id] = left;
      }
      cancelAnimationFrame(timers[id]);
      delete timers[id];
    });
  } else {
    // Hervat: start opnieuw met de bewaarde resterende tijd
    Object.keys(_timerPaused).forEach(id => {
      const left = _timerPaused[id];
      delete _timerPaused[id];
      if (left > 0) startTimer(id, left);
      else onTimeout(id);
    });
  }
});

function onTimeout(id) {
  const fb = $('fb-'+id);
  const sc = SCENARIOS.find(s => s.id === id);
  const typeHints = {
    select: 'Begin met <code>SELECT kolommen FROM tabel WHERE …</code>',
    insert: 'Begin met <code>INSERT INTO tabel (kolommen) VALUES (…)</code>',
    update: 'Begin met <code>UPDATE tabel SET kolom = waarde WHERE …</code> — vergeet WHERE niet!',
    delete: 'Begin met <code>DELETE FROM tabel WHERE …</code> — vergeet WHERE niet!',
    ddl:    'Gebruik <code>CREATE TABLE naam (…)</code> of <code>ALTER TABLE naam ADD COLUMN …</code>',
  };
  const nudge = sc ? (typeHints[sc.sqlType] || typeHints.select) : typeHints.select;
  if (fb) {
    fb.className='feedback hint visible';
    fb.innerHTML=`⏰ <strong>${t('js_timeout_title')}</strong> SQL schrijven kost oefening.<br>
      <span class="u-label-sm">💡 ${t('js_timeout_tip')} ${nudge}</span><br>
      <span class="u-muted">${t('js_timeout_hint')}</span>`;
  }
  // Geen reputatieschade bij timeout — tijdsdruk mag niet demotiveren
  UI.addEvent('warn', t('js_timeout_event'));
}

// ── UI ────────────────────────────────────────────────────────────
const UI = {
  activeCh: 0,
  activeFilter: 'all',
  searchQuery: '',
  openSc: null,
  hintUsed: {},  // Bug 1 fix: per-scenario hint tracking, keyed by scenario id
  hintLevel: {},   // id → current hint level (0=concept, 1=direction, 2=solution)
  hintL3Used: {},  // Feature 1: tracks if L3 hint was used (blocks bonuses)
  curTbl: 'klant',

  updateKPIs() {
    const s = dbStats();
    $('kpi-klant').textContent = s.klanten;
    $('kpi-orders').textContent = s.orders;
    EL['kpi-rep'].textContent   = G.rep;
    EL['kpi-rep'].className = 'kpi-val' + (G.rep>=80?' good':G.rep>=50?' warn':' bad');
    $('kpi-xp').textContent    = G.xp;
    $('rep-pct').textContent   = G.rep + '%';
    const fill = $('rep-fill');
    fill.style.width = G.rep + '%';
    fill.className = 'rep-fill ' + (G.rep<50 ? 'rep-fill--danger' : G.rep<75 ? 'rep-fill--warn' : 'rep-fill--good');
  },

  damageRep(n) {
    const was = G.rep;
    G.rep = Math.max(0, G.rep - n);
    this.updateKPIs();
    // Drempel-events: reputatie heeft nu betekenis
    if (was >= 80 && G.rep < 80) {
      this.addEvent('warn', t('js_rep_low'));
    }
    if (was >= 50 && G.rep < 50) {
      this.addEvent('err', t('js_rep_critical'));
      this.showRepWarning();
    }
    if (G.rep === 0) {
      this.addEvent('err', t('js_rep_zero'));
    }
  },

  showRepWarning() {
    const popup = document.createElement('div');
    popup.className = 'rep-warning-popup';
    const emoji = document.createElement('div');
    emoji.className = 'rep-critical-popup-emoji';
    setText(emoji, '😱');
    const title = document.createElement('div');
    title.className = 'rep-critical-popup-title';
    setText(title, t('js_rep_critical_title'));
    const body = document.createElement('div');
    body.className = 'rep-critical-popup-body';
    setText(body, t('js_rep_critical_body'));
    const btn = document.createElement('button');
    btn.className = 'btn btn-danger btn-sm';
    setText(btn, t('js_rep_critical_btn'));
    btn.addEventListener('click', function() {
      popup.classList.remove('visible');
      setTimeout(() => popup.remove(), 400);
    });
    popup.appendChild(emoji);
    popup.appendChild(title);
    popup.appendChild(body);
    popup.appendChild(btn);
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('visible'), 50);
    setTimeout(() => { popup.classList.remove('visible'); setTimeout(() => popup.remove(), 400); }, 5000);
  },

  addEvent(type, txt, isBusiness) {
    const ts = new Date().toLocaleTimeString('nl-BE',{hour:'2-digit',minute:'2-digit'});
    // Categoriseer: bedrijfsevents vs systeem/debug events
    const biz = isBusiness !== undefined ? isBusiness : (type === 'ok' && !txt.includes('reeks') && !txt.includes('reputatie'));
    G.events.unshift({type, txt, t: ts, biz});
    if (G.events.length > 30) G.events.pop();
    this._renderFeed();
  },

  _renderFeed() {
    const bizEl = $('ev-list-biz');
    const sysEl = $('ev-list-sys');
    const bizEvents = G.events.filter(e => e.biz).slice(0,6);
    const sysEvents = G.events.filter(e => !e.biz).slice(0,6);
    const renderItems = (evts, container) => {
      container.innerHTML = '';
      if (!evts.length) {
        const empty = document.createElement('div');
        empty.className = 'feed-item';
        const emptyText = document.createElement('div');
        emptyText.className = 'feed-text feed-text--muted';
        emptyText.textContent = t('js_feed_empty');
        empty.appendChild(emptyText);
        container.appendChild(empty);
        return;
      }
      evts.forEach(e => {
        const row = document.createElement('div');
        row.className = 'feed-item';
        const dot = document.createElement('div');
        dot.className = 'feed-dot ' + e.type;
        const text = document.createElement('div');
        text.className = 'feed-text';
        setHTML(text, e.txt);
        const time = document.createElement('div');
        time.className = 'feed-time';
        time.textContent = e.t;
        row.appendChild(dot);
        row.appendChild(text);
        row.appendChild(time);
        container.appendChild(row);
      });
    };
    if (bizEl) renderItems(bizEvents, bizEl);
    if (sysEl) renderItems(sysEvents, sysEl);
    // Legacy single feed
    const el = $('ev-list');
    if (el && !bizEl) {
      el.innerHTML = '';
      G.events.slice(0,8).forEach(e => {
        const row = document.createElement('div');
        row.className = 'feed-item';
        const dot = document.createElement('div');
        dot.className = 'feed-dot ' + e.type;
        const text = document.createElement('div');
        text.className = 'feed-text';
        setHTML(text, e.txt);
        const time = document.createElement('div');
        time.className = 'feed-time';
        time.textContent = e.t;
        row.appendChild(dot);
        row.appendChild(text);
        row.appendChild(time);
        el.appendChild(row);
      });
    }
  },

  renderDash() {
    const s = dbStats();
    // Tutorial voortgangskaart op dashboard
    const tutDone  = TUT.totalDone();
    const tutTotal = TUT.totalLessons();
    const tutPct   = tutTotal ? Math.round(tutDone / tutTotal * 100) : 0;
    const tutCard  = $('dash-tut-card');
    if (tutCard) {
      tutCard.querySelector('.dash-tut-fill').style.width = tutPct + '%';
      tutCard.querySelector('.dash-tut-pct').textContent  = tutDone + '/' + tutTotal + ' ' + t('js_lessen') + ' · ' + tutPct + '%';
    }
    // Feature 4: Skill Mastery Bars + Badges
    const masteryEl = $('mastery-grid');
    if (masteryEl) {
      const icons = { select:'🔍', insert:'➕', update:'✏️', delete:'🗑️', ddl:'🏗️' };
      const labels = { select:'SELECT', insert:'INSERT', update:'UPDATE', delete:'DELETE', ddl:'DDL' };
      masteryEl.innerHTML = conceptMastery().map(m => `
        <div class="mastery-tile">
          <div class="mastery-tile-head">
            <div class="mastery-tile-icon mastery-tile-icon--sql">${icons[m.type]}</div>
            <span class="mastery-tile-type">${labels[m.type]}</span>
          </div>
          <div class="mastery-count">${m.done} / ${m.total} missies</div>
          <div class="mastery-bar-track"><div class="mastery-bar-fill ${m.pct===100?'full':''}" data-w="${m.pct}"></div></div>
          <div class="mastery-pct">${m.pct}%</div>
        </div>`).join('');
      applyBarWidths(masteryEl);
    }
    // Feature 4: Skill Mastery Bars (advanced breakdown)
    const skillEl = $('skill-mastery-panel');
    if (skillEl) {
      const smap = skillMastery();
      const barsHtml = SKILL_TYPES.map(st => {
        const m = smap[st.key] || { done: 0, total: 0, pct: 0 };
        const mastered = m.pct >= 80;
        return `<div class="skill-bar-row">
          <div class="skill-bar-label">${st.label}</div>
          <div class="skill-bar-track"><div class="skill-bar-fill ${mastered?'mastered':''}" data-w="${m.pct}" data-color="${mastered?'var(--green)':st.color}"></div></div>
          <div class="skill-bar-pct">${m.pct}%</div>
        </div>`;
      }).join('');
      const badgesHtml = MASTERY_BADGES.map(b => {
        const m = smap[b.skill] || { pct: 0 };
        const isUnlocked = m.pct >= b.threshold;
        return `<span class="mastery-badge ${isUnlocked?'unlocked':''}">${isUnlocked?'✓ ':''} ${b.label}</span>`;
      }).join('');
      skillEl.innerHTML = `<div class="skill-mastery-wrap">${barsHtml}</div><div class="mastery-badge-row">${badgesHtml}</div>`;
      applyBarWidths(skillEl);
      applyBarColors(skillEl);
    }
    const el = $('stat-grid');
    if (!el) return;
    el.innerHTML = [
      {i:'👥', v:s.klanten,   l:'Klanten',      t:s.actief+' actief',        up:true},
      {i:'🛒', v:s.orders,    l:'Bestellingen', t:s.open+' open',            up:true},
      {i:'💶', v:'€'+Number(s.revenue).toFixed(0), l:'Omzet', t:'Cumulatief', up:true},
      {i:'⭐', v:s.avgScore,  l:t('js_kpi_avg_review'),  t:t('js_kpi_avg_review_t'),        up:Number(s.avgScore)>=4},
      {i:'📦', v:s.uitverkocht, l:t('js_kpi_out_of_stock'), t:s.uitverkocht>0?t('js_kpi_action_needed'):t('js_kpi_all_in_stock'), up:s.uitverkocht===0},
      {i:'🏆', v:G.rep+'%',  l:t('kpi_reputation'),    t:G.rep>=80?t('js_kpi_rep_great'):t('js_kpi_rep_warn'), up:G.rep>=80},
    ].map(c=>`<div class="stat-tile">
        <div class="stat-icon">${c.i}</div>
        <div class="stat-val">${esc(String(c.v))}</div>
        <div class="stat-label">${esc(c.l)}</div>
        <div class="stat-trend ${c.up?'trend-up':'trend-dn'}">${esc(c.t)}</div>
      </div>`).join('');
  },

  renderOfficeCard() {
    const off = OFFICES.slice().reverse().find(o => G.xp >= o.min) || OFFICES[0];
    const el = $('office-display');
    if (!el) return;
    $('sb-office').textContent = off.e;
    el.innerHTML = `<div class="office-card">
      <div class="office-emoji">${off.e}</div>
      <div class="office-info">
        <h3>${esc(off.name)}</h3>
        <p>${esc(off.desc)}</p>
        <div class="office-perks">${off.perks.map(p=>`<span class="perk">${esc(p)}</span>`).join('')}</div>
      </div>
    </div>`;
  },

  updateXP() {
    const rank  = RANKS.slice().reverse().find(r => G.xp >= r.min) || RANKS[0];
    const next  = RANKS.find(r => r.min > G.xp);
    const pct   = next ? Math.round((G.xp - rank.min) / (next.min - rank.min) * 100) : 100;
    $('sb-rank').textContent   = rank.title;
    $('sb-xp').textContent     = G.xp + ' XP';
    // Feature 8: XP bar animation
    const xpBar = $('xp-fill');
    xpBar.style.width = Math.min(pct, 100) + '%';
    xpBar.closest('.xp-bar-wrap')?.classList.add('xp-bar-animating');
    setTimeout(() => xpBar.closest('.xp-bar-wrap')?.classList.remove('xp-bar-animating'), 900);
    $('xp-to-next').textContent = next ? (next.min - G.xp) + ' ' + t('js_xp_next') + ' ' + next.title : t('js_max_level');
    $('streak-val').textContent = G.streak;
    $('streak-card').classList.toggle('hot', G.streak >= 3);
    // Feature 7: show streak shields
    const shieldRow = $('shield-row');
    const shieldCount = $('shield-count');
    if (shieldRow && shieldCount) {
      shieldCount.textContent = G.streakShields || 0;
      shieldRow.classList.toggle('u-hidden', !(G.streakShields > 0));
    }
  },

  xpPop(txt) {
    const el = $('xp-popup');
    el.textContent = txt;
    el.classList.remove('animate', 'xp-gain-pop');
    void el.offsetWidth;
    el.classList.add('animate', 'xp-gain-pop');
    setTimeout(() => el.classList.remove('animate', 'xp-gain-pop'), 1600);
  },

  renderScenarios() {
    const done=G.done.size, total=SCENARIOS.length;
    const pct = total ? Math.round(done/total*100) : 0;
    $('prog-fill').style.width  = pct + '%';
    $('prog-lbl').textContent   = done+'/'+total+' · '+pct+'% '+t('js_progress_done');
    const badge    = $('nav-badge');
    const pending  = SCENARIOS.filter(s => !G.done.has(s.id)).length;
    badge.textContent    = pending;
    badge.classList.toggle('u-hidden', !pending);

    $('ch-tabs').innerHTML = CHAPTERS.map(ch => {
      const chDone  = SCENARIOS.filter(s=>s.ch===ch.id&&G.done.has(s.id)).length;
      const chTotal = SCENARIOS.filter(s=>s.ch===ch.id).length;
      const locked  = G.done.size < ch.unlock;
      const allDone = chDone===chTotal;
      return `<button class="ch-tab ${this.activeCh===ch.id?'active':''} ${locked?'locked':''} ${allDone&&!locked?'done':''}"
        data-action="set-ch" data-ch="${ch.id}">${esc(ch.title)} ${locked?'🔒':chDone+'/'+chTotal}</button>`;
    }).join('');

    let list = SCENARIOS.filter(s => s.ch === this.activeCh);
    if (this.activeFilter==='easy')   list = list.filter(s=>s.diff==='easy');
    if (this.activeFilter==='medium') list = list.filter(s=>s.diff==='medium');
    if (this.activeFilter==='hard')   list = list.filter(s=>s.diff==='hard');
    if (this.activeFilter==='done')   list = list.filter(s=>G.done.has(s.id));
    if (['select','insert','update','delete','ddl','join'].includes(this.activeFilter))
      list = list.filter(s=>s.sqlType===this.activeFilter);
    // Zoekfilter
    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        (s.story||'').toLowerCase().includes(q) ||
        (s.sqlType||'').includes(q) ||
        (s.tbl||'').includes(q)
      );
    }

    // Update count row
    const countRow = $('sc-count-row');
    if (countRow) {
      const total_shown = list.length;
      const done_shown = list.filter(s => G.done.has(s.id)).length;
      countRow.innerHTML = total_shown
        ? `<span class="sc-count-num">${total_shown}</span> missies · <span class="sc-count-num">${done_shown}</span> voltooid`
        : '';
    }

    const diffColor = {easy:'rgba(74,222,128,.12)',medium:'rgba(251,146,60,.12)',hard:'rgba(248,113,113,.12)'};
    const diffTag   = {easy:'tag-easy', medium:'tag-medium', hard:'tag-hard'};
    const diffLabel = {easy: t('js_diff_easy'), medium: t('js_diff_medium'), hard: t('js_diff_hard')};
    const typeIconBg     = {select:'rgba(34,211,238,.15)',insert:'rgba(74,222,128,.15)',update:'rgba(251,146,60,.15)',delete:'rgba(248,113,113,.15)',ddl:'rgba(167,139,250,.15)'};
    const typeIconBorder = {select:'rgba(34,211,238,.3)', insert:'rgba(74,222,128,.3)', update:'rgba(251,146,60,.3)', delete:'rgba(248,113,113,.3)', ddl:'rgba(167,139,250,.3)'};

    if (!list.length) {
      EL['sc-list'].innerHTML = `<div class="sc-empty-state" id="__sc_empty">
        ${UI.searchQuery ? '🔍 ' + t('js_sc_no_results') + ' "'+esc(UI.searchQuery)+'"' : t('js_sc_no_selection')}
        <br><br><button class="btn btn-outline btn-sm" data-action="show-all-missions">${t('js_sc_show_all')}</button>
      </div>`;
      return;
    }
    EL['sc-list'].innerHTML = list.map(sc => {
      const isDone = G.done.has(sc.id);
      return `<div class="sc-card ${isDone?'done':''} ${sc.urgent&&!isDone?'urgent':''}" id="sc-${sc.id}" data-sql-type="${(sc.sqlType||'select').toUpperCase()}">
        <div class="sc-header" data-action="toggle-sc" data-sc="${sc.id}" role="button" aria-expanded="false">
          <div class="sc-icon" data-sqltype="${sc.sqlType||''}" data-diff="${sc.diff||''}">${sc.icon}</div>
          <div class="sc-meta">
            <div class="sc-title-row">
              <span class="sc-title">${UI.searchQuery ? esc(sc.title).replace(new RegExp('(' + UI.searchQuery.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi'), '<mark class="search-hl">$1</mark>') : esc(sc.title)}</span>
              ${isDone?`<span class="tag tag-done">${t('js_sc_done_tag')}</span>`:''}
              ${sc.urgent&&!isDone?'<span class="tag tag-urgent">Urgent</span>':''}
              ${sc.type==='debug'?'<span class="debug-badge">DEBUG</span>':''}
            </div>
            <div class="sc-chapter">${esc(CHAPTERS[sc.ch].title.split(' ').slice(2).join(' '))}</div>
            <div class="sc-tags">
              <span class="tag ${diffTag[sc.diff]}">${diffLabel[sc.diff]}</span>
              <span class="tag tag-xp">+${sc.xp} XP</span>
              <span class="tag tag-lpd">${esc(sc.lpd)}</span>
              ${sc.sqlType?`<span class="tag tag-sql-type">${sc.sqlType.toUpperCase()}</span>`:''}
              ${sc.time?`<span class="tag tag-time">⏱ ${sc.time}s</span>`:''}
            </div>
          </div>
          <div class="sc-chevron" id="chev-${sc.id}">›</div>
        </div>
        <div class="sc-body" id="scb-${sc.id}">
          ${(() => {
            // Concept intro: toon alleen als dit het eerste scenario is van dit sqlType of conceptType
            // en de speler het concept nog niet eerder gezien heeft
            const type = sc.conceptType || sc.sqlType;
            const ci = type && !seenConcept(type) && CONCEPT_INTRO[type];
            if (!ci || isDone) return '';
            return `<div class="concept-intro-box" id="ci-${sc.id}">
              <div class="concept-intro-head">
                <div class="concept-intro-icon">${ci.icon}</div>
                <div>
                  <div class="concept-intro-label">${t('js_new_concept')}</div>
                  <div class="concept-intro-title">${ci.title}</div>
                </div>
              </div>
              <div class="concept-intro-body">${ci.body}</div>
              <div class="concept-intro-tip">${ci.tip}</div>
            </div>`;
          })()}
          <div class="story-block">
            <div class="story-avatar">${sc.av}</div>
            <div>
              <div class="story-who">${esc(sc.who)}</div>
              <div class="story-text">${sc.story}</div>
            </div>
          </div>
          ${sc.type==='debug'&&sc.buggyQuery?`<div class="debug-buggy-code"><span class="debug-buggy-label">🐛 FOUTIEVE QUERY — repareer dit:</span>${esc(sc.buggyQuery)}</div>`:''}
          ${scTutLink(sc.id)}
          ${sc.time&&!isDone?`
          <div class="timer-bar">
            <div class="timer-count" id="tn-${sc.id}">${sc.time}s</div>
            <span class="timer-icon">⏱</span>
            <div class="timer-track"><div class="timer-fill" id="tb-${sc.id}"></div></div>
          </div>`:''}
          <div class="obj-box">${esc(sc.obj)}</div>
          <div class="penalty-box">${t('js_penalty_box')}</div>
          ${sc.tbl?`<div class="table-viewer" id="tv-${sc.id}">${renderTableHTML(sc.tbl)}</div>`:''}
          <div class="terminal">
            <div class="term-titlebar">
              <div class="term-dots"><div class="term-dot"></div><div class="term-dot"></div><div class="term-dot"></div></div>
              <span class="term-label ${isDone?'solved':''}">${isDone?t('js_term_solved'):'datashop_db › '+(sc.tbl||'sql')}</span>
            </div>
            ${sc.steps ? (() => {
              // Multi-step scenario — toon stapnavigatie + textarea per stap
              const stepsDone = G.stepsDone?.[sc.id] || 0;
              const stepsNav = sc.steps.map((st, i) => {
                const cls = G.done.has(sc.id) ? 'done' : i < stepsDone ? 'done' : i === stepsDone ? 'active' : '';
                return `<div class="sc-step-btn ${cls}">${i < stepsDone || G.done.has(sc.id) ? '✓ ' : (i === stepsDone ? '▶ ' : '')}Stap ${i+1}: ${esc(st.label)}</div>`;
              }).join('');
              return `<div class="sc-steps-nav">${stepsNav}</div>
              <div class="hl-wrap">
                <div class="hl-backdrop" id="hl-${sc.id}" aria-hidden="true"></div>
                <textarea class="sql-editor" id="sq-${sc.id}"
                  placeholder="-- ${esc(sc.steps[Math.min(stepsDone, sc.steps.length-1)].placeholder || 'Schrijf hier je SQL...')}"
                  ${isDone?'disabled':''}></textarea>
              </div>`;
            })() : `<div class="hl-wrap">
              <div class="hl-backdrop" id="hl-${sc.id}" aria-hidden="true"></div>
              <textarea class="sql-editor" id="sq-${sc.id}"
                placeholder="${sc.type==='debug'?'-- Repareer de query hierboven...&#10;-- Ctrl+Enter om uit te voeren':'-- Schrijf hier je SQL...&#10;-- Ctrl+Enter om uit te voeren'}"
                ${isDone?'disabled':''}></textarea>
            </div>`}
            <div class="term-footer">
              <span class="term-hint">Ctrl+Enter</span>
              ${!isDone?`<button class="btn btn-outline btn-xs" id="hbtn-${sc.id}" data-action="show-hint" data-sc="${sc.id}">💡 Hint ①②③</button>`:''}
              ${!isDone?`<button class="btn btn-primary btn-sm" data-action="run-sc" data-sc="${sc.id}">▶ Uitvoeren</button>`:''}
              ${isDone?`<button class="sc-replay-btn" aria-label="Opnieuw oefenen" data-action="replay-sc" data-sc="${sc.id}">↩ Oefenen</button>`:''}
            </div>
          </div>
          <div class="feedback" id="fb-${sc.id}"></div>
        </div>
      </div>`;
    }).join('');
  },

  renderSchema() {
    const el = $('schema-grid');
    if (!el) return;
    el.innerHTML = Object.entries(DB).map(([n,t])=>`
      <div class="schema-card">
        <div class="schema-head">${esc(n)}</div>
        ${t.cols.map(c=>`<div class="schema-col">${c.pk?'<span class="col-pk">PK</span>':''}${c.fk?'<span class="col-fk">FK</span>':''}<span>${esc(c.n)}</span><span class="col-type">${esc(c.t)}</span></div>`).join('')}
      </div>`
    ).join('');
  },

  renderDBTabs() {
    const el = $('db-tabs');
    if (!el) return;
    el.innerHTML = Object.keys(DB).map(n =>
      `<button class="table-tab ${n===this.curTbl?'active':''}" data-action="render-table" data-table="${esc(n)}">${esc(n)} <span class="table-tab-count">(${DB[n].rows.length})</span></button>`
    ).join('');
    // Hide shortcut buttons for tables that don't exist yet in DB (e.g. leverancier
    // before the CREATE TABLE mission is completed).
    document.querySelectorAll('.db-shortcut-btn[data-dbtable]').forEach(btn => {
      btn.classList.toggle('u-hidden', !DB[btn.dataset.dbtable]);
    });
  },

  renderDBTable(name) {
    this.curTbl = name;
    this.renderDBTabs();
    const el = $('db-view');
    if (el) el.innerHTML = renderTableHTML(name);
  },

  renderCurrentTable() {
    if (!DB[this.curTbl]) this.curTbl = Object.keys(DB)[0];
    this.renderDBTable(this.curTbl);
  },

  renderAchs() {
    const el = $('ach-grid');
    if (!el) return;
    $('ach-progress').textContent = G.ach.size + ' / ' + ACHIEVEMENTS.length + ' ' + t('js_ach_unlocked');
    el.innerHTML = ACHIEVEMENTS.map(a => {
      const got = G.ach.has(a.id);
      const fresh = got && this._justUnlockedAch === a.id;
      return `<div class="ach-tile ${got?'unlocked':''} ${fresh?'just-unlocked':''}">
        <span class="ach-icon">${a.icon}</span>
        <div class="ach-name">${got?esc(a.name):'???'}</div>
        <div class="ach-desc">${got?esc(a.desc):'Geheim...'}</div>
      </div>`;
    }).join('');
  },

  unlockAch(id) {
    if (G.ach.has(id)) return;
    G.ach.add(id);
    const a = ACHIEVEMENTS.find(x => x.id===id);
    if (!a) return;
    $('toast-icon').textContent = a.icon;
    $('toast-name').textContent = a.name;
    const t = $('ach-toast');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
    this.addEvent('info', `🏆 Achievement: <strong>${esc(a.name)}</strong>`);
    this._justUnlockedAch = id;
    this.renderAchs();
    this._justUnlockedAch = null;
  },

  refreshUI() {
    this.updateKPIs();
    this.renderDash();
    this.renderOfficeCard();
    this.renderSchema();
    this.renderCurrentTable();
  },

  renderAll() {
    this.updateKPIs();
    this.renderDash();
    TUT.updateSidebarBadge();
    this.renderOfficeCard();
    this.renderScenarios();
    this.renderSchema();
    this.renderDBTabs();
    this.renderCurrentTable();
    this.renderAchs();
    this.updateXP();
  },

  showPanel(name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('on'));
    const panel = $('panel-'+name);
    if (panel) panel.classList.add('on');
    // Remove active class and aria-current from all nav buttons, then set both
    // on the newly active one so screen readers announce the active panel.
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.remove('active');
      b.removeAttribute('aria-current');
    });
    const nb = $('nav-'+name);
    if (nb) { nb.classList.add('active'); nb.setAttribute('aria-current', 'page'); }
    if (name==='db') { APP.showDbTab('schema'); this.renderCurrentTable(); }
    if (name==='daily') { DAILY.render(); setTimeout(() => { ['easy','medium','hard'].forEach(d => { const ta = $('daily-sql-'+d); if(ta) initHighlighter(ta); }); }, 80); }
    if (name==='set')   { SET.render(); SET.afterRender(); }
    if (name==='tut')   { TUT.render(); }
    if (name==='sc')    { setTimeout(initAllHighlighters, 80); }
    if (name==='term')  {
      setTimeout(()=>initHighlighter(EL['free-sql']), 50);
      const _ta = EL['free-sql'];
      if (_ta && !_ta._histBound) {
        _ta._histBound = true;
        _ta.addEventListener('keydown', ev => {
          if (ev.key === 'ArrowUp' && _qHistory.length) {
            ev.preventDefault();
            _qHistIdx = Math.min(_qHistIdx + 1, _qHistory.length - 1);
            _ta.value = _qHistory[_qHistIdx];
          } else if (ev.key === 'ArrowDown') {
            ev.preventDefault();
            _qHistIdx = Math.max(_qHistIdx - 1, -1);
            _ta.value = _qHistIdx < 0 ? '' : _qHistory[_qHistIdx];
          }
        });
      }
    }
  },
};

// ── APP ───────────────────────────────────────────────────────────
const APP = {
  cinCb: null,

  cinDone() {
    if (this.cinCb) { const fn = this.cinCb; this.cinCb = null; fn(); }
  },

  showCin(chapId, cb) {
    const cin = CHAPTERS[chapId].cin;
    this.cinCb = cb;
    EL['s-boot'].classList.remove('active');
    EL['s-game'].classList.remove('active');
    $('cin-dlg').innerHTML = '';
    $('cin-act').innerHTML = '';
    $('cin-eyebrow').textContent = cin.ch;
    $('cin-title').textContent   = cin.title;
    EL['s-cin'].classList.add('active');
    // Inject bubbles one-by-one, each with a typewriter effect
    const dlg = $('cin-dlg');

    // Strip HTML tags for plain-text typing, keep rich HTML visible after
    const typeInto = (el, html, speed) => {
      const plain = html.replace(/<[^>]+>/g, '');
      let i = 0;
      el.textContent = '';
      el.classList.add('typing');
      const iv = setInterval(() => {
        i++;
        el.textContent = plain.slice(0, i);
        if (i >= plain.length) {
          clearInterval(iv);
          el.classList.remove('typing');
          el.innerHTML = sanitizeHTML(html);
        }
      }, speed);
    };

    let cursor = 400; // ms from now for first bubble
    cin.lines.forEach((l, i) => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = 'cin-line' + (l.right ? ' right' : '');
        const bubble = document.createElement('div');
        bubble.className = 'cin-bubble cin-bubble-in';
        const speaker = document.createElement('div');
        speaker.className = 'cin-speaker';
        speaker.textContent = l.who;
        const txt = document.createElement('div');
        txt.className = 'cin-txt';
        bubble.append(speaker, txt);
        div.append(Object.assign(document.createElement('div'), {className:'cin-avatar', textContent:l.av}), bubble);
        dlg.appendChild(div);
        // Scroll into view
        bubble.scrollIntoView({behavior:'smooth', block:'nearest'});
        // Type the text — speed scales with length so short lines are quick, long are readable
        const plain = l.txt.replace(/<[^>]+>/g, '');
        const speed = Math.max(18, Math.min(38, Math.round(1400 / plain.length)));
        typeInto(txt, l.txt, speed);
      }, cursor);
      // Next bubble starts after this one finishes typing + small pause
      const plain = l.txt.replace(/<[^>]+>/g, '');
      const speed = Math.max(18, Math.min(38, Math.round(1400 / plain.length)));
      cursor += plain.length * speed + 420;
    });

    setTimeout(() => {
      $('cin-act').innerHTML = `<button class="btn btn-primary" data-action="cin-done">${t('js_get_started')}</button>`;
    }, cursor);
  },

  startGameSkipCin() {
    const name = EL['boot-name'].value.trim();
    if (!name) { alert(t('boot_name_required')); return; }
    G.name = name;
    resetDB();
    EL['s-boot'].classList.remove('active');
    EL['s-cin'].classList.remove('active');
    EL['s-game'].classList.add('active');
    this.initGame();
  },

  startGame() {
    const name = EL['boot-name'].value.trim();
    if (!name) { alert(t('boot_name_required')); return; }
    G.name = name;
    resetDB(); // Ensure a fresh database for each new game session
    this.showCin(0, () => {
      EL['s-cin'].classList.remove('active');
      EL['s-game'].classList.add('active');
      this.initGame();
    });
  },

  initGame() {
    $('sb-name').textContent = G.name;
    UI.renderAll();
    UI.addEvent('ok',   `Welkom CEO <strong>${esc(G.name)}</strong>! ${t('js_welcome_live')}`);
    UI.addEvent('warn', t('js_alarm_coupon'));
    UI.addEvent('warn', t('js_alarm_stock0'));
    UI.addEvent('info', t('js_new_registration'));
    DAILY.updateBadge();
    TUT.updateSidebarBadge();
    initAllHighlighters();
    save();
    // Herstel het laatste open scenario
    const lastOpenSc = loadOpenSc();
    if (lastOpenSc && SCENARIOS.find(s => s.id === lastOpenSc)) {
      setTimeout(() => {
        APP.showPanel('sc');
        // Scroll to and open the scenario
        const scEl = document.getElementById('sc-' + lastOpenSc);
        if (scEl) {
          APP.toggleSc(lastOpenSc);
          setTimeout(() => scEl.scrollIntoView({behavior:'smooth', block:'center'}), 200);
        }
      }, 400);
    }
  },

  showPanel(name) { UI.showPanel(name); },
  renderDBTable(name) { UI.renderDBTable(name); },

  showDbTab(tab) {
    ['schema','erd','data'].forEach(t => {
      const el = $('db-tab-'+t);
      const btn = $('dbt-'+t);
      if (el) el.classList.toggle('u-hidden', t !== tab);
      if (btn) btn.classList.toggle('active', t===tab);
    });
    if (tab === 'erd') this.renderERD();
    if (tab === 'data') { UI.renderDBTabs(); UI.renderCurrentTable(); }
    if (tab === 'schema') UI.renderSchema();
  },

  renderERD() {
    const c = $('erd-container');
    if (!c) return;
    const relations = [
      {from:'bestelling',fk:'klant_id',  to:'klant',   pk:'klant_id'},
      {from:'bestelling',fk:'product_id',to:'product',  pk:'product_id'},
      {from:'review',    fk:'klant_id',  to:'klant',   pk:'klant_id'},
      {from:'review',    fk:'product_id',to:'product',  pk:'product_id'},
    ];
    const relPills = [...new Set(relations.map(r=>`${r.from}.${r.fk} → ${r.to}.${r.pk}`))];
    const tableHtml = Object.entries(DB).map(([name,t]) => {
      const cols = t.cols.map(col => {
        const rel = relations.find(r => r.from===name && r.fk===col.n);
        return `<div class="erd-col-row">
          ${col.pk ? '<span class="erd-pk">🔑 PK</span>' : col.fk ? '<span class="erd-fk">🔗 FK</span>' : '<span class="erd-col-spacer"></span>'}
          <span>${esc(col.n)}</span>
          ${rel ? `<span class="erd-fk-ref">→ ${esc(rel.to)}</span>` : `<span class="erd-type">${esc(col.t)}</span>`}
        </div>`;
      }).join('');
      return `<div class="erd-table">
        <div class="erd-table-head">🗃️ ${esc(name)} <span class="erd-row-count">${t.rows.length} rijen</span></div>
        ${cols}
      </div>`;
    }).join('');
    const pillsHtml = relPills.map(r => `<div class="erd-rel-pill">🔗 ${esc(r)}</div>`).join('');

    // Visual relationship map
    const visualMap = `<div class="erd-visual-map">
      <div class="erd-vis-title">🗺️ Visueel Relatieoverzicht</div>
      <div class="erd-vis-layout">
        <div class="erd-vis-center-col">
          <div class="erd-vis-node erd-vis-center">🛒<br><strong>bestelling</strong><br><small>klant_id → klant<br>product_id → product</small></div>
        </div>
        <div class="erd-vis-right-col">
          <div class="erd-vis-node erd-vis-main">👤<br><strong>klant</strong><br><small>PK: klant_id</small></div>
          <div class="erd-vis-arrow-label">↑ klant_id FK</div>
          <div class="erd-vis-node erd-vis-main">📦<br><strong>product</strong><br><small>PK: product_id</small></div>
          <div class="erd-vis-arrow-label">↑ product_id FK</div>
          <div class="erd-vis-node erd-vis-secondary">⭐<br><strong>review</strong><br><small>klant_id + product_id</small></div>
        </div>
        <div class="erd-vis-extra-col">
          <div class="erd-vis-node erd-vis-secondary">🏷️<br><strong>kortingscode</strong><br><small>zelfstandig</small></div>
          <div class="erd-vis-node erd-vis-secondary">🏭<br><strong>leverancier</strong><br><small>zelfstandig</small></div>
        </div>
      </div>
      <div class="erd-vis-legend">
        <span class="erd-vis-leg-item"><span class="erd-vis-dot erd-vis-dot-center"></span> Koppeltabel (FK naar meerdere tabellen)</span>
        <span class="erd-vis-leg-item"><span class="erd-vis-dot erd-vis-dot-main"></span> Hoofdtabel (PK)</span>
        <span class="erd-vis-leg-item"><span class="erd-vis-dot erd-vis-dot-sec"></span> Zelfstandige tabel</span>
      </div>
    </div>`;

    c.innerHTML = visualMap + `<div class="erd-tables">${tableHtml}</div>
      <div class="erd-rel-label">Relaties</div>
      <div class="erd-relations">${pillsHtml}</div>`;
  },

  setFilter(f) {
    UI.activeFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    const btn = $('fc-'+f);
    if (btn) btn.classList.add('active');
    UI.renderScenarios();
  },

  setSearch(val) {
    UI.searchQuery = val.trim().toLowerCase();
    const clearBtn = EL['sc-search-clear'];
    if (clearBtn) clearBtn.classList.toggle('u-hidden', !UI.searchQuery);
    UI.renderScenarios();
  },

  clearSearch() {
    const inp = $('sc-search');
    if (inp) inp.value = '';
    UI.searchQuery = '';
    const clearBtn = EL['sc-search-clear'];
    if (clearBtn) clearBtn.classList.add('u-hidden');
    UI.renderScenarios();
  },

  setCh(id) {
    const ch = CHAPTERS[id];
    if (G.done.size < ch.unlock) {
      UI.addEvent('warn', `Hoofdstuk ${id+1} ${t('js_ch_locked')} ${ch.unlock} ${t('js_ch_locked2')} ${G.done.size}.`);
      return;
    }
    if (id > 0 && UI.activeCh < id) {
      UI.activeCh = id;
      this.showCin(id, () => {
        EL['s-cin'].classList.remove('active');
        EL['s-game'].classList.add('active');
        UI.showPanel('sc');
        UI.renderScenarios();
      });
      return;
    }
    UI.activeCh = id;
    UI.renderScenarios();
  },

  toggleSc(id) {
    const body = $('scb-'+id);
    const chev = $('chev-'+id);
    if (!body) return;
    const wasOpen = body.classList.contains('open');

    // A1 fix: update aria-expanded on all headers when closing
    document.querySelectorAll('.sc-body').forEach(b => b.classList.remove('open'));
    document.querySelectorAll('.sc-chevron').forEach(c => c.classList.remove('open'));
    document.querySelectorAll('.sc-header[aria-expanded]').forEach(h => h.setAttribute('aria-expanded', 'false'));
    // Feature 8: clear schema highlights
    document.querySelectorAll('.schema-card').forEach(c => c.classList.remove('schema-highlight'));

    if (UI.openSc) clearTimer(UI.openSc);
    if (!wasOpen) {
      body.classList.add('open');
      chev.classList.add('open');
      // A1 fix: set aria-expanded on opened header
      const header = body.previousElementSibling;
      if (header && header.hasAttribute('aria-expanded')) header.setAttribute('aria-expanded', 'true');
      UI.openSc = id;
      saveOpenSc(id);
      UI.hintUsed[id] = false; // Bug 1 fix: reset only this scenario's hint flag
      delete UI.hintLevel[id]; // reset hint niveau bij heropenen
      if (!UI.hintL3Used) UI.hintL3Used = {};
      delete UI.hintL3Used[id]; // reset L3 flag bij heropenen
      const sc = SCENARIOS.find(s => s.id===id);
      if (sc && sc.time && !G.done.has(id)) startTimer(id, sc.time);
      // Mark concept as seen so the intro box only appears once per concept type
      const conceptKey = sc && (sc.conceptType || sc.sqlType);
      if (conceptKey && !seenConcept(conceptKey)) {
        markConceptSeen(conceptKey);
      }
      // Feature 8: highlight relevant schema cards
      if (sc && sc.tbl) {
        const tables = Array.isArray(sc.tbl) ? sc.tbl : [sc.tbl];
        tables.forEach(tbl => {
          document.querySelectorAll('.schema-card').forEach(card => {
            const head = card.querySelector('.schema-head');
            if (head && head.textContent.trim() === tbl) {
              card.classList.add('schema-highlight');
            }
          });
        });
      }
      // Attach syntax highlighter to this scenario's textarea
      setTimeout(() => {
        const ta = $('sq-'+id);
        if (ta) initHighlighter(ta);
      }, 60);
    } else {
      UI.openSc = null;
      saveOpenSc('');
    }
  },

  replaySc(id) {
    // Heractiveer een voltooide missie voor extra oefening (telt niet opnieuw mee voor XP)
    const ta   = $('sq-' + id);
    const fb   = $('fb-' + id);
    const lbl  = document.querySelector(`#sc-${id} .term-label`);
    if (!ta || !fb) return;
    ta.disabled = false;
    ta.value    = '';
    if (fb) { fb.className = 'feedback'; fb.innerHTML = ''; }
    // Remove concept-win-box and sql-explain boxes from previous attempt
    let _next = fb?.nextElementSibling;
    while (_next && (_next.classList.contains('sql-explain') || _next.classList.contains('concept-win-box') || _next.classList.contains('why-error-box'))) {
      const _toRemove = _next;
      _next = _next.nextElementSibling;
      _toRemove.remove();
    }
    // Reset hint state for replay
    UI.hintLevel[id] = 0;
    UI.hintUsed[id] = false; // Bug 1 fix: per-scenario hint flag
    // Reset multi-step progress for replay
    if (G.stepsDone && G.stepsDone[id] !== undefined) {
      delete G.stepsDone[id];
      UI.renderScenarios();
    }
    const _hBtn = $('hbtn-' + id);
    if (_hBtn) { _hBtn.innerHTML = t('js_hint_btn'); _hBtn.classList.remove('hint-btn-warning', 'hint-btn-exhausted'); }
    if (lbl) lbl.textContent = 'datashop_db › ' + (SCENARIOS.find(s=>s.id===id)?.tbl||'sql');
    UI.addEvent('info', `↩ Missie <strong>${esc(SCENARIOS.find(s=>s.id===id)?.title||id)}</strong> geopend voor oefening.`);
    // Start fresh timer for practice
    const sc = SCENARIOS.find(s=>s.id===id);
    if (sc?.time) startTimer(id, sc.time);
    // Re-init highlighter: clear the init flag so it re-attaches after textarea re-enable
    ta._hlInit = false;
    setTimeout(() => initHighlighter(ta), 30);
    ta.focus();
  },

  showHint(id) {
    const sc = SCENARIOS.find(s => s.id===id);
    if (!sc) return;
    const fb = $('fb-'+id);
    if (!UI.hintLevel) UI.hintLevel = {};
    if (!UI.hintLevel[id]) UI.hintLevel[id] = 0;
    const level = UI.hintLevel[id];

    // For multi-step scenarios, use the current step's hint
    const stepIdx = (sc.steps && G.stepsDone) ? (G.stepsDone[id] || 0) : null;
    const currentHint = (sc.steps && stepIdx !== null && stepIdx < sc.steps.length)
      ? sc.steps[stepIdx].hint
      : sc.hint;
    const currentSqlType = (sc.steps && stepIdx !== null && stepIdx < sc.steps.length)
      ? (sc.steps[stepIdx].sqlType || sc.sqlType)
      : (sc.sqlType);

    // ── HINT LADDER: 3 levels ──────────────────────────────────────
    const sqlType = currentSqlType || sc.sqlType || 'select';

    // Level 1 — Structure hint
    const structureHints = {
      select: t('js_hint_lv1_select'),
      insert: t('js_hint_lv1_insert'),
      update: t('js_hint_lv1_update'),
      delete: t('js_hint_lv1_delete'),
      ddl:    t('js_hint_lv1_ddl'),
      join:   t('js_hint_lv1_join'),
    };

    // Level 2 — Column/table hint
    const tblHint = sc.tbl ? `${t('js_hint_lv2_table')}${sc.tbl}${t('js_hint_lv2_table2')}` : '';
    const obj = sc.obj || '';
    const columnHint = `${t('js_hint_lv2_prefix')}${tblHint}${obj ? t('js_hint_lv2_goal') + esc(obj) + t('js_hint_lv2_goal2') : t('js_hint_lv2_fallback')}`;

    // Level 3 — Near-solution (costs XP bonus!)
    const solHint = `${t('js_hint_lv3_prefix')}<code class="hint-solution-code">${esc(currentHint || sc.hint || '')}</code>`;

    const hints     = [structureHints[sqlType] || structureHints.select, columnHint, solHint];
    const stepNames = [t('js_hint_step_struct'), t('js_hint_step_cols'), t('js_hint_step_sol')];
    const stepIcons = ['①', '②', '③'];
    const costs     = [t('js_hint_cost_free'), t('js_hint_cost_free'), t('js_hint_cost_noxp')];

    // Build visual hint ladder
    const stepPills = stepNames.map((name, i) => {
      const isDone    = i < level;
      const isActive  = i === level;
      const isDanger  = i === 2 && isActive;
      const cls = isDone ? 'done' : isActive ? (isDanger ? 'danger' : 'active') : '';
      return `<div class="hint-step-pill ${cls}">${isDone ? '✓' : stepIcons[i]} ${name}</div>`;
    }).join('');

    fb.className = 'feedback hint visible';
    fb.innerHTML = `
      <div class="hint-ladder-wrap">
        <div class="hint-ladder-header">${t('js_hint_header')} <span class="hint-ladder-cost">${costs[level]}</span></div>
        <div class="hint-ladder-steps">${stepPills}</div>
        <div class="hint-content-box">${hints[level]}${level === 2 ? `<div class="hint-l3-warning">${t('js_hint_l3_warning')}</div>` : ''}</div>
        <div class="hint-ladder-footer">
          ${level < 2 ? `<button class="btn btn-outline btn-xs hint-next-btn" data-action="next-hint" data-sc="${id}">${t('js_hint_more')} (${costs[level+1]})</button>` : `<span class="hint-max-label">${t('js_hint_max_reached')}</span>`}
          <span class="hint-level-label">${stepIcons[level]} ${t('js_hint_level_label')} ${level+1}/3</span>
        </div>
      </div>`;

    // Track hint gebruik per hoofdstuk
    G.hintsUsedChs.add(sc.ch);
    if (level === 2) {
      // Niveau 3 gebruikt: markeer zodat XP-bonussen worden geblokkeerd
      if (!UI.hintL3Used) UI.hintL3Used = {};
      UI.hintL3Used[id] = true;
      UI.hintUsed[id] = true;
    }
    UI.hintLevel[id] = Math.min(level + 1, 2);

    // Update hint button
    const hBtn = $('hbtn-' + id);
    if (hBtn) {
      const nextLvl = UI.hintLevel[id];
      const stepLabels = [t('js_hint_next_cols'), t('js_hint_next_sol'), t('js_hint_next_max')];
      hBtn.innerHTML = '💡 ' + (stepLabels[nextLvl - 1] || t('js_hint_next_max'));
      if (nextLvl >= 2) { hBtn.classList.add('hint-btn-warning'); }
      if (nextLvl > 2)  { hBtn.disabled = true; hBtn.classList.remove('hint-btn-warning'); hBtn.classList.add('hint-btn-exhausted'); }
    }
  },

  nextHint(id) { this.showHint(id); },

  runSc(id) {
    const sc  = SCENARIOS.find(s => s.id===id);
    const sql = ($('sq-'+id)||{}).value?.trim();
    const fb  = $('fb-'+id);
    if (!sql) { fb.className='feedback err visible'; fb.textContent=t('js_write_sql_first'); return; }

    // ── Multi-step scenario handler ────────────────────────────────
    if (sc.steps) {
      if (!G.stepsDone) G.stepsDone = {};
      const stepIdx = G.stepsDone[id] || 0;
      if (stepIdx >= sc.steps.length) return; // all steps already done

      const step = sc.steps[stepIdx];
      const res = step.check(sql);

      if (res.ok) {
        G.stepsDone[id] = stepIdx + 1;
        const isLastStep = G.stepsDone[id] >= sc.steps.length;

        if (isLastStep) {
          // All steps done — award XP and mark complete
          clearTimer(id);
          const elapsed    = tStart[id] ? (Date.now()-tStart[id])/1000 : sc.time||30;
          const speedBonus = sc.time ? Math.max(0, Math.round((sc.time-elapsed)/sc.time*30)) : 0;
          const hintPenalty= UI.hintUsed[id] ? 5 : 0; // Bug 1 fix: per-scenario
          const streakBonus= G.streak>=5?20:G.streak>=3?10:0;
          const totalXP    = Math.max(10, sc.xp + speedBonus + streakBonus - hintPenalty);
          fb.className = 'feedback ok visible';
          setFbHTML(fb, `✅ <strong>${t('js_all_steps_done')}</strong> ${res.msg||''}<br>+${sc.xp} XP${speedBonus?` +${speedBonus} snelheid ⚡`:''}${streakBonus?` +${streakBonus} reeks 🔥`:''}${hintPenalty?` −${hintPenalty} hint`:''} = <strong>${totalXP} XP</strong>${sc.win?`<br><span class="fb-win-story">📖 ${esc(sc.win)}</span>`:''}`);
          if (!G.done.has(id)) {
            G.done.add(id);
            G.xp += totalXP;
            G.streak++;
            G.consecutiveErrors = 0;
            UI.xpPop('+'+totalXP+' XP');
            UI.updateXP();
            this.checkAch(sc, sql, elapsed);
            this.checkChUnlocks();
            this.checkChRecap(sc.ch);
            UI.addEvent('ok', `<strong>${esc(sc.title)}</strong> ${t('js_sc_solved')} +${totalXP} XP`, true);
            UI.refreshUI();
            UI.renderScenarios();
            save();
            if (G.streak===3||G.streak===5) this.showStreakPop();
            this.checkAllDone();
          }
          const reflectEl = document.createElement('div');
          reflectEl.className = 'concept-win-box';
          reflectEl.innerHTML = buildWinReflection(sc, sql);
          fb.after(reflectEl);
        } else {
          // Step complete, show next step prompt
          fb.className = 'feedback ok visible';
          setFbHTML(fb, `✅ <strong>${t('js_step_done')} ${stepIdx+1} ${t('js_step_done2')}</strong> ${res.msg||step.successMsg||''}<br><span class="fb-step-next">${t('js_next_step')} ${stepIdx+2}: ${esc(sc.steps[stepIdx+1].label)}</span>`);
          // Remove stale error tooltip from previous attempt
          const oldTutLinkAdv = fb.parentNode?.querySelector('.sc-tut-err-link');
          if (oldTutLinkAdv) oldTutLinkAdv.remove();
          // Update textarea placeholder for next step
          const ta = $('sq-'+id);
          if (ta) {
            ta.value = '';
            ta.placeholder = '-- ' + (sc.steps[stepIdx+1].placeholder || 'Schrijf hier je SQL...');
          }
          UI.renderScenarios(); // refresh step nav indicators
          // Re-init highlighter for the refreshed textarea
          setTimeout(() => initAllHighlighters(), 50);
        }
        save();
      } else {
        fb.className = 'feedback err visible';
        G.consecutiveErrors = (G.consecutiveErrors || 0) + 1;
        UI.damageRep(3);
        const countdown = res.msg || t('js_daily_wrong');
        const extraMsg = G.consecutiveErrors >= 2
          ? `<br><span class="u-mono-muted">${t('js_two_errors')}</span>` : '';
        setFbHTML(fb, `❌ ${countdown}${extraMsg}`);
        if (G.consecutiveErrors >= 2) {
          G.streak = 0; G.consecutiveErrors = 0; UI.updateXP();
        }
        // Tutorial link on error
        const oldTutLink = fb.parentNode.querySelector('.sc-tut-err-link');
        if (oldTutLink) oldTutLink.remove();
        const tutLinkHtml = scTutLink(sc.id);
        if (tutLinkHtml) {
          const tutEl = document.createElement('div');
          tutEl.className = 'sc-tut-err-link';
          tutEl.innerHTML = tutLinkHtml;
          fb.after(tutEl);
        }
      }
      return; // don't fall through to regular handler
    }

    const res = sc.check(sql);

    if (res.ok) {
      // Feature 3: Result-based validation
      if (sc.validation) {
        const valErr = validateResult(sql, sc.validation);
        if (valErr) {
          fb.className = 'feedback err visible';
          fb.innerHTML = `${t('js_query_correct_not')}<br>${valErr}`;
          return;
        }
      }

      clearTimer(id);
      const elapsed    = tStart[id] ? (Date.now()-tStart[id])/1000 : sc.time||30;
      const speedBonus = sc.time ? Math.max(0, Math.round((sc.time-elapsed)/sc.time*30)) : 0;
      if (speedBonus >= 25) UI.unlockAch('speedster');

      // Feature 1: L3 hint blocks ALL bonuses
      const usedL3Hint = UI.hintL3Used && UI.hintL3Used[id];
      const hintPenalty= UI.hintUsed[id] ? 5 : 0;
      const streakBonus= G.streak>=5?20:G.streak>=3?10:0;
      // If L3 used: only base XP, no speed/streak bonuses
      const totalXP = usedL3Hint
        ? Math.max(10, sc.xp)
        : Math.max(10, sc.xp + speedBonus + streakBonus - hintPenalty);

      fb.className = 'feedback ok visible';
      let msg = `✅ <strong>Correct!</strong> `;
      if (res.type==='select' && res.rows) msg += res.rows.length + ' ' + t('js_rows_found') + ' ';
      if (res.type==='insert') msg += t('js_fb_row_added') + ' ';
      if (res.type==='update') msg += `${res.affectedRows} ${t('js_fb_rows_updated')} `;
      if (res.type==='delete') msg += `${res.affectedRows} ${t('js_fb_rows_deleted')} `;
      if (res.type==='ddl')    msg += res.msg + ' ';
      msg += `<br>+${sc.xp} XP`;
      if (!usedL3Hint) {
        if (speedBonus)   msg += ` +${speedBonus} ${t('js_speed')}`;
        if (streakBonus)  msg += ` +${streakBonus} ${t('js_streak_bonus')}`;
        if (hintPenalty)  msg += ` −${hintPenalty} ${t('js_hint_penalty')}`;
      } else {
        msg += ` <span class="hint-l3-bonus-blocked">${t('js_fb_l3_blocked')}</span>`;
      }
      msg += ` = <strong>${totalXP} XP</strong>`;
      if (sc.win) msg += `<br><span class="fb-win-story">📖 ${esc(sc.win)}</span>`;
      fb.innerHTML = msg;

      if (!G.done.has(id)) {
        G.done.add(id);
        G.xp += totalXP;
        G.streak++;
        G.consecutiveErrors = 0; // reset foutenteller bij correct antwoord
        // Reputatieherstel: correct oplossen herstelt reputatie gedeeltelijk
        if (G.rep < 100) {
          const repGain = sc.diff === 'hard' ? 5 : sc.diff === 'medium' ? 3 : 2;
          G.rep = Math.min(100, G.rep + repGain);
          if (repGain > 0) {
            msg += `<br><span class="fb-rep-gain">+${repGain} ${t('js_fb_rep_recovered')}</span>`;
            fb.innerHTML = msg; // Bug 3 fix: re-apply msg to DOM after repGain append
          }
          UI.updateKPIs();
        }
        UI.xpPop('+'+totalXP+' XP');
        UI.updateXP();
        this.checkAch(sc, sql, elapsed);
        earnStreakShield(); // Feature 7: shield generatie
        // no_hint_ch1: hoofdstuk 1 voltooid zonder hints
        const ch1Done = SCENARIOS.filter(s=>s.ch===0).every(s=>G.done.has(s.id));
        if (ch1Done && !G.hintsUsedChs.has(0)) UI.unlockAch('no_hint_ch1');
        // SQL polyglot: check if all 4 SQL types have been used
        const doneTypes = new Set([...G.done].map(id => {
          const s = SCENARIOS.find(x=>x.id===id);
          return s ? s.sqlType : null;
        }).filter(Boolean));
        if (['select','insert','update','delete'].every(t => doneTypes.has(t))) UI.unlockAch('sql_polyglot');
        this.checkChUnlocks();
        this.checkChRecap(sc.ch);
        UI.addEvent('ok', `<strong>${esc(sc.title)}</strong> ${t('js_sc_solved')} +${totalXP} XP`, true);
        if (sc.tbl) { const t=$('tv-'+id); if(t) t.innerHTML=renderTableHTML(sc.tbl); }
        UI.refreshUI();
        UI.renderScenarios();
        save();
        if (G.streak===3||G.streak===5) this.showStreakPop();
        this.checkAllDone();
      }
      // Show SQL explanation + pedagogic reflection (remove old ones first)
      let nextEl = fb.nextElementSibling;
      while (nextEl && (nextEl.classList.contains('sql-explain') || nextEl.classList.contains('concept-win-box') || nextEl.classList.contains('sc-tut-err-link'))) {
        const toRemove = nextEl;
        nextEl = nextEl.nextElementSibling;
        toRemove.remove();
      }
      // Pedagogic concept reflection
      const reflectEl = document.createElement('div');
      reflectEl.className = 'concept-win-box';
      reflectEl.innerHTML = buildWinReflection(sc, sql);
      fb.after(reflectEl);
      // SQL explain beneath the reflection
      const explainEl = document.createElement('div');
      explainEl.className = 'sql-explain';
      explainEl.innerHTML = `<div class="sql-explain-title">${t('js_explain_title')}</div>${explainSQL(sql)}`;
      reflectEl.after(explainEl);
    } else {
      fb.className = 'feedback err visible';
      const isSyntaxErr = res.msg && (
        res.msg.includes('Gebruik') || res.msg.includes('gebruik') ||
        res.msg.includes('Begin met') || res.msg.includes('vergeten') ||
        res.msg.includes('verplicht') || res.msg.includes('ontbreekt')
      );
      if (isSyntaxErr) {
        setFbHTML(fb, '⚠️ ' + res.msg + `<br><span class="u-mono-muted">${t('js_streak_intact')}</span>`);
        UI.damageRep(2);
        UI.addEvent('warn', t('js_small_error'));
      } else {
        // Logische fout: reeks reset pas na 2 fouten op rij — bevordert experimenteren
        G.consecutiveErrors = (G.consecutiveErrors || 0) + 1;
        UI.damageRep(5);
        if (G.consecutiveErrors >= 2) {
          setFbHTML(fb, '❌ ' + res.msg + `<br><span class="u-mono-muted">${t('js_two_errors')} (was ${G.streak}) 🔥</span>`);
          G.streak = 0;
          G.consecutiveErrors = 0;
          UI.updateXP();
          UI.addEvent('err', t('js_error_streak_reset'));
        } else {
          setFbHTML(fb, '❌ ' + res.msg + `<br><span class="fb-streak-warning">${t('js_streak_warning')} (${G.streak}🔥) ${t('js_streak_reset')}</span>`);
          UI.addEvent('warn', t('js_small_error'));
        }
      }
      // "Waarom" uitleg — leermoment bij elke fout
      const oldWhy = fb.nextElementSibling;
      if (oldWhy && oldWhy.classList.contains('why-error-box')) oldWhy.remove();

      // Feature 2: Coaching feedback (2-fasen) — voeg toe vóór why-error-box
      const oldCoach = fb.parentNode.querySelector('.coach-feedback-box');
      if (oldCoach) oldCoach.remove();
      const coachHtml = buildCoachFeedback(sql, sc);
      if (coachHtml) {
        const coachEl = document.createElement('div');
        coachEl.innerHTML = coachHtml;
        fb.after(coachEl.firstChild);
      }

      const whyHtml = buildWhyError(sql, sc);
      if (whyHtml) {
        const whyEl = document.createElement('div');
        whyEl.innerHTML = whyHtml;
        fb.after(whyEl.firstChild);
      }
      // Tutorial link — stuur leerling naar de bijhorende les bij fout
      const oldTutLink = fb.parentNode.querySelector('.sc-tut-err-link');
      if (oldTutLink) oldTutLink.remove();
      const tutLinkHtml = scTutLink(sc.id);
      if (tutLinkHtml) {
        const tutEl = document.createElement('div');
        tutEl.className = 'sc-tut-err-link';
        tutEl.innerHTML = tutLinkHtml;
        const insertAfter = fb.nextElementSibling || fb;
        insertAfter.after ? insertAfter.after(tutEl) : fb.after(tutEl);
      }
    }
  },

  showStreakPop() {
    $('streak-num-popup').textContent   = G.streak;
    $('streak-bonus-popup').textContent = G.streak>=5?t('js_streak_bonus_popup5'):t('js_streak_bonus_popup');
    const p = $('streak-popup');
    p.classList.add('show');
    setTimeout(() => p.classList.remove('show'), 2500);
  },

  checkAllDone() {
    const total = SCENARIOS.length;
    if (G.done.size >= total) {
      setTimeout(() => this.showCompletion(), 800);
    }
  },

  showCompletion() {
    UI.unlockAch('all_done');
    const ov = EL['completion-overlay'];
    ov.classList.remove('overlay-hidden');
    ov.classList.add('overlay-visible');
    const rank = RANKS.slice().reverse().find(r => G.xp >= r.min) || RANKS[0];
    $('comp-desc').textContent = `${t('js_completion_desc')} ${SCENARIOS.length} ${t('js_missions').toLowerCase()} ${t('js_completion_desc')} ${rank.title}. ${t('js_completion_desc2')}`;
    $('comp-stats').innerHTML = [
      {v: G.xp+' XP', l: t('js_total_xp')},
      {v: G.done.size,  l: t('js_missions')},
      {v: G.ach.size,   l: t('js_badges')},
      {v: G.rep+'%',    l: t('kpi_reputation')},
    ].map(s=>`<div class="comp-stat"><div class="comp-stat-val">${esc(String(s.v))}</div><div class="comp-stat-label">${esc(s.l)}</div></div>`).join('');
    this.launchConfetti();
    setTimeout(() => APP._trapFocus(ov), 100);
  },

  closeCompletion() {
    const ov = EL['completion-overlay'];
    APP._releaseFocus(ov);
    ov.classList.add('overlay-hidden');
    ov.classList.remove('overlay-visible');
    UI.showPanel('dash');
  },

  launchConfetti() {
    const c = $('comp-confetti');
    c.innerHTML = '';
    const colors = ['#22d3ee','#f472b6','#a78bfa','#4ade80','#fbbf24','#fb923c'];
    for (let i = 0; i < 80; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      const s = el.style;
      s.setProperty('--x', Math.random()*100 + '%');
      s.setProperty('--bg-color', colors[Math.floor(Math.random()*colors.length)]);
      s.setProperty('--dur', (2+Math.random()*3) + 's');
      s.setProperty('--delay', Math.random()*2 + 's');
      s.setProperty('--size', (6+Math.random()*8) + 'px');
      s.setProperty('--br', Math.random()>0.5 ? '50%' : '2px');
      s.setProperty('--op', String(.7+Math.random()*.3));
      c.appendChild(el);
    }
  },

  downloadCertificate() {
    const canvas = $('cert-canvas');
    const ctx = canvas.getContext('2d');
    const W = 800, H = 500;
    // Background
    ctx.fillStyle = '#07090f';
    ctx.fillRect(0,0,W,H);
    // Border gradient
    const grd = ctx.createLinearGradient(0,0,W,H);
    grd.addColorStop(0,'#22d3ee'); grd.addColorStop(.5,'#a78bfa'); grd.addColorStop(1,'#f472b6');
    ctx.strokeStyle = grd; ctx.lineWidth = 3;
    ctx.strokeRect(12,12,W-24,H-24);
    ctx.lineWidth = 1; ctx.globalAlpha = .3;
    ctx.strokeRect(20,20,W-40,H-40);
    ctx.globalAlpha = 1;
    // Title
    ctx.fillStyle = '#f0f6ff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DATASHOP CEO — SQL STORY GAME', W/2, 60);
    // Main text
    ctx.fillStyle = '#8ba3c4';
    ctx.font = '15px sans-serif';
    ctx.fillText(t('js_cert_confirms'), W/2, 110);
    // Name
    ctx.font = 'bold 42px sans-serif';
    const grd2 = ctx.createLinearGradient(W/2-200, 0, W/2+200, 0);
    grd2.addColorStop(0,'#22d3ee'); grd2.addColorStop(1,'#a78bfa');
    ctx.fillStyle = grd2;
    ctx.fillText(G.name, W/2, 170);
    // Subtitle
    ctx.fillStyle = '#8ba3c4';
    ctx.font = '15px sans-serif';
    ctx.fillText(t('js_cert_completed_all'), W/2, 210);
    // Rank
    const rank = RANKS.slice().reverse().find(r => G.xp >= r.min) || RANKS[0];
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(rank.title, W/2, 255);
    // Stats row
    ctx.font = '12px monospace';
    ctx.fillStyle = '#4a6285';
    const stats = [`${G.xp} XP`, `${G.done.size} Missies`, `${G.ach.size} Badges`, `${G.rep}% Reputatie`];
    stats.forEach((s,i) => ctx.fillText(s, 150 + i*130, 310));
    // Date
    ctx.font = '11px monospace';
    ctx.fillStyle = '#2a3d5a';
    ctx.fillText(`${t('js_cert_date')} ${new Date().toLocaleDateString(LANG === 'en' ? 'en-GB' : 'nl-BE')}  ·  © 2026 Kaat Claerman`, W/2, 460);
    // Trophy
    ctx.font = '56px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', W/2, 390);
    // Download
    const a = document.createElement('a');
    a.download = `certificaat-${G.name.replace(/\s+/g,'-')}.png`;
    a.href = canvas.toDataURL();
    canvas.classList.add('hidden');
    a.click();
  },

  checkChUnlocks() {
    // We fire the unlock notification exactly once: the moment G.done.size crosses
    // the ch.unlock threshold.  At this point G.done.size === ch.unlock (the mission
    // was just added), so "size - 1 < ch.unlock" is true only for that one call.
    // On subsequent calls size > ch.unlock, so the second condition fails and the
    // notification is not repeated.  This is intentional — not an off-by-one.
    CHAPTERS.forEach((ch,i) => {
      if (i>0 && G.done.size>=ch.unlock && G.done.size-1<ch.unlock)
        UI.addEvent('info', `🔓 Hoofdstuk ${i+1} "<strong>${esc(ch.title)}</strong>" ${t('js_ch_unlocked_suffix')}`);
    });
  },

  checkChRecap(chId) {
    // Trigger recap als het hoofdstuk nu volledig voltooid is en we de recap nog niet getoond hebben
    if (G.chRecapSeen.has(chId)) return;
    const chScenarios = SCENARIOS.filter(s => s.ch === chId);
    if (!chScenarios.length) return;
    const allDone = chScenarios.every(s => G.done.has(s.id));
    if (!allDone) return;
    G.chRecapSeen.add(chId);
    save();
    setTimeout(() => this.showRecap(chId), 900);
  },

  showRecap(chId) {
    const data = CHAPTER_RECAP[chId];
    if (!data) return;
    const ov = EL['chapter-recap-overlay'];
    if (!ov) return;
    const emojis = ['🚀','🚨','🧠','🧬','🏗️'];
    $('recap-emoji').textContent   = emojis[chId] || '🎉';
    $('recap-title').textContent   = data.title;
    $('recap-concept-list').innerHTML = data.learned.map(l => `
      <div class="recap-concept-row">
        <div class="recap-concept-icon">${l.icon}</div>
        <div>
          <div class="recap-concept-name">${esc(l.concept)}</div>
          <div class="recap-concept-desc">${esc(l.desc)}</div>
        </div>
      </div>`).join('');
    const nextWrap = $('recap-next-wrap');
    const nextText = $('recap-next-text');
    if (data.nextPreview && nextWrap && nextText) {
      nextText.textContent = data.nextPreview;
      nextWrap.classList.remove('hidden');
    } else if (nextWrap) {
      nextWrap.classList.add('hidden');
    }
    ov.classList.remove('overlay-hidden');
    ov.classList.add('overlay-visible');
    setTimeout(() => APP._trapFocus(ov), 100);
  },

  closeRecap() {
    const ov = EL['chapter-recap-overlay'];
    if (ov) { APP._releaseFocus(ov); ov.classList.add('overlay-hidden'); ov.classList.remove('overlay-visible'); }
  },

  checkAch(sc, sql, elapsed) {
    const s = sql.toLowerCase();
    if (s.includes('insert'))     UI.unlockAch('first_insert');
    if (s.includes('update'))     UI.unlockAch('first_update');
    if (s.includes('delete'))     UI.unlockAch('first_delete');
    if (s.includes('select'))     UI.unlockAch('first_select');
    if (s.includes('create table')||s.includes('alter table')) UI.unlockAch('ddl_master');
    if (s.includes('avg(')||s.includes('sum(')||s.includes('max(')||s.includes('min(')) UI.unlockAch('agg');
    if (s.includes('bestelling')&&s.includes('klant')&&s.includes('klant_id')) UI.unlockAch('join');
    if (s.includes('distinct')) UI.unlockAch('distinct_pro');
    if (s.includes('(select'))  UI.unlockAch('subquery_pro');
    if (s.includes(' as '))     UI.unlockAch('alias_pro');
    if (s.includes(' like '))   UI.unlockAch('like_pro');
    if (s.includes('between'))  UI.unlockAch('between_pro');
    if (s.includes('is null'))  UI.unlockAch('null_hunter');
    if (s.includes('not in'))   UI.unlockAch('not_in_pro');
    if (s.includes('case')&&s.includes('when')) UI.unlockAch('case_when_pro');
    if (s.includes('left join')&&s.includes('is null')) UI.unlockAch('anti_join_pro');
    if (sc.id==='deactivate_gdpr') UI.unlockAch('gdpr');
    if (sc.id==='disable_coupon')  UI.unlockAch('security');
    if (sc.id==='join_orders'||sc.id==='join_all'||sc.id==='join_alias_order') UI.unlockAch('join');
    if (elapsed < 10) UI.unlockAch('speed');
    if (G.rep===100)  UI.unlockAch('rep100');
    if (G.xp>=500)    UI.unlockAch('xp500');
    if (G.streak>=3)  UI.unlockAch('streak3');
    if (G.streak>=5)  UI.unlockAch('streak5');
    const ch1 = SCENARIOS.filter(s=>s.ch===0).every(s=>G.done.has(s.id));
    const ch2 = SCENARIOS.filter(s=>s.ch===1).every(s=>G.done.has(s.id));
    const ch3 = SCENARIOS.filter(s=>s.ch===2).every(s=>G.done.has(s.id));
    const ch4 = SCENARIOS.filter(s=>s.ch===3).every(s=>G.done.has(s.id));
    const ch5 = SCENARIOS.filter(s=>s.ch===4).every(s=>G.done.has(s.id));
    if (ch1) UI.unlockAch('ch1');
    if (ch2) UI.unlockAch('ch2');
    if (ch3) UI.unlockAch('ch3');
    if (ch4) UI.unlockAch('ch4');
    if (ch5) UI.unlockAch('ch5');
    // JOIN ON badges
    if (s.includes('inner join')) UI.unlockAch('inner_join_pro');
    if (s.includes('left join'))  UI.unlockAch('left_join_pro');
    if (s.includes('having'))     UI.unlockAch('having_pro');
    // ddl_architect: ontgrendel wanneer de query DDL is
    // (ddl_master wordt eerst ontgrendeld in dezelfde aanroep, G.ach wordt synchroon bijgewerkt)
    if (s.includes('create table') || s.includes('alter table')) UI.unlockAch('ddl_architect');
    if (G.xp>=1000) UI.unlockAch('xp1000');
    // Eerste gebruik van een geavanceerd keyword — toon een mini-popup
    this.checkNewKeyword(sql);
  },

  checkNewKeyword(sql) {
    const s = sql.toLowerCase();
    const KEYWORD_MILESTONES = [
      { key: 'kw_groupby',   test: s => s.includes('group by'),   icon: '📊', name: 'GROUP BY', get desc() { return t('js_concept_groupby'); } },
      { key: 'kw_having',    test: s => s.includes('having'),     icon: '🎯', name: 'HAVING',   get desc() { return t('js_concept_having'); } },
      { key: 'kw_join',      test: s => s.includes('join'),       icon: '🔗', name: 'JOIN',     get desc() { return t('js_concept_join'); } },
      { key: 'kw_distinct',  test: s => s.includes('distinct'),   icon: '🔎', name: 'DISTINCT', get desc() { return t('js_concept_distinct'); } },
      { key: 'kw_subquery',  test: s => s.includes('(select'),    icon: '🧩', name: 'Subquery', get desc() { return t('js_concept_subquery'); } },
      { key: 'kw_alias',     test: s => / as /.test(s),           icon: '🏷️', name: 'AS (alias)', get desc() { return t('js_concept_alias'); } },
      { key: 'kw_orderby',   test: s => s.includes('order by'),   icon: '↕️', name: 'ORDER BY', get desc() { return t('js_concept_orderby'); } },
      { key: 'kw_limit',     test: s => s.includes('limit'),      icon: '🔢', name: 'LIMIT',    get desc() { return t('js_kw_limit_desc'); } },
    ];
    if (!G.seenKeywords) G.seenKeywords = new Set();
    for (const m of KEYWORD_MILESTONES) {
      if (!G.seenKeywords.has(m.key) && m.test(s)) {
        G.seenKeywords.add(m.key);
        this.showKeywordPop(m);
        save();
        break; // Toon maar één popup per keer
      }
    }
  },

  showKeywordPop(m) {
    // Verwijder bestaande popup als die er al is
    const existing = document.getElementById('kw-popup');
    if (existing) existing.remove();
    const pop = document.createElement('div');
    pop.id = 'kw-popup';
    pop.className = 'kw-popup-box';
    pop.innerHTML = `
      <div class="kw-popup-header">
        <span class="kw-popup-icon">${m.icon}</span>
        <div class="kw-popup-meta">
          <div class="kw-popup-eyebrow">✨ Nieuw keyword gebruikt!</div>
          <div class="kw-popup-name">${esc(m.name)}</div>
        </div>
        <button data-action="close-kw-popup" class="kw-popup-close">×</button>
      </div>
      <div class="kw-popup-desc">${m.desc}</div>`;
    document.body.appendChild(pop);
    setTimeout(() => { const p = document.getElementById('kw-popup'); if (p) { p.classList.add('fading'); setTimeout(() => p?.remove(), 400); } }, 5000);
  },

  runFree() {
    const sql = EL['free-sql'].value.trim();
    const fb  = EL['free-fb'];
    const out = EL['free-out'];
    if (!sql) return;
    // Save to history
    if (!_qHistory.length || _qHistory[0] !== sql) { _qHistory.unshift(sql); if (_qHistory.length > 20) _qHistory.pop(); }
    _qHistIdx = -1;
    const res = runSQL(sql);
    if (!res.ok) {
      fb.className = 'feedback err visible';
      const errMsg = res.msg || 'Query mislukt.';
      // Intelligente hulp bij veelgemaakte fouten
      let helpHint = '';
      const sl = sql.trim().toLowerCase();
      if (!sl.match(/^(select|insert|update|delete|create|alter)/)) {
        helpHint = '<br><small class="u-muted">💡 Begin met SELECT, INSERT, UPDATE, DELETE, CREATE of ALTER.</small>';
      } else if (sl.startsWith('select') && !sl.includes('from')) {
        helpHint = `<br><small class="u-muted">💡 ${t('js_select_needs_from')}</small>`;
      } else if (sl.includes('where') && sl.includes('= null')) {
        helpHint = '<br><small class="u-muted">💡 Gebruik IS NULL in plaats van = NULL: <code>WHERE kolom IS NULL</code></small>';
      } else if (sl.startsWith('update') && !sl.includes('where')) {
        helpHint = `<br><small class="sql-help-warn">${t('js_warn_update_no_where')}</small>`;
      } else if (sl.startsWith('delete') && !sl.includes('where')) {
        helpHint = `<br><small class="sql-help-warn">${t('js_warn_delete_no_where')}</small>`;
      }
      fb.innerHTML = '❌ ' + esc(errMsg) + helpHint;
      out.innerHTML = `<div class="u-empty-state">${t('js_query_failed')}</div>`;
      return;
    }
    fb.className = 'feedback ok visible';
    if (res.type==='select') {
      UI.unlockAch('first_select');
      const s = sql.toLowerCase();
      if (s.includes('avg(')||s.includes('sum(')||s.includes('max(')||s.includes('min(')) UI.unlockAch('agg');
      if (s.includes(',')&&s.includes('klant_id')) UI.unlockAch('join');
      const rows = res.rows || [];
      fb.textContent = `✅ ${rows.length} ${t('js_rows_found')}`;
      // SQL uitleg onder resultaten
      const oldFreeExplain = out.previousElementSibling?.classList.contains('sql-explain') ? out.previousElementSibling : null;
      if (oldFreeExplain) oldFreeExplain.remove();
      const freeExplainEl = document.createElement('div');
      freeExplainEl.className = 'sql-explain';
      freeExplainEl.innerHTML = `<div class="sql-explain-title">${t('js_explain_title')}</div>${explainSQL(sql)}`;
      out.before(freeExplainEl);
      if (!rows.length) { out.innerHTML = `<div class="u-empty-state">0 ${t('js_rows_found')}</div>`; return; }
      const cols = Object.keys(rows[0]);
      out.innerHTML = `<div class="tv-header"><span class="tv-name">${t('js_result')}</span><span class="tv-badge">${rows.length} ${t('js_rows')}</span></div>
        <div class="tv-scroll"><table class="data-table">
          <thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${r[c]==null?'<span class="u-muted">NULL</span>':esc(String(r[c]))}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>`;
      out.classList.remove('free-out-animated');
      void out.offsetWidth; // force reflow
      out.classList.add('free-out-animated');
    } else if (res.type==='ddl') {
      fb.textContent = '✅ ' + (res.msg || t('js_term_ddl_fb'));
      out.innerHTML = `<div class="u-empty-state">${t('js_ddl_success')}</div>`;
      UI.unlockAch('ddl_master');
      UI.renderSchema();
      UI.renderDBTabs();
    } else {
      fb.textContent = `✅ ${res.type.toUpperCase()}: ${res.affectedRows} ${t('js_term_dml_rows')}`;
      out.innerHTML = `<div class="u-empty-state">${t('js_dml_success')}</div>`;
      UI.refreshUI();
      if (res.type==='insert') UI.unlockAch('first_insert');
      if (res.type==='update') UI.unlockAch('first_update');
      if (res.type==='delete') UI.unlockAch('first_delete');
    }
  },

  // A3 fix: focus trap helper for modals
  _trapFocus(container) {
    const focusable = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    container._focusTrapHandler = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    container.addEventListener('keydown', container._focusTrapHandler);
    first.focus();
  },
  _releaseFocus(container) {
    if (container._focusTrapHandler) {
      container.removeEventListener('keydown', container._focusTrapHandler);
      delete container._focusTrapHandler;
    }
  },

  openKeyHelp() {
    const el = EL['key-help'], bd = EL['key-help-backdrop'];
    if (!el) return;
    APP._previousFocus = document.activeElement;
    el.classList.remove('u-hidden');
    bd.classList.remove('u-hidden');
    setTimeout(() => {
      el.classList.add('visible');
      APP._trapFocus(el);
    }, 20);
  },
  closeKeyHelp() {
    const el = EL['key-help'], bd = EL['key-help-backdrop'];
    if (!el) return;
    APP._releaseFocus(el);
    el.classList.remove('visible');
    setTimeout(() => { el.classList.add('u-hidden'); bd.classList.add('u-hidden'); }, 200);
    if (APP._previousFocus) APP._previousFocus.focus();
  },

  loadExampleIdx(i) {
    const TERM_EXAMPLES = [
      "SELECT *\nFROM klant\nLIMIT 5",
      "SELECT naam, prijs\nFROM product\nORDER BY prijs DESC\nLIMIT 3",
      "SELECT stad, COUNT(*) AS aantal\nFROM klant\nGROUP BY stad\nORDER BY aantal DESC",
      "SELECT k.naam, b.datum, b.status\nFROM klant k\nINNER JOIN bestelling b ON k.klant_id = b.klant_id\nORDER BY b.datum DESC",
      "SELECT naam, prijs,\n  CASE\n    WHEN prijs < 20 THEN 'Goedkoop'\n    WHEN prijs < 100 THEN 'Gemiddeld'\n    ELSE 'Duur'\n  END AS prijsklasse\nFROM product",
      "SELECT naam, prijs\nFROM product\nWHERE prijs > (SELECT AVG(prijs) FROM product)\nORDER BY prijs DESC",
      "SELECT k.naam, COUNT(b.bestelling_id) AS bestellingen\nFROM klant k\nLEFT JOIN bestelling b ON k.klant_id = b.klant_id\nGROUP BY k.klant_id, k.naam\nORDER BY bestellingen DESC",
    ];
    if (i >= 0 && i < TERM_EXAMPLES.length) this.loadExample(TERM_EXAMPLES[i]);
  },

  loadExample(sql) {
    const ta = EL['free-sql'];
    if (!ta) return;
    ta.value = sql;
    // Auto-expand to fit content — reset first so shrinkage works too
    ta.style.height = 'auto';
    ta.style.height = Math.max(200, ta.scrollHeight + 4) + 'px';
    // Trigger syntax highlighter update
    const ev = new Event('input');
    ta.dispatchEvent(ev);
    ta.focus();
    // Auto-run
    this.runFree();
  },

  clearFree() {
    EL['free-sql'].value  = '';
    EL['free-fb'].className = 'feedback';
    EL['free-out'].innerHTML = '<div class="free-out-empty">// Voer een query uit om resultaten te zien...</div>';
  },
};

// ── SQL EXPLAINER ─────────────────────────────────────────────────
// ── BUILD WHY ERROR ────────────────────────────────────────────────
// Toont een "waarom werkt dit niet?" box bij foute antwoorden
function buildWhyError(sql, sc) {
  if (!sql || !sc) return '';
  const s  = sql.trim();
  const sl = s.toLowerCase();
  const type = sc.sqlType || 'select';
  const rows = [];

  // WHERE with = NULL instead of IS NULL
  if (/=\s*null/i.test(s)) {
    const col = s.match(/(\w+)\s*=\s*null/i)?.[1];
    rows.push({
      bad:  s.match(/\w+\s*=\s*null/i)?.[0] || '... = NULL',
      good: col ? `${col} IS NULL` : '... IS NULL',
      why:  t('js_coach_null_eq')
    });
  }

  // UPDATE without WHERE
  if (type==='update' && !/where/i.test(s)) {
    rows.push({
      bad:  t('js_coach_update_no_where_bad'),
      good: t('js_coach_update_no_where_good'),
      why:  t('js_coach_update_no_where_why')
    });
  }

  // DELETE without WHERE
  if (type==='delete' && !/where/i.test(s)) {
    rows.push({
      bad:  t('js_coach_delete_no_where_bad'),
      good: t('js_coach_delete_no_where_good'),
      why:  t('js_coach_delete_no_where_why')
    });
  }

  // INSERT without column names
  if (type==='insert' && !/\(\s*\w/.test(s.split(/values/i)[0]||'')) {
    rows.push({
      bad:  t('js_coach_insert_no_cols_bad'),
      good: t('js_coach_insert_no_cols_good'),
      why:  t('js_coach_insert_no_cols_why')
    });
  }

  // SELECT without FROM
  if (type==='select' && sl.startsWith('select') && !/from/i.test(s)) {
    rows.push({
      bad:  t('js_coach_select_no_from_bad'),
      good: t('js_coach_select_no_from_good'),
      why:  t('js_coach_select_no_from_why')
    });
  }

  // Text without quotes (e.g. WHERE stad = Gent)
  const bareText = s.match(/where\s+\w+\s*=\s*([A-Za-z][A-Za-z0-9]*)\b/i);
  if (bareText && !['null','true','false','0','1'].includes(bareText[1].toLowerCase())) {
    rows.push({
      bad:  `... = ${bareText[1]}`,
      good: `... = '${bareText[1]}'`,
      why:  t('js_coach_bare_text_why_pre') + bareText[1] + t('js_coach_bare_text_why_post')
    });
  }

  // HAVING without GROUP BY
  if (/having/i.test(s) && !/group\s+by/i.test(s)) {
    rows.push({
      bad:  t('js_coach_having_no_group_bad'),
      good: t('js_coach_having_no_group_good'),
      why:  t('js_coach_having_no_group_why')
    });
  }

  // JOIN without ON
  if (/(inner|left|right)\s+join/i.test(s) && !/\bon\b/i.test(s)) {
    rows.push({
      bad:  t('js_coach_join_no_on_bad'),
      good: t('js_coach_join_no_on_good'),
      why:  t('js_coach_join_no_on_why')
    });
  }

  // Wrong clause order (WHERE before FROM)
  if (/where.*from/i.test(s) && sl.startsWith('select')) {
    rows.push({
      bad:  'SELECT ... WHERE ... FROM ...',
      good: 'SELECT ... FROM ... WHERE ...',
      why:  t('js_why_clause_order')
    });
  }

  if (!rows.length) {
    const generic = {
      select: { bad: t('js_why_select_bad'), good: t('js_why_select_good'), why: t('js_why_select_why') },
      insert: { bad: t('js_why_insert_bad'), good: t('js_why_insert_good'), why: t('js_why_insert_why') },
      update: { bad: t('js_why_update_bad'), good: t('js_why_update_good'), why: t('js_why_update_why') },
      delete: { bad: t('js_why_delete_bad'), good: t('js_why_delete_good'), why: t('js_why_delete_why') },
      ddl:    { bad: t('js_why_ddl_bad'),    good: t('js_why_ddl_good'),    why: t('js_why_ddl_why') },
    };
    rows.push(generic[type] || generic.select);
  }

  return `<div class="why-error-box">
    <div class="why-error-title">${t('js_why_title')}</div>
    ${rows.map(r => `
      <div class="why-error-row">
        <span class="why-error-label">${t('js_why_wrong')}</span>
        <code class="why-error-code bad">${esc(r.bad)}</code>
      </div>
      <div class="why-error-row">
        <span class="why-error-label">${t('js_why_correct')}</span>
        <code class="why-error-code">${esc(r.good)}</code>
      </div>
      <div class="why-error-explain">${r.why}</div>
    `).join('<hr class="why-error-hr">')}
  </div>`;
}

// ── EXPLAIN SQL ────────────────────────────────────────────────────
function explainSQL(sql) {
  const s = sql.trim();
  const sl = s.toLowerCase();
  const parts = [];

  const kw = w => `<div class="sql-explain-part"><span class="sql-explain-kw">${w}</span><span class="sql-explain-desc">`;
  const end = `</span></div>`;

  if (sl.startsWith('select')) {
    const selM = s.match(/select\s+(.*?)\s+from/i);
    const cols = selM ? selM[1] : '*';
    parts.push(kw('SELECT') + t('js_ex_select_cols') + `<code class="u-mono-cyan">${esc(cols)}</code>` + end);
    const fromM = s.match(/from\s+([\w\s,]+?)(?:\s+where|\s+order|\s+group|\s+limit|$)/i);
    if (fromM) parts.push(kw('FROM') + t('js_ex_from') + `<strong>${esc(fromM[1].trim())}</strong>` + end);
    const whereM = s.match(/where\s+(.+?)(?:\s+order|\s+group|\s+limit|$)/i);
    if (whereM) parts.push(kw('WHERE') + t('js_ex_where') + `<code class="u-mono-cyan">${esc(whereM[1].trim())}</code>` + t('js_ex_where2') + end);
    const groupM = s.match(/group\s+by\s+(\w+)/i);
    if (groupM) parts.push(kw('GROUP BY') + t('js_ex_groupby') + `<strong>${esc(groupM[1])}</strong>` + t('js_ex_groupby2') + end);
    const havingM = s.match(/having\s+(.+?)(?:\s+order|\s+limit|$)/i);
    if (havingM) parts.push(kw('HAVING') + t('js_ex_having') + `<code class="u-mono-cyan">${esc(havingM[1].trim())}</code>` + end);
    const orderM = s.match(/order\s+by\s+(\w+)\s*(asc|desc)?/i);
    if (orderM) parts.push(kw('ORDER BY') + t('js_ex_orderby') + `<strong>${esc(orderM[1])}</strong> ${orderM[2]?'('+orderM[2].toUpperCase()+')':t('js_ex_orderby_default')}` + end);
    const limitM = s.match(/limit\s+(\d+)/i);
    if (limitM) parts.push(kw('LIMIT') + t('js_ex_limit') + `<strong>${esc(limitM[1])}</strong>` + t('js_ex_limit2') + end);
    if (/count\s*\(\*\)/i.test(s)) parts.push(kw('COUNT(*)') + t('js_ex_count') + end);
    if (/avg\s*\(/i.test(s)) parts.push(kw('AVG()') + t('js_ex_avg') + end);
    if (/sum\s*\(/i.test(s)) parts.push(kw('SUM()') + t('js_ex_sum') + end);
    if (/max\s*\(/i.test(s)) parts.push(kw('MAX()') + t('js_ex_max') + end);
    if (/min\s*\(/i.test(s)) parts.push(kw('MIN()') + t('js_ex_min') + end);
    if ((s.match(/from\s+[\w\s,]+?,/i)||[]).length) parts.push(kw('JOIN') + t('js_ex_implicit_join') + end);
    if (/inner\s+join/i.test(s)) parts.push(kw('INNER JOIN') + t('js_ex_inner_join') + end);
    if (/left\s+join/i.test(s))  parts.push(kw('LEFT JOIN')  + t('js_ex_left_join') + end);
    if (/right\s+join/i.test(s)) parts.push(kw('RIGHT JOIN') + t('js_ex_right_join') + end);
    const onM = s.match(/\bon\s+([\w.]+)\s*=\s*([\w.]+)/i);
    if (onM) parts.push(kw('ON') + t('js_ex_on') + `<code class="u-mono-cyan">${esc(onM[1])} = ${esc(onM[2])}</code>` + t('js_ex_on2') + end);
    if (/having/i.test(s)) parts.push(kw('HAVING') + t('js_ex_having2') + end);
  } else if (sl.startsWith('insert')) {
    const tableM = s.match(/into\s+(\w+)/i);
    if (tableM) parts.push(kw('INSERT INTO') + t('js_ex_insert_into') + `<strong>${esc(tableM[1])}</strong>` + end);
    const colsM = s.match(/\(([^)]+)\)\s*values/i);
    if (colsM) parts.push(kw('Columns') + t('js_ex_cols_label') + `<code class="u-mono-cyan">${esc(colsM[1].trim())}</code>` + end);
    const valsM = s.match(/values\s*\(([^)]+)\)/i);
    if (valsM) parts.push(kw('VALUES') + t('js_ex_values') + `<code class="u-mono-cyan">${esc(valsM[1].trim())}</code>` + end);
  } else if (sl.startsWith('update')) {
    const tableM = s.match(/update\s+(\w+)/i);
    if (tableM) parts.push(kw('UPDATE') + t('js_ex_update') + `<strong>${esc(tableM[1])}</strong>` + end);
    const setM = s.match(/set\s+(.+?)(?:\s+where|$)/i);
    if (setM) parts.push(kw('SET') + t('js_ex_set') + `<code class="u-mono-cyan">${esc(setM[1].trim())}</code>` + end);
    const whereM = s.match(/where\s+(.+)/i);
    if (whereM) parts.push(kw('WHERE') + t('js_ex_where_only') + `<code class="u-mono-cyan">${esc(whereM[1].trim())}</code>` + end);
    else parts.push(kw('⚠️') + t('js_ex_no_where_update') + end);
  } else if (sl.startsWith('delete')) {
    const tableM = s.match(/from\s+(\w+)/i);
    if (tableM) parts.push(kw('DELETE') + t('js_ex_delete') + `<strong>${esc(tableM[1])}</strong>` + end);
    const whereM = s.match(/where\s+(.+)/i);
    if (whereM) parts.push(kw('WHERE') + t('js_ex_where_only') + `<code class="u-mono-cyan">${esc(whereM[1].trim())}</code>` + end);
    else parts.push(kw('⚠️') + t('js_ex_no_where_delete') + end);
  } else if (sl.startsWith('create table')) {
    const tableM = s.match(/create\s+table\s+(\w+)/i);
    if (tableM) parts.push(kw('CREATE') + t('js_ex_create') + `<strong>${esc(tableM[1])}</strong>` + end);
    parts.push(kw('Columns') + t('js_ex_create_cols') + end);
  } else if (sl.startsWith('alter table')) {
    const tableM = s.match(/alter\s+table\s+(\w+)/i);
    if (tableM) parts.push(kw('ALTER') + t('js_ex_alter') + `<strong>${esc(tableM[1])}</strong>` + t('js_ex_alter2') + end);
    if (sl.includes('add')) parts.push(kw('ADD COLUMN') + t('js_ex_add_col') + end);
  }

  if (!parts.length) parts.push(kw('SQL') + t('js_ex_generic') + end);

  // Add learning tip based on what's in the query
  let tip = '';
  if (/distinct/i.test(s)) tip = t('js_ex_tip_distinct');
  else if (/left\s+join/i.test(s)) tip = t('js_ex_tip_left_join');
  else if (/inner\s+join/i.test(s)) tip = t('js_ex_tip_inner_join');
  else if (/having/i.test(s) && /group\s+by/i.test(s)) tip = t('js_ex_tip_having');
  else if (/group\s+by/i.test(s)) tip = t('js_ex_tip_groupby');
  else if (/where.*null/i.test(s)||/is\s+null/i.test(s)) tip = t('js_ex_tip_null');
  else if (/like/i.test(s)) tip = t('js_ex_tip_like');
  else if (/between/i.test(s)) tip = t('js_ex_tip_between');
  else if (/\bin\s*\(/i.test(s)) tip = t('js_ex_tip_in');
  else if (sl.startsWith('update') && /where/i.test(s)) tip = t('js_ex_tip_update_where');
  else if (sl.startsWith('delete') && /where/i.test(s)) tip = t('js_ex_tip_delete_where');

  if (tip) {
    parts.push(`<div class="why-error-tip">${tip}</div>`);
  }

  return parts.join('');
}

// ── DAILY CHALLENGE ───────────────────────────────────────────────
const DAILY = {
  _attempts: { easy: 0, medium: 0, hard: 0 },
  _revealed: { easy: false, medium: false, hard: false },

  // Geeft de drie scenario-IDs voor vandaag terug: één easy, medium en hard
  getTodayIds() {
    const d = new Date();
    const seed = d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate();
    const byDiff = diff => SCENARIOS.filter(s => s.diff === diff && !s.steps);
    const pick = (arr, offset) => {
      // Vermijd integer overflow: gebruik modulaire rekenrekunde stap voor stap
      const MOD = arr.length;
      if (!MOD) return null; // no scenarios for this difficulty — caller must handle null
      let h = seed;
      for (let i = 0; i <= offset; i++) h = ((h % MOD) * (2654435761 % MOD) + (i * 7)) % MOD;
      return arr[((h % MOD) + MOD) % MOD];
    };
    const easyPick  = pick(byDiff('easy'),   0);
    const medPick   = pick(byDiff('medium'), 1);
    const hardPick  = pick(byDiff('hard'),   2);
    return {
      easy:   easyPick  ? easyPick.id  : null,
      medium: medPick   ? medPick.id   : null,
      hard:   hardPick  ? hardPick.id  : null,
    };
  },
  // Laad de opgeslagen dagelijkse status (object: {date, done: {easy,medium,hard}})
  _loadState() {
    try {
      const raw = localStorage.getItem('datashop_daily_v2');
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (s.date !== new Date().toDateString()) return null;
      return s;
    } catch(e) { return null; }
  },
  _saveState(done) {
    try {
      // Save today's state
      localStorage.setItem('datashop_daily_v2', JSON.stringify({
        date: new Date().toDateString(),
        done,
        ids: this.getTodayIds(),
      }));
      // Also persist into rolling 7-day history for streak calendar
      const histKey = 'datashop_daily_history';
      let hist = {};
      try { hist = JSON.parse(localStorage.getItem(histKey)) || {}; } catch(e) {}
      hist[new Date().toDateString()] = done;
      // Prune entries older than 8 days
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 8);
      for (const k of Object.keys(hist)) {
        if (new Date(k) < cutoff) delete hist[k];
      }
      localStorage.setItem(histKey, JSON.stringify(hist));
    } catch(e) {}
  },
  isDoneToday(diff) {
    const s = this._loadState();
    if (!s) return false;
    return diff ? !!s.done?.[diff] : ['easy','medium','hard'].every(d => s.done?.[d]);
  },
  markDone(diff) {
    const s = this._loadState() || { date: new Date().toDateString(), done: {}, ids: this.getTodayIds() };
    s.done[diff] = true;
    this._saveState(s.done);
    this.updateBadge();
  },
  updateBadge() {
    const badge = $('daily-badge');
    if (!badge) return;
    const remaining = ['easy','medium','hard'].filter(d => !this.isDoneToday(d)).length;
    badge.textContent = remaining;
    badge.classList.toggle('u-hidden', !(remaining > 0));
  },
  render() {
    const el = $('daily-content');
    if (!el) return;
    // Reset in-memory attempt/reveal state when re-rendering (new day or full re-render)
    this._attempts = { easy: 0, medium: 0, hard: 0 };
    this._revealed = { easy: false, medium: false, hard: false };
    const ids = this.getTodayIds();
    const today = new Date().toLocaleDateString('nl-BE',{weekday:'long',day:'numeric',month:'long'});
    const todayStr = today.charAt(0).toUpperCase() + today.slice(1);

    const doneCount = ['easy','medium','hard'].filter(d => this.isDoneToday(d)).length;
    $('daily-subtitle').textContent = `${todayStr} · ${doneCount}/3 ${t('js_progress_done')}`;

    // ── Week streak calendar ─────────────────────────────────────
    // Read the single localStorage key once up front — the loop checks 7 different
    // date keys, so we can't reuse _loadState() (which only accepts today), but we
    // can avoid parsing the same JSON 7 times by caching the raw parsed object and
    // only checking its .date field against each day's key.
    // Read rolling history for 7-day calendar
    let hist = {};
    try { hist = JSON.parse(localStorage.getItem('datashop_daily_history')) || {}; } catch(e) {}
    // Also include today from the live state
    const todayState = this._loadState();
    if (todayState) hist[new Date().toDateString()] = todayState.done;

    const weekDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const dayDone = hist[key] || null;
      const done3  = dayDone && ['easy','medium','hard'].every(x => dayDone[x]);
      const done1  = dayDone && ['easy','medium','hard'].some(x => dayDone[x]);
      const isToday = i === 0;
      const label   = d.toLocaleDateString('nl-BE',{weekday:'short'}).replace('.','');
      weekDays.push({ label, done3, done1, isToday });
    }

    const streakCount = (() => {
      let n = 0;
      for (let i = weekDays.length - 1; i >= 0; i--) {
        if (weekDays[i].done3 || (weekDays[i].isToday && doneCount > 0)) n++;
        else if (!weekDays[i].isToday) break;
      }
      return n;
    })();

    const calHtml = `
      <div class="daily-cal-wrap">
        <div class="daily-week-cal">
          ${weekDays.map(d => `
            <div class="daily-week-day${d.done3?' done3':d.done1?' done1':''} ${d.isToday?'today':''}">
              <span class="dwd-dot">${d.done3?'✓':d.done1?'·':'○'}</span>
              <span class="dwd-lbl">${d.label}</span>
            </div>`).join('')}
        </div>
        ${streakCount >= 2 ? `<div class="daily-streak-badge">🔥 ${streakCount} ${t('js_daily_streak_badge')}</div>` : ''}
      </div>`;

    const diffLabel = { easy: t('js_diff_easy'), medium: t('js_diff_medium'), hard: t('js_diff_hard') };
    const diffEmoji = { easy:'🟢', medium:'🟠', hard:'🔴' };
    const diffXPMult = { easy:1.2, medium:1.5, hard:2.0 };
    const diffAccent = {
      easy:   { bg:'rgba(74,222,128,.07)',  border:'rgba(74,222,128,.25)',  top:'var(--green)',  xpColor:'var(--green)' },
      medium: { bg:'rgba(251,146,60,.07)',  border:'rgba(251,146,60,.25)',  top:'var(--orange)', xpColor:'var(--orange)' },
      hard:   { bg:'rgba(248,113,113,.07)', border:'rgba(248,113,113,.25)', top:'var(--red)',    xpColor:'var(--red)' },
    };

    const allDone = doneCount === 3;

    if (allDone) {
      el.innerHTML = calHtml + `
        <div class="daily-all-done">
          <div class="daily-all-done-icon">🏆</div>
          <div class="daily-all-done-title">${t('js_daily_all_done_title')}</div>
          <div class="daily-all-done-sub">${t('js_daily_all_done_sub')}</div>
        </div>
        <div class="daily-done-cards">
          ${['easy','medium','hard'].map(diff => {
            const sc  = SCENARIOS.find(s => s.id === ids[diff]);
            const acc = diffAccent[diff];
            const xp  = sc ? Math.round(sc.xp * diffXPMult[diff]) : 0;
            return `
            <div class="daily-done-card daily-done-card--${diff}">
              <span class="daily-done-icon">${sc?.icon||'✅'}</span>
              <div>
                <div class="daily-diff-label-small">${diffEmoji[diff]} ${diffLabel[diff]}</div>
                <div class="daily-done-card-title">${sc ? esc(sc.title) : ''}</div>
              </div>
              <div class="daily-done-card-xp daily-xp-${diff}">+${xp} XP</div>
            </div>`;
          }).join('')}
        </div>`;
      return;
    }

    // ── Render challenge cards ───────────────────────────────────
    const cards = ['easy','medium','hard'].map(diff => {
      const sc  = SCENARIOS.find(s => s.id === ids[diff]);
      if (!sc) return '';
      const done    = this.isDoneToday(diff);
      const bonusXP = Math.round(sc.xp * diffXPMult[diff]);
      const acc     = diffAccent[diff];

      if (done) {
        return `
        <div class="daily-card daily-card-done daily-done-card--${diff}">
          <div class="daily-card-header">
            <div class="daily-diff-badge daily-diff-badge--${diff}">${diffEmoji[diff]} ${diffLabel[diff]}</div>
            <div class="daily-done-check">${t('js_daily_done')} · <span class="daily-xp-${diff}">+${bonusXP} XP</span></div>
          </div>
          <div class="daily-card-body">
            <div class="daily-done-sc-icon">${sc.icon}</div>
            <div class="daily-meta-title daily-done-title">${esc(sc.title)}</div>
          </div>
        </div>`;
      }

      return `
      <div class="daily-card daily-card--${diff}">
        <div class="daily-card-header">
          <div class="daily-diff-badge daily-diff-badge--${diff}">${diffEmoji[diff]} ${diffLabel[diff]}</div>
          <div class="daily-xp-badge daily-xp-badge--${diff}">+${bonusXP} XP</div>
        </div>
        <div class="daily-card-body">
          <div class="daily-icon-wrap daily-icon-wrap--${diff}">${sc.icon}</div>
          <div class="daily-card-info">
            <div class="daily-meta-title">${esc(sc.title)}</div>
            <div class="daily-card-story" id="daily-story-${diff}">${sc.story}</div>
            <button class="daily-story-toggle" data-action="toggle-daily-story" data-diff="${diff}">↓ Meer lezen</button>
          </div>
        </div>
        <div class="daily-card-footer">
          <div class="daily-footer-tags">
            <span class="tag tag-${diff === 'easy' ? 'easy' : diff === 'medium' ? 'medium' : 'hard'}">${diffLabel[diff]}</span>
            <span class="tag tag-xp">+${sc.xp} basis XP</span>
            <span class="tag tag-sql-type">${sc.sqlType?.toUpperCase()||'SQL'}</span>
            ${sc.time ? `<span class="tag tag-time">⏱ ${sc.time}s</span>` : ''}
          </div>
        </div>
        <div class="daily-sql-wrap">
          <div class="hl-wrap">
            <div class="hl-backdrop" id="hl-daily-${diff}" aria-hidden="true"></div>
            <textarea id="daily-sql-${diff}" class="sql-editor daily-sql-ta" rows="4"
              placeholder="-- Schrijf je SQL hier...&#10;-- Ctrl+Enter om uit te voeren" spellcheck="false"></textarea>
          </div>
          <div id="daily-fb-${diff}" class="feedback"></div>
          <button class="btn btn-primary btn-sm daily-run-btn" id="daily-run-${diff}" data-action="daily-run" data-diff="${diff}">▶ Uitvoeren</button>
        </div>
      </div>`;
    }).join('');

    el.innerHTML = calHtml + `<div class="daily-cards-grid">${cards}</div>`
  },

  run(diff) {
    const ids = this.getTodayIds();
    const sc = SCENARIOS.find(s => s.id === ids[diff]);
    const sql = ($('daily-sql-'+diff)||{}).value?.trim();
    const fb = $('daily-fb-'+diff);
    if (!fb) return;
    if (!sql) { fb.className='feedback err visible'; fb.textContent=t('js_write_sql_first'); return; }
    if (this.isDoneToday(diff)) {
      fb.className='feedback hint visible';
      fb.textContent=`✅ ${t('js_daily_completed3')}`;
      return;
    }
    if (this._revealed[diff]) {
      fb.className='feedback err visible';
      fb.textContent=`💡 ${t('js_solution_shown')}`;
      return;
    }
    if (!sc) { fb.className='feedback err visible'; fb.textContent=t('js_scenario_not_found'); return; }
    if (sc.steps) { fb.className='feedback err visible'; fb.textContent=t('js_scenario_multistep'); return; }
    const res = sc.check(sql);
    if (res.ok) {
      const multiplier = {easy:1.2, medium:1.5, hard:2.0};
      const alreadyDoneInMain = G.done.has(sc.id);
      const bonusXP = alreadyDoneInMain
        ? Math.round(sc.xp * 0.5)
        : Math.round(sc.xp * multiplier[diff]);
      const bonusLabel = alreadyDoneInMain
        ? `+${bonusXP} extra bonus XP 🌅 (missie al voltooid)`
        : `+${bonusXP} bonus XP 🌅 (×${multiplier[diff]})`;
      fb.className = 'feedback ok visible';
      fb.innerHTML = `${t('js_challenge_ok')} <strong>${bonusLabel}</strong>`;
      G.xp += bonusXP;
      G.streak++;
      UI.xpPop('+'+bonusXP+' XP 🌅');
      UI.updateXP();
      UI.addEvent('ok', `🌅 ${t('js_daily_completed')} <strong>${esc(sc.title)}</strong> ${t('js_daily_completed2')} +${bonusXP} XP`);
      this.markDone(diff);
      save();
      APP.checkNewKeyword(sql);
      // Pedagogic reflection
      const dailyReflectEl = document.createElement('div');
      dailyReflectEl.className = 'concept-win-box';
      dailyReflectEl.innerHTML = buildWinReflection(sc, sql);
      fb.after(dailyReflectEl);
      const explainEl = document.createElement('div');
      explainEl.className = 'sql-explain';
      explainEl.innerHTML = `<div class="sql-explain-title">${t('js_explain_title')}</div>${explainSQL(sql)}`;
      dailyReflectEl.after(explainEl);
      // Re-render na korte delay om voltooide kaart te tonen
      setTimeout(() => this.render(), 400);
    } else {
      this._attempts[diff] = (this._attempts[diff] || 0) + 1;
      const attempts = this._attempts[diff];
      const remaining = 4 - attempts;
      fb.className = 'feedback err visible';
      // Smart streak: onderscheid syntax van logische fout
      const isSyntaxDailyErr = res.msg && (res.msg.includes('Gebruik') || res.msg.includes('Begin met') || res.msg.includes('ontbreekt') || res.msg.includes('vergeten'));
      const countdownHint = remaining > 0
        ? `<br><small class="u-muted">Nog ${remaining} poging${remaining === 1 ? '' : 'en'} voor de oplossing wordt ontgrendeld.</small>`
        : '';
      if (isSyntaxDailyErr) {
        setFbHTML(fb, '⚠️ ' + res.msg + `<br><small class="u-muted">${t('js_streak_intact2')}</small>` + countdownHint);
      } else {
        setFbHTML(fb, '❌ ' + (res.msg || t('js_daily_wrong')) + countdownHint);
      }
      // Na 4 pogingen: toon "Toon oplossing" knop
      if (attempts >= 4 && !this._revealed[diff]) {
        const revealBtnId = 'daily-reveal-' + diff;
        if (!document.getElementById(revealBtnId)) {
          const revealBtn = document.createElement('button');
          revealBtn.id = revealBtnId;
          revealBtn.className = 'btn btn-outline btn-sm';
          revealBtn.classList.add('btn-reveal');
          revealBtn.innerHTML = t('js_show_solution_btn');
          revealBtn.dataset.action = 'daily-reveal';
          revealBtn.dataset.diff = diff;
          fb.after(revealBtn);
        }
      }
    }
  },

  revealSolution(diff) {
    if (this._revealed[diff]) return;
    this._revealed[diff] = true;
    const ids = this.getTodayIds();
    const sc = SCENARIOS.find(s => s.id === ids[diff]);
    if (!sc) return;
    const solution = sc.hint || sc.solution || sc.answer || '';
    const fb = $('daily-fb-' + diff);
    const revealBtn = document.getElementById('daily-reveal-' + diff);
    if (revealBtn) revealBtn.remove();
    // Toon oplossing in een speciaal blok
    const solutionEl = document.createElement('div');
    solutionEl.className = 'daily-solution-box';
    solutionEl.innerHTML = `
      <div class="daily-solution-label">💡 Voorbeeldoplossing — geen XP</div>
      <pre class="daily-solution-pre">${esc(solution)}</pre>
      <div class="daily-solution-note">Bestudeer deze oplossing goed. Je kan de uitdaging morgen opnieuw proberen!</div>`;
    if (fb) fb.after(solutionEl);
    // Vergrendel de knop zodat leerling geen XP meer kan verdienen
    const runBtn = document.getElementById('daily-run-' + diff);
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.classList.add('btn-completed-locked');
      runBtn.title = t('js_daily_revealed');
    }
  }
};


// ── SCENARIO → TUTORIAL KOPPELING ────────────────────────────────
const SC_TUT_LINK = {
  // SELECT basics
  first_select:      { mod: 'select_basics',        les: 0, get label() { return nTut('select_basics', 0, 'title'); } },
  active_customers:  { mod: 'select_basics',        les: 1, get label() { return nTut('select_basics', 1, 'title'); } },
  low_stock:         { mod: 'select_basics',        les: 2, get label() { return nTut('select_basics', 2, 'title'); } },
  // INSERT / UPDATE / DELETE
  new_customer:      { mod: 'insert_update_delete', les: 0, get label() { return nTut('insert_update_delete', 0, 'title'); } },
  new_product:       { mod: 'insert_update_delete', les: 0, get label() { return nTut('insert_update_delete', 0, 'title'); } },
  new_order:         { mod: 'insert_update_delete', les: 0, get label() { return nTut('insert_update_delete', 0, 'title'); } },
  restock_webcam:    { mod: 'insert_update_delete', les: 1, get label() { return nTut('insert_update_delete', 1, 'title'); } },
  disable_coupon:    { mod: 'insert_update_delete', les: 1, get label() { return nTut('insert_update_delete', 1, 'title'); } },
  delete_test:       { mod: 'insert_update_delete', les: 2, get label() { return nTut('insert_update_delete', 2, 'title'); } },
  // Aggregaten
  count_products:    { mod: 'aggregaten',           les: 0, get label() { return nTut('aggregaten', 0, 'title'); } },
  avg_review:        { mod: 'aggregaten',           les: 0, get label() { return nTut('aggregaten', 0, 'title'); } },
  count_orders:      { mod: 'aggregaten',           les: 1, get label() { return nTut('aggregaten', 1, 'title'); } },
  // JOINs
  join_orders:       { mod: 'joins',                les: 0, get label() { return nTut('joins', 0, 'title'); } },
  inner_join_basic:  { mod: 'joins',                les: 0, get label() { return nTut('joins', 0, 'title'); } },
  // DDL
  add_telefoon:      { mod: 'advanced',             les: 2, get label() { return nTut('advanced', 2, 'title'); } },
  create_leverancier:{ mod: 'advanced',             les: 2, get label() { return nTut('advanced', 2, 'title'); } },
};


// ── WIN REFLECTION ────────────────────────────────────────────────
function getConceptWinTexts() {
  return {
    select: { icon: '🔍', get title() { return t('js_win_select_title'); }, get explain() { return t('js_win_select_explain'); }, get tip() { return t('js_win_select_tip'); } },
    insert: { icon: '➕', get title() { return t('js_win_insert_title'); }, get explain() { return t('js_win_insert_explain'); }, get tip() { return t('js_win_insert_tip'); } },
    update: { icon: '✏️', get title() { return t('js_win_update_title'); }, get explain() { return t('js_win_update_explain'); }, get tip() { return t('js_win_update_tip'); } },
    delete: { icon: '🗑️', get title() { return t('js_win_delete_title'); }, get explain() { return t('js_win_delete_explain'); }, get tip() { return t('js_win_delete_tip'); } },
    ddl:    { icon: '🏗️', get title() { return t('js_win_ddl_title');    }, get explain() { return t('js_win_ddl_explain');    }, get tip() { return t('js_win_ddl_tip');    } },
  };
}
const CONCEPT_WIN_TEXTS = new Proxy({}, {
  get(_, prop) { return getConceptWinTexts()[prop]; }
});

// Extra concept-specifieke uitleg op basis van wat er in de query staat
function detectAdvancedConcepts(sql) {
  const s = sql.toLowerCase();
  const found = [];
  if (s.includes('group by'))   found.push({ icon:'📊', name:'GROUP BY',   desc:t('js_concept_groupby') });
  if (s.includes('having'))     found.push({ icon:'🎯', name:'HAVING',     desc:t('js_concept_having') });
  if (s.includes('inner join')) found.push({ icon:'🔗', name:'INNER JOIN', desc:t('js_concept_inner_join') });
  if (s.includes('left join'))  found.push({ icon:'⬅️', name:'LEFT JOIN',  desc:t('js_concept_left_join') });
  if (s.match(/\bjoin\b/) && !s.includes('inner join') && !s.includes('left join')) found.push({ icon:'🔗', name:'JOIN', desc:t('js_concept_join') });
  if (s.includes('distinct'))   found.push({ icon:'🔎', name:'DISTINCT',   desc:t('js_concept_distinct') });
  if (s.includes('(select'))    found.push({ icon:'🧩', name:'Subquery',   desc:t('js_concept_subquery') });
  if (s.includes(' as '))       found.push({ icon:'🏷️', name:'AS (alias)', desc:t('js_concept_alias') });
  if (s.includes('order by'))   found.push({ icon:'↕️', name:'ORDER BY',  desc:t('js_concept_orderby') });
  if (s.match(/\bcount\s*\(/))  found.push({ icon:'🔢', name:'COUNT()',   desc:t('js_concept_count') });
  if (s.match(/\b(avg|sum|max|min)\s*\(/)) found.push({ icon:'📐', name:t('js_concept_agg_name'), desc:t('js_concept_agg_desc') });
  return found;
}

function buildWinReflection(sc, sql) {
  const type = sc.sqlType || 'select';
  const base = CONCEPT_WIN_TEXTS[type] || CONCEPT_WIN_TEXTS.select;
  const advanced = detectAdvancedConcepts(sql);

  // Tutorial link (hergebruik SC_TUT_LINK als beschikbaar)
  const link = SC_TUT_LINK[sc.id];
  const tutHtml = link
    ? `<div class="cwb-tut-link" data-action="open-tut-lesson" data-mod="${link.mod}" data-les="${link.les}">
        📚 Verdiep je verder: <strong>${esc(link.label)}</strong> →
      </div>`
    : '';

  const advancedHtml = advanced.length
    ? `<div class="cwb-concepts">${advanced.map(c =>
        `<div class="cwb-concept-pill"><span>${c.icon}</span><div><strong>${esc(c.name)}</strong><span>${c.desc}</span></div></div>`
      ).join('')}</div>`
    : '';

  return `<div class="cwb-head">
      <span class="cwb-icon">${base.icon}</span>
      <div>
        <div class="cwb-title">${esc(base.title)}</div>
        <div class="cwb-explain">${base.explain}</div>
      </div>
    </div>
    ${advancedHtml}
    <div class="cwb-tip">💡 ${base.tip}</div>
    ${tutHtml}`;
}


function scTutLink(scId) {
  const link = SC_TUT_LINK[scId];
  if (!link) return '';
  const isDoneTut = TUT.isLessonDone(link.mod, link.les);
  if (isDoneTut) {
    // Les al gedaan: toon groen afvinkje
    return `<a class="sc-tut-link sc-tut-link--green"
      data-action="open-tut-lesson" data-mod="${link.mod}" data-les="${link.les}"
      title="Open bijhorende tutorial les">✅ ${esc(link.label)} — bekijk nogmaals</a>`;
  } else {
    // Les nog niet gedaan: aanbeveling
    return `<div class="tut-recommended-wrap">
      <div class="tut-recommended-inner">
        <div class="tut-recommended-label">📚 Aanbevolen eerst</div>
        <div class="u-label-sm">De bijhorende tutorialles helpt je deze missie aan te pakken.</div>
      </div>
      <a class="sc-tut-link sc-tut-link--purple"
        data-action="open-tut-lesson" data-mod="${link.mod}" data-les="${link.les}">
        🎓 ${esc(link.label)}
      </a>
    </div>`;
  }
}

// ── TUTORIAL ──────────────────────────────────────────────────────
// ── TUTORIAL ──────────────────────────────────────────────────────
// TUT_MODULES is generated from NARRATIVE.tut (bilingual content in narrative.js)
// Only non-translatable data (check functions, table lists, example code, SQL hints) live here.
function getTutModules() {
  return [
    {
      id: 'select_basics', icon: '🔍', title: nTut('select_basics', null, 'title'), level: 'beginner',
      lessons: [
        {
          title: nTut('select_basics', 0, 'title'),
          tables: ['klant', 'product'],
          intro: nTut('select_basics', 0, 'intro'),
          concept: { title: nTut('select_basics', 0, 'concept', 'title'), text: nTut('select_basics', 0, 'concept', 'text') },
          examples: nTut('select_basics', 0, 'examples'),
          exercise: { task: nTut('select_basics', 0, 'exercise', 'task'), hint: nTut('select_basics', 0, 'exercise', 'hint'), check: s => s.includes('naam') && s.includes('email') && s.includes('klant') },
        },
        {
          title: nTut('select_basics', 1, 'title'),
          tables: ['klant', 'product'],
          intro: nTut('select_basics', 1, 'intro'),
          concept: { title: nTut('select_basics', 1, 'concept', 'title'), text: nTut('select_basics', 1, 'concept', 'text') },
          examples: nTut('select_basics', 1, 'examples'),
          exercise: { task: nTut('select_basics', 1, 'exercise', 'task'), hint: nTut('select_basics', 1, 'exercise', 'hint'), check: s => s.includes('prijs') && s.includes('product') && s.includes('where') },
        },
        {
          title: nTut('select_basics', 2, 'title'),
          tables: ['product'],
          intro: nTut('select_basics', 2, 'intro'),
          concept: { title: nTut('select_basics', 2, 'concept', 'title'), text: nTut('select_basics', 2, 'concept', 'text') },
          examples: nTut('select_basics', 2, 'examples'),
          exercise: { task: nTut('select_basics', 2, 'exercise', 'task'), hint: nTut('select_basics', 2, 'exercise', 'hint'), check: s => s.includes('product') && s.includes('order by') && s.includes('limit') },
        },
      ],
    },
    {
      id: 'insert_update_delete', icon: '✏️', title: nTut('insert_update_delete', null, 'title'), level: 'beginner',
      lessons: [
        {
          title: nTut('insert_update_delete', 0, 'title'),
          tables: ['product', 'klant'],
          intro: nTut('insert_update_delete', 0, 'intro'),
          concept: { title: nTut('insert_update_delete', 0, 'concept', 'title'), text: nTut('insert_update_delete', 0, 'concept', 'text') },
          examples: nTut('insert_update_delete', 0, 'examples'),
          exercise: { task: nTut('insert_update_delete', 0, 'exercise', 'task'), hint: nTut('insert_update_delete', 0, 'exercise', 'hint'), check: s => s.includes('insert') && s.includes('product') && s.includes('values') },
        },
        {
          title: nTut('insert_update_delete', 1, 'title'),
          tables: ['product', 'bestelling'],
          intro: nTut('insert_update_delete', 1, 'intro'),
          concept: { title: nTut('insert_update_delete', 1, 'concept', 'title'), text: nTut('insert_update_delete', 1, 'concept', 'text') },
          examples: nTut('insert_update_delete', 1, 'examples'),
          exercise: { task: nTut('insert_update_delete', 1, 'exercise', 'task'), hint: nTut('insert_update_delete', 1, 'exercise', 'hint'), check: s => s.includes('update') && s.includes('product') && s.includes('stock') && s.includes('where') },
          warn: nTut('insert_update_delete', 1, 'warn'),
        },
        {
          title: nTut('insert_update_delete', 2, 'title'),
          tables: ['review', 'klant'],
          intro: nTut('insert_update_delete', 2, 'intro'),
          concept: { title: nTut('insert_update_delete', 2, 'concept', 'title'), text: nTut('insert_update_delete', 2, 'concept', 'text') },
          examples: nTut('insert_update_delete', 2, 'examples'),
          exercise: { task: nTut('insert_update_delete', 2, 'exercise', 'task'), hint: nTut('insert_update_delete', 2, 'exercise', 'hint'), check: s => s.includes('delete') && s.includes('review') && s.includes('score') && s.includes('where') },
          warn: nTut('insert_update_delete', 2, 'warn'),
        },
      ],
    },
    {
      id: 'aggregaten', icon: '📊', title: nTut('aggregaten', null, 'title'), level: 'medium',
      lessons: [
        {
          title: nTut('aggregaten', 0, 'title'),
          tables: ['product', 'klant'],
          intro: nTut('aggregaten', 0, 'intro'),
          concept: { title: nTut('aggregaten', 0, 'concept', 'title'), text: nTut('aggregaten', 0, 'concept', 'text') },
          examples: nTut('aggregaten', 0, 'examples'),
          exercise: { task: nTut('aggregaten', 0, 'exercise', 'task'), hint: nTut('aggregaten', 0, 'exercise', 'hint'), check: s => s.includes('sum') && s.includes('stock') && s.includes('product') },
        },
        {
          title: nTut('aggregaten', 1, 'title'),
          tables: ['product', 'bestelling'],
          intro: nTut('aggregaten', 1, 'intro'),
          concept: { title: nTut('aggregaten', 1, 'concept', 'title'), text: nTut('aggregaten', 1, 'concept', 'text') },
          examples: nTut('aggregaten', 1, 'examples'),
          exercise: { task: nTut('aggregaten', 1, 'exercise', 'task'), hint: nTut('aggregaten', 1, 'exercise', 'hint'), check: s => s.includes('bestelling') && s.includes('count') && s.includes('group by') && s.includes('status') },
        },
        {
          title: nTut('aggregaten', 2, 'title'),
          tables: ['bestelling', 'product'],
          intro: nTut('aggregaten', 2, 'intro'),
          concept: { title: nTut('aggregaten', 2, 'concept', 'title'), text: nTut('aggregaten', 2, 'concept', 'text') },
          examples: nTut('aggregaten', 2, 'examples'),
          exercise: { task: nTut('aggregaten', 2, 'exercise', 'task'), hint: nTut('aggregaten', 2, 'exercise', 'hint'), check: s => s.includes('product') && s.includes('group by') && s.includes('having') && s.includes('count') },
        },
      ],
    },
    {
      id: 'joins', icon: '🔗', title: nTut('joins', null, 'title'), level: 'medium',
      lessons: [
        {
          title: nTut('joins', 0, 'title'),
          tables: ['klant', 'bestelling'],
          intro: nTut('joins', 0, 'intro'),
          concept: { title: nTut('joins', 0, 'concept', 'title'), text: nTut('joins', 0, 'concept', 'text') },
          examples: nTut('joins', 0, 'examples'),
          exercise: { task: nTut('joins', 0, 'exercise', 'task'), hint: nTut('joins', 0, 'exercise', 'hint'), check: s => (s.includes('inner join') || s.includes('join')) && s.includes('klant') && s.includes('bestelling') && s.includes('klant_id') },
        },
        {
          title: nTut('joins', 1, 'title'),
          tables: ['klant', 'bestelling'],
          intro: nTut('joins', 1, 'intro'),
          concept: { title: nTut('joins', 1, 'concept', 'title'), text: nTut('joins', 1, 'concept', 'text') },
          examples: nTut('joins', 1, 'examples'),
          exercise: { task: nTut('joins', 1, 'exercise', 'task'), hint: nTut('joins', 1, 'exercise', 'hint'), check: s => s.includes('left join') && s.includes('klant') && s.includes('bestelling') },
        },
        {
          title: nTut('joins', 2, 'title'),
          tables: ['klant', 'bestelling', 'product'],
          intro: nTut('joins', 2, 'intro'),
          concept: { title: nTut('joins', 2, 'concept', 'title'), text: nTut('joins', 2, 'concept', 'text') },
          examples: nTut('joins', 2, 'examples'),
          exercise: { task: nTut('joins', 2, 'exercise', 'task'), hint: nTut('joins', 2, 'exercise', 'hint'), check: s => (s.match(/join/g)||[]).length >= 2 && s.includes('klant') && s.includes('product') && s.includes('bestelling') },
        },
      ],
    },
    {
      id: 'advanced', icon: '🧬', title: nTut('advanced', null, 'title'), level: 'advanced',
      lessons: [
        {
          title: nTut('advanced', 0, 'title'),
          tables: ['klant', 'product'],
          intro: nTut('advanced', 0, 'intro'),
          concept: { title: nTut('advanced', 0, 'concept', 'title'), text: nTut('advanced', 0, 'concept', 'text') },
          examples: nTut('advanced', 0, 'examples'),
          exercise: { task: nTut('advanced', 0, 'exercise', 'task'), hint: nTut('advanced', 0, 'exercise', 'hint'), check: s => s.includes('distinct') && s.includes('categorie') && s.includes('product') },
        },
        {
          title: nTut('advanced', 1, 'title'),
          tables: ['product', 'klant', 'bestelling'],
          intro: nTut('advanced', 1, 'intro'),
          concept: { title: nTut('advanced', 1, 'concept', 'title'), text: nTut('advanced', 1, 'concept', 'text') },
          examples: nTut('advanced', 1, 'examples'),
          exercise: { task: nTut('advanced', 1, 'exercise', 'task'), hint: nTut('advanced', 1, 'exercise', 'hint'), check: s => s.includes('(select') && s.includes('avg') && s.includes('stock') },
        },
        {
          title: nTut('advanced', 2, 'title'),
          tables: ['klant', 'product'],
          intro: nTut('advanced', 2, 'intro'),
          concept: { title: nTut('advanced', 2, 'concept', 'title'), text: nTut('advanced', 2, 'concept', 'text') },
          examples: nTut('advanced', 2, 'examples'),
          exercise: { task: nTut('advanced', 2, 'exercise', 'task'), hint: nTut('advanced', 2, 'exercise', 'hint'), check: s => s.includes('create table') && s.includes('categorie') && s.includes('primary key') },
        },
      ],
    },
    {
      id: 'null_case', icon: '❓', title: nTut('null_case', null, 'title'), level: 'medium',
      lessons: [
        {
          title: nTut('null_case', 0, 'title'),
          tables: ['klant', 'product'],
          intro: nTut('null_case', 0, 'intro'),
          concept: { title: nTut('null_case', 0, 'concept', 'title'), text: nTut('null_case', 0, 'concept', 'text') },
          examples: nTut('null_case', 0, 'examples'),
          exercise: { task: nTut('null_case', 0, 'exercise', 'task'), hint: nTut('null_case', 0, 'exercise', 'hint'), check: s => s.includes('klant') && s.includes('is null') && s.includes('email') },
        },
        {
          title: nTut('null_case', 1, 'title'),
          tables: ['product', 'klant'],
          intro: nTut('null_case', 1, 'intro'),
          concept: { title: nTut('null_case', 1, 'concept', 'title'), text: nTut('null_case', 1, 'concept', 'text') },
          examples: nTut('null_case', 1, 'examples'),
          exercise: { task: nTut('null_case', 1, 'exercise', 'task'), hint: nTut('null_case', 1, 'exercise', 'hint'), check: s => s.includes('case') && s.includes('when') && s.includes('product') && s.includes('prijs') },
        },
      ],
    },
    {
      id: 'filters_advanced', icon: '🔎', title: nTut('filters_advanced', null, 'title'), level: 'medium',
      lessons: [
        {
          title: nTut('filters_advanced', 0, 'title'),
          tables: ['klant', 'product'],
          intro: nTut('filters_advanced', 0, 'intro'),
          concept: { title: nTut('filters_advanced', 0, 'concept', 'title'), text: nTut('filters_advanced', 0, 'concept', 'text') },
          examples: nTut('filters_advanced', 0, 'examples'),
          exercise: { task: nTut('filters_advanced', 0, 'exercise', 'task'), hint: nTut('filters_advanced', 0, 'exercise', 'hint'), check: s => s.includes('like') && s.includes('usb') && s.includes('product') },
        },
        {
          title: nTut('filters_advanced', 1, 'title'),
          tables: ['product', 'bestelling'],
          intro: nTut('filters_advanced', 1, 'intro'),
          concept: { title: nTut('filters_advanced', 1, 'concept', 'title'), text: nTut('filters_advanced', 1, 'concept', 'text') },
          examples: nTut('filters_advanced', 1, 'examples'),
          exercise: { task: nTut('filters_advanced', 1, 'exercise', 'task'), hint: nTut('filters_advanced', 1, 'exercise', 'hint'), check: s => s.includes('between') && s.includes('product') && s.includes('prijs') },
        },
        {
          title: nTut('filters_advanced', 2, 'title'),
          tables: ['klant', 'bestelling'],
          intro: nTut('filters_advanced', 2, 'intro'),
          concept: { title: nTut('filters_advanced', 2, 'concept', 'title'), text: nTut('filters_advanced', 2, 'concept', 'text') },
          examples: nTut('filters_advanced', 2, 'examples'),
          exercise: { task: nTut('filters_advanced', 2, 'exercise', 'task'), hint: nTut('filters_advanced', 2, 'exercise', 'hint'), check: s => s.includes('left join') && s.includes('is null') && s.includes('klant') },
        },
        {
          title: nTut('filters_advanced', 3, 'title'),
          tables: ['klant', 'product', 'review'],
          intro: nTut('filters_advanced', 3, 'intro'),
          concept: { title: nTut('filters_advanced', 3, 'concept', 'title'), text: nTut('filters_advanced', 3, 'concept', 'text') },
          examples: nTut('filters_advanced', 3, 'examples'),
          exercise: { task: nTut('filters_advanced', 3, 'exercise', 'task'), hint: nTut('filters_advanced', 3, 'exercise', 'hint'), check: s => s.includes('not in') && s.includes('product') && s.includes('elektronica') },
        },
      ],
    },
  ];
}

// Live proxy so existing code using TUT_MODULES[...] still works
const TUT_MODULES = new Proxy([], {
  get(_, prop) {
    const arr = getTutModules();
    if (prop === 'length') return arr.length;
    if (prop === 'reduce') return arr.reduce.bind(arr);
    if (prop === 'find')   return arr.find.bind(arr);
    if (prop === 'map')    return arr.map.bind(arr);
    if (prop === Symbol.iterator) return arr[Symbol.iterator].bind(arr);
    const idx = Number(prop);
    return isNaN(idx) ? arr[prop] : arr[idx];
  }
});


const TUT = {
  _lessonKey(modId, lesIdx) { return `${modId}:${lesIdx}`; },
  isLessonDone(modId, lesIdx) {
    return G.tutDone.has(this._lessonKey(modId, lesIdx));
  },
  markLesson(modId, lesIdx) {
    G.tutDone.add(this._lessonKey(modId, lesIdx));
    save();
    this.updateSidebarBadge();
    if (UI && UI.renderDash) UI.renderDash();
    // Tutorial complete achievement
    if (this.totalDone() === this.totalLessons()) UI.unlockAch('tut_complete');
  },
  totalDone() {
    return TUT_MODULES.reduce((n, m) => n + m.lessons.filter((_, i) => this.isLessonDone(m.id, i)).length, 0);
  },
  totalLessons() {
    return TUT_MODULES.reduce((n, m) => n + m.lessons.length, 0);
  },
  updateSidebarBadge() {
    const done  = this.totalDone();
    const total = this.totalLessons();
    const pct   = total ? Math.round(done / total * 100) : 0;
    const badge = document.getElementById('tut-nav-pct');
    if (badge) {
      badge.textContent = pct + '%';
      badge.classList.toggle('u-hidden', !(done > 0));
    }
  },

  // State
  _activeMod: null,
  _activeLes: 0,

  render() {
    const el = $('tut-content');
    if (!el) return;
    if (this._activeMod) {
      this._renderLesson(el);
    } else {
      this._renderOverview(el);
    }
  },

  _renderOverview(el) {
    const done = this.totalDone();
    const total = this.totalLessons();
    const pct = total ? Math.round(done / total * 100) : 0;
    const levelLabel = { beginner: t('js_level_beginner'), medium: t('js_level_medium'), advanced: t('js_level_advanced') };
    const levelClass = { beginner: 'tut-badge-beginner', medium: 'tut-badge-medium', advanced: 'tut-badge-advanced' };

    el.innerHTML = `
      <div class="tut-overview-wrap">
      <div class="tut-progress-bar">
        <div class="tut-progress-label">${done} / ${total} lessen</div>
        <div class="tut-progress-track"><div class="tut-progress-fill" data-w="${pct}"></div></div>
        <div class="tut-progress-pct">${pct}%</div>
      </div>
      <div class="tut-module-grid">
        ${TUT_MODULES.map(m => {
          const modDone = m.lessons.filter((_, i) => this.isLessonDone(m.id, i)).length;
          const modPct = Math.round(modDone / m.lessons.length * 100);
          const completed = modDone === m.lessons.length;
          return `<div class="tut-module ${completed ? 'completed' : ''}" data-level="${m.level}" data-action="open-tut-module" data-mod="${m.id}">
            <div class="tut-module-head">
              <div class="tut-module-icon">${m.icon}</div>
              <div class="tut-module-meta">
                <div class="tut-module-title">${esc(m.title)}</div>
                <div class="tut-module-sub">${modDone}/${m.lessons.length} lessen voltooid</div>
              </div>
              <span class="tut-module-badge ${levelClass[m.level]}">${levelLabel[m.level]}</span>
            </div>
            <div class="tut-module-progress">
              <div class="tut-module-prog-fill" data-w="${modPct}"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="tut-nav-empty">
        Klik op een module om de lessen te starten · Voortgang wordt lokaal opgeslagen
      </div>
      </div>`;
    applyBarWidths(el);
  },

  openModule(modId) {
    this._activeMod = modId;
    this._activeLes = 0;
    // Open at first unfinished lesson
    const m = TUT_MODULES.find(x => x.id === modId);
    if (m) {
      const firstUnfinished = m.lessons.findIndex((_, i) => !this.isLessonDone(modId, i));
      if (firstUnfinished >= 0) this._activeLes = firstUnfinished;
    }
    this.render();
  },

  _renderLesson(el) {
    const m = TUT_MODULES.find(x => x.id === this._activeMod);
    if (!m) { this._activeMod = null; this.render(); return; }
    const les = m.lessons[this._activeLes];
    if (!les) return;
    const isDone = this.isLessonDone(m.id, this._activeLes);
    const isLast = this._activeLes === m.lessons.length - 1;

    // Build table viewer HTML
    const tableNames = les.tables || ['klant', 'product'];
    const tableViewerHtml = tableNames.map(tName => {
      const tbl = DB[tName];
      if (!tbl) return '';
      const label = { klant: 'klant', product: 'product', bestelling: 'bestelling', review: 'review', kortingscode: 'kortingscode' }[tName] || tName;
      const colHtml = tbl.cols.map(c => {
        const cls = c.pk ? 'pk-col' : c.fk ? 'fk-col' : '';
        const badge = c.pk ? ' 🔑' : c.fk ? ' 🔗' : '';
        return `<th class="${cls}">${c.n}${badge}</th>`;
      }).join('');
      const rowsHtml = tbl.rows.map(r => {
        const cells = tbl.cols.map(c => {
          const v = r[c.n];
          if (v === null || v === undefined) return `<td class="null-val">NULL</td>`;
          if (c.t === 'BOOLEAN' || (tName === 'klant' && c.n === 'actief') || (tName === 'kortingscode' && c.n === 'actief')) {
            return `<td class="${v ? 'bool-val-1' : 'bool-val-0'}">${v ? '1 ✓' : '0 ✗'}</td>`;
          }
          if (c.pk || c.fk || c.t === 'INT' || c.t.startsWith('DECIMAL')) {
            return `<td class="num-val">${v}</td>`;
          }
          return `<td>${esc(String(v))}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `
        <div class="tut-table-card">
          <div class="tut-table-card-head">📋 ${label} <span>${tbl.rows.length} rijen · ${tbl.cols.length} kolommen</span></div>
          <div class="tut-table-scroll">
            <table class="tut-tbl">
              <thead><tr>${colHtml}</tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
          <div class="tut-schema-legend">
            <span class="leg-pk"><b>🔑</b> Primary Key</span>
            <span class="leg-fk"><b>🔗</b> Foreign Key</span>
          </div>
        </div>`;
    }).join('');

    el.innerHTML = `
      <div class="tut-layout">
        <div class="tut-lesson-col">
          <div class="tut-lesson-wrap">
            <div class="tut-lesson-header">
              <button class="tut-lesson-back" data-action="tut-back">← Overzicht</button>
              <div class="tut-lesson-title">${esc(m.icon)} ${esc(les.title)}</div>
              <div class="tut-lesson-counter">${this._activeLes + 1} / ${m.lessons.length}</div>
            </div>
            <div class="tut-lesson-body">
              <!-- Voortgangsbolletjes -->
              <div class="tut-step-dots">
                ${m.lessons.map((l, i) => {
                  const done = this.isLessonDone(m.id, i);
                  const active = i === this._activeLes;
                  return `<div class="tut-step-dot ${done ? 'done' : ''} ${active ? 'active' : ''}" data-action="tut-go-lesson" data-les="${i}" title="${esc(l.title)}"></div>`;
                }).join('')}
              </div>

              <!-- Intro -->
              <div class="tut-lesson-intro">${les.intro}</div>

              <!-- Concept box -->
              ${les.concept ? `
              <div class="tut-concept-box">
                <h4>${esc(les.concept.title)}</h4>
                <p><code class="tut-concept-code">${esc(les.concept.text)}</code></p>
              </div>` : ''}

              <!-- Waarschuwing -->
              ${les.warn ? `<div class="tut-warn-box">${les.warn}</div>` : ''}

              <!-- Voorbeelden -->
              ${les.examples && les.examples.length ? `
              <div class="tut-example-title">📌 Voorbeelden</div>
              <div class="tut-example-grid">
                ${les.examples.map(ex => `
                  <div class="tut-example-card">
                    <div class="tut-example-card-head">${esc(ex.label)}</div>
                    <code>${esc(ex.code)}</code>
                    <div class="tut-ex-result">→ ${esc(ex.result)}</div>
                  </div>`).join('')}
              </div>` : ''}

              <!-- Oefening -->
              ${les.exercise ? `
              <div class="tut-exercise">
                <div class="tut-exercise-label">✏️ Mini-quest</div>
                <div class="tut-exercise-task">${les.exercise.task}</div>
                <div class="tut-exercise-hint-wrap">
                  <button class="btn btn-outline btn-sm tut-hint-toggle" data-action="toggle-tut-hint">💡 Toon hint</button>
                  <div class="tut-exercise-hint hidden">💡 Hint: <code class="tut-exercise-hint-code">${esc(les.exercise.hint)}</code></div>
                </div>
                <div class="hl-wrap">
                  <div class="hl-backdrop" id="hl-tut-ex" aria-hidden="true"></div>
                  <textarea class="sql-editor tut-ex-textarea" id="tut-ex-sql" placeholder="-- Schrijf hier je SQL..."
                    ${isDone ? ' disabled' : ''}></textarea>
                </div>
                <div class="tut-exercise-action-row">
                  ${!isDone ? `<button class="btn btn-primary btn-sm" data-action="tut-run-exercise">▶ Controleren</button>` : ''}
                  ${isDone ? `<span class="tut-exercise-done-label">${t('js_tut_exercise_done')}</span><button class="btn btn-outline btn-sm" data-action="tut-retry-exercise" title="Practice again">${t('js_tut_retry')}</button>` : ''}
                  ${this._activeLes > 0 ? `<button class="btn btn-outline btn-sm" data-action="tut-go-lesson" data-les="${this._activeLes - 1}">← Vorige les</button>` : ''}
                  <button class="btn btn-outline btn-sm btn-tut-next" data-action="tut-next">
                    ${isLast ? t('js_tut_complete_module') : t('js_tut_next_lesson')}
                  </button>
                </div>
                <div class="feedback tut-ex-fb" id="tut-ex-fb"></div>
              </div>` : `
              <div class="tut-nav-row">
                ${this._activeLes > 0 ? `<button class="btn btn-outline btn-sm" data-action="tut-go-lesson" data-les="${this._activeLes - 1}">← Vorige les</button>` : '<span></span>'}
                <button class="btn btn-primary btn-sm" data-action="tut-next">
                  ${isLast ? t('js_tut_complete_module') : t('js_tut_next_lesson')}
                </button>
              </div>`}
            </div>
          </div>
        </div>
        <div class="tut-table-col">
          <div class="tut-tables-label">🗄️ Tabellen in deze les</div>
          <div class="tut-table-viewer">
            ${tableViewerHtml}
          </div>
        </div>
      </div>`;

    // Syntax highlighter
    setTimeout(() => {
      const ta = EL['tut-ex-sql'];
      if (ta) initHighlighter(ta);
    }, 60);
  },

  _back() {
    this._activeMod = null;
    this.render();
  },

  _retryExercise() {
    // Undo the done-mark for current lesson to allow re-practice
    const m = TUT_MODULES.find(x => x.id === this._activeMod);
    if (!m) return;
    // Re-render to enable the textarea again (don't remove from tutDone to keep progress)
    const ta = EL['tut-ex-sql'];
    if (ta) {
      ta.disabled = false;
      ta.value = '';
      const fb = $('tut-ex-fb');
      if (fb) { fb.className = 'feedback'; fb.textContent = ''; }
      // Re-enable check button by re-rendering, but mark as not done temporarily
      const key = this._lessonKey(m.id, this._activeLes);
      G.tutDone.delete(key);
      this.render();
    }
  },

  _goLesson(i) {
    this._activeLes = i;
    this.render();
  },

  _next() {
    const m = TUT_MODULES.find(x => x.id === this._activeMod);
    if (!m) return;
    const les = m.lessons[this._activeLes];
    // If lesson has an exercise and it's not done, require completion first
    if (les && les.exercise && !this.isLessonDone(m.id, this._activeLes)) {
      const fb = $('tut-ex-fb');
      if (fb) {
        fb.className = 'feedback hint visible';
        fb.textContent = t('js_tut_complete_first');
        fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }
    if (this._activeLes < m.lessons.length - 1) {
      this._activeLes++;
      this.render();
    } else {
      // Module voltooid
      this._activeMod = null;
      this.render();
      UI.addEvent('ok', `🎓 ${t('js_tut_module_done')} "<strong>${esc(m.title)}</strong>" ${t('js_tut_module_done2')}`);
      // XP bonus
      const bonus = 30;
      G.xp += bonus;
      UI.xpPop('+' + bonus + ' XP 🎓');
      UI.updateXP();
      save();
    }
  },

  _runExercise() {
    const m = TUT_MODULES.find(x => x.id === this._activeMod);
    if (!m) return;
    const les = m.lessons[this._activeLes];
    const sql = (EL['tut-ex-sql'] || {}).value?.trim() || '';
    const fb = $('tut-ex-fb');
    if (!sql) { fb.className = 'feedback err visible'; fb.textContent = t('js_write_sql_first'); return; }

    // Sla vorige poging op als ghost (voor iteratief verbeteren)
    const ta = EL['tut-ex-sql'];
    if (ta && !ta.dataset.lastAttempt) ta.dataset.lastAttempt = '';
    const prevAttempt = ta ? ta.dataset.lastAttempt : '';
    if (ta) ta.dataset.lastAttempt = sql;

    const s = sql.toLowerCase();
    if (les.exercise.check(s)) {
      // Try to actually run the SQL for visual feedback
      let resultHtml = '';
      try {
        const res = runSQL(sql);
        if (res.ok && res.type === 'select' && res.rows && res.rows.length) {
          const cols = Object.keys(res.rows[0]);
          resultHtml = `<div class="tut-result-wrap"><table class="data-table tut-result-table">
            <thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
            <tbody>${res.rows.slice(0, 5).map(r => `<tr>${cols.map(c => `<td>${r[c] == null ? '<span class="u-muted">NULL</span>' : esc(String(r[c]))}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>${res.rows.length > 5 ? `<div class="tut-result-more">... en ${res.rows.length - 5} rijen meer</div>` : ''}</div>`;
        }
      } catch(e) {}
      fb.className = 'feedback ok visible';
      fb.innerHTML = `✅ <strong>${t('js_tut_correct')}</strong>` + resultHtml;
      this.markLesson(m.id, this._activeLes);
      // Disable textarea
      if (ta) ta.disabled = true;
      // Swap button to "Voltooid"
      const btn = fb.previousElementSibling?.querySelector('button[data-action="tut-run-exercise"]');
      if (btn) {
        btn.textContent = t('js_tut_exercise_done');
        btn.disabled = true;
        btn.classList.add('btn-completed');
      }
    } else {
      fb.className = 'feedback err visible';
      // Intelligente foutanalyse
      const errTips = tutErrorAnalysis(sql, les);

      // Ghost: toon vorige poging als er een was en ze anders zijn
      let ghostHtml = '';
      if (prevAttempt && prevAttempt !== sql) {
        ghostHtml = `<div class="tut-ghost-attempt">
          <span class="tut-ghost-label">🔁 Vorige poging:</span>
          <code class="tut-ghost-code">${esc(prevAttempt)}</code>
        </div>`;
      }

      fb.innerHTML = `❌ ${t('js_tut_not_correct')}` + errTips + ghostHtml;
    }
  },
};


// ── TUTORIAL FOUT ANALYSE ─────────────────────────────────────────
function tutErrorAnalysis(sql, les) {
  const s = sql.trim().toLowerCase();
  if (!s) return '';
  const tips = [];

  // Context-sensitive: detecteer exact welk keyword ontbreekt op basis van wat er wél is
  const hasSelect = s.includes('select');
  const hasFrom   = s.includes('from');
  const hasWhere  = s.includes('where');
  const hasGroupBy = s.includes('group by');
  const hasHaving  = s.includes('having');
  const hasOrder   = s.includes('order');
  const hasOrderBy = s.includes('order by');

  if (!s.startsWith('select') && !s.startsWith('insert') && !s.startsWith('update') && !s.startsWith('delete') && !s.startsWith('create') && !s.startsWith('alter')) {
    tips.push({ kw: t('js_tip_structure_kw'), msg: t('js_tip_structure_msg') });
  }
  // More precise hint: SELECT without FROM
  if (hasSelect && !hasFrom) {
    tips.push({ kw: t('js_tip_from_kw'), msg: t('js_tip_from_msg') });
  }
  // Almost right: has SELECT and FROM but missing WHERE that task requires
  if (hasSelect && hasFrom && !hasWhere) {
    const taskLower = (les.exercise?.task || '').toLowerCase();
    if (taskLower.includes('waar') || taskLower.includes('filter') || taskLower.includes('where') || taskLower.includes('alleen') || taskLower.includes('only') || taskLower.includes('find')) {
      tips.push({ kw: t('js_tip_filter_kw'), msg: t('js_tip_filter_msg') });
    }
  }
  if ((s.includes('update') || s.includes('delete')) && !hasWhere) {
    tips.push({ kw: t('js_tip_no_where_kw'), msg: t('js_tip_no_where_msg') });
  }
  if (hasGroupBy && !s.includes('count') && !s.includes('sum') && !s.includes('avg') && !s.includes('max') && !s.includes('min')) {
    tips.push({ kw: t('js_tip_groupby_kw'), msg: t('js_tip_groupby_msg') });
  }
  if (hasHaving && !hasGroupBy) {
    tips.push({ kw: t('js_tip_having_kw'), msg: t('js_tip_having_msg') });
  }
  if (hasOrder && !hasOrderBy) {
    tips.push({ kw: t('js_tip_orderby_kw'), msg: t('js_tip_orderby_msg') });
  }

  // Table tip with deep-link button to DB panel
  const taskLower = (les.exercise?.task || '').toLowerCase();
  const tables = ['klant','product','bestelling','review','kortingscode','leverancier'];
  const expectedTable = tables.find(t => taskLower.includes(t));
  if (expectedTable && !s.includes(expectedTable)) {
    tips.push({
      kw: t('js_tip_table_kw'),
      msg: t('js_tip_table_msg_pre') + expectedTable + t('js_tip_table_msg_post'),
      action: { label: t('js_tip_table_btn_pre') + expectedTable, table: expectedTable }
    });
  }

  if (!tips.length) {
    return `<br><small class="u-muted">${t('js_tip_default')}</small>`;
  }

  return `<div class="sql-error-explain">
    <div class="sql-error-explain-title">${t('js_tip_box_title')}</div>
    ${tips.slice(0, 2).map(tip => `<div class="sql-error-explain-part">
      <span class="sql-error-kw">${esc(tip.kw)}</span>
      <span>${tip.msg}</span>
      ${tip.action ? `<button class="btn btn-outline btn-xs tut-deeplink-btn" data-action="tut-deeplink-table" data-table="${tip.action.table}">${tip.action.label}</button>` : ''}
    </div>`).join('')}
  </div>`;
}

// ── SETTINGS ──────────────────────────────────────────────────────

// ── THEME ─────────────────────────────────────────────────────────
const THEME = {
  init() {
    const saved = (() => { try { return localStorage.getItem('datashop_theme'); } catch(e) { return null; } })();
    this.apply(saved === 'light' ? 'light' : 'dark');
  },
  toggle() {
    this.apply(document.body.classList.contains('light') ? 'dark' : 'light');
  },
  set(mode) {
    this.apply(mode);
  },
  apply(mode) {
    document.body.classList.toggle('light', mode === 'light');
    try { localStorage.setItem('datashop_theme', mode); } catch(e) {}
    // Update sidebar toggle — use translation keys for correct label
    const label = $('theme-label');
    const indicator = $('theme-indicator');
    if (label) label.textContent = mode === 'light' ? t('nav_theme_light') : t('nav_theme_dark');
    if (indicator) indicator.textContent = mode === 'light' ? 'ON' : 'OFF';
    // Update settings buttons
    const btnDark  = $('theme-btn-dark');
    const btnLight = $('theme-btn-light');
    if (btnDark)  btnDark.style.borderColor  = mode === 'dark'  ? 'var(--cyan)' : 'var(--border2)';
    if (btnLight) btnLight.style.borderColor = mode === 'light' ? 'var(--cyan)' : 'var(--border2)';
    // Update boot screen buttons
    const bootDark  = $('boot-btn-dark');
    const bootLight = $('boot-btn-light');
    if (bootDark)  bootDark.classList.toggle('active',  mode === 'dark');
    if (bootLight) bootLight.classList.toggle('active', mode === 'light');
  }
};

const SET = {
  render() {
    const el = $('set-content');
    if (!el) return;
    const rank = RANKS.slice().reverse().find(r => G.xp >= r.min) || RANKS[0];
    el.innerHTML = `
    <div class="set-section">
      <h3>${t('js_progress_summary')}</h3>
      <div class="set-progress-grid">
        <div class="comp-stat"><div class="comp-val">${G.xp}</div><div class="comp-label">XP totaal</div></div>
        <div class="comp-stat"><div class="comp-val">${G.done.size}</div><div class="comp-label">${t('js_missions_completed')}</div></div>
        <div class="comp-stat"><div class="comp-val">${G.ach.size}</div><div class="comp-label">${t('js_badges')}</div></div>
        <div class="comp-stat"><div class="comp-val">${TUT.totalDone()}/${TUT.totalLessons()}</div><div class="comp-label">${t('js_tutorial_lessons')}</div></div>
        <div class="comp-stat"><div class="comp-val">${G.streak}</div><div class="comp-label">${t('js_current_streak')}</div></div>
        <div class="comp-stat"><div class="comp-val ${G.rep>=80?'comp-val--good':G.rep>=50?'comp-val--warn':'comp-val--bad'}">${G.rep}%</div><div class="comp-label">Reputatie</div></div>
      </div>
      <div class="set-mission-progress">
        <div class="u-mono-sub">${t('js_mission_progress')}</div>
        <div class="set-mission-track">
          <div class="set-mission-fill" data-w="${Math.round(G.done.size/SCENARIOS.length*100)}"></div>
        </div>
        <div class="set-mission-label">${G.done.size}/${SCENARIOS.length} ${t('js_missions').toLowerCase()} · ${Math.round(G.done.size/SCENARIOS.length*100)}% ${t('js_progress_done')}</div>
      </div>
    </div>

    <div class="set-section">
      <h3>${t('js_display')}</h3>
      <p class="set-theme-intro">${t('js_theme_intro')}</p>
      <div class="set-theme-row">
        <button data-theme="dark"  id="theme-btn-dark"  class="btn btn-sm btn-theme-option">${t('js_theme_dark')}</button>
        <button data-theme="light" id="theme-btn-light" class="btn btn-sm btn-theme-option btn-theme-option--panel">${t('js_theme_light')}</button>
      </div>
    </div>

    <div class="set-section">
      <h3>${t('js_profile')}</h3>
      <p>${t('js_logged_as')} <strong>${esc(G.name)}</strong> · ${t('js_rank')} <strong>${esc(rank.title)}</strong></p>
      <div class="set-profile-grid">
        ${[
          {i:'⭐',v:G.xp+' XP',l:t('js_total_xp2')},
          {i:'🎯',v:G.done.size+'/'+SCENARIOS.length,l:t('js_missions')},
          {i:'🏅',v:G.ach.size+'/'+ACHIEVEMENTS.length,l:t('js_badges')},
          {i:'📈',v:G.rep+'%',l:t('kpi_reputation')},
          {i:'🔥',v:G.streak,l:t('js_current_streak2')},
        ].map(s=>`<div class="kpi-tile">
          <div class="kpi-tile-icon">${s.i}</div>
          <div class="kpi-val">${esc(String(s.v))}</div>
          <div class="kpi-label">${esc(s.l)}</div>
        </div>`).join('')}
      </div>
    </div>

    <div class="set-danger-zone">
      <h3>${t('js_danger_zone')}</h3>
      <p>${t('js_danger_desc')}</p>
      <div class="set-danger-row">
        <button class="btn btn-danger btn-sm" data-action="confirm-reset">${t('js_reset_btn')}</button>
        <button class="btn btn-outline btn-sm" data-action="export-data">${t('js_export_btn')}</button>
      </div>
      <div id="set-reset-confirm" class="overlay-hidden">
        <p class="set-reset-warning">${t('js_reset_warning')}</p>
        <div class="set-reset-btns">
          <button class="btn btn-danger btn-sm" data-action="do-reset">${t('js_reset_confirm_btn')}</button>
          <button class="btn btn-outline btn-sm" data-action="cancel-reset">${t('js_reset_cancel_btn')}</button>
        </div>
      </div>
    </div>`;
    applyBarWidths(el);
  },
  afterRender() {
    const mode = document.body.classList.contains('light') ? 'light' : 'dark';
    THEME.apply(mode);
  },
  confirmReset() { const el=$('set-reset-confirm'); if(el) { el.classList.remove('overlay-hidden'); } },
  cancelReset()  { const el=$('set-reset-confirm'); if(el) { el.classList.add('overlay-hidden'); } },
  doReset() {
    try {
      localStorage.removeItem('datashop_v3');
      localStorage.removeItem('datashop_daily_v2');
      localStorage.removeItem('datashop_opensc');
      localStorage.removeItem('datashop_theme');
      localStorage.removeItem('datashop_lang');
    } catch(e) {}
    location.reload();
  },
  exportData() {
    const data = {name:G.name,xp:G.xp,rep:G.rep,streak:G.streak,done:[...G.done],ach:[...G.ach],exportDate:new Date().toISOString()};
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `datashop-data-${G.name.replace(/\s+/g,'-')}.json`;
    a.click();
    // Revoke the object URL after the click so the browser can release the blob memory.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
};

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  // Ctrl+Enter: run query in terminal or active scenario
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const active = document.querySelector('.panel.on');
    if (active?.id === 'panel-term') { e.preventDefault(); APP.runFree(); return; }
    if (UI.openSc) { e.preventDefault(); APP.runSc(UI.openSc); return; }
  }
  const active = document.querySelector('.panel.on');
  if (active?.id === 'panel-term') { return; }
  if (!e.ctrlKey && !e.metaKey && e.key === '?' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
    APP.openKeyHelp();
    return;
  }
  if (e.key === 'Escape') { APP.closeKeyHelp(); return; }
  if (UI.openSc && e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    const ta = $('sq-'+UI.openSc);
    if (ta && document.activeElement === ta) { e.preventDefault(); APP.runSc(UI.openSc); }
  }
});

// ── PARTICLES ─────────────────────────────────────────────────────
(function initParticles() {
  const container = $('boot-particles');
  if (!container) return;
  const colors = ['rgba(34,211,238,.4)','rgba(167,139,250,.35)','rgba(244,114,182,.3)','rgba(74,222,128,.3)'];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.className = 'boot-particle';
    const size = Math.random() * 4 + 2;
    el.style.cssText = `
      width:${size}px;height:${size}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      left:${Math.random()*100}%;
      animation-duration:${8+Math.random()*14}s;
      animation-delay:${-Math.random()*15}s;
      filter:blur(${size*.4}px);
    `;
    container.appendChild(el);
  }
})();

// ── SQL SYNTAX HIGHLIGHTER ───────────────────────────────────────
const SQL_KEYWORDS = /\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|ADD|COLUMN|DROP|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|DISTINCT|AS|AND|OR|NOT|NULL|IS|IN|BETWEEN|LIKE|JOIN|ON|LEFT|RIGHT|INNER|OUTER|PRIMARY\s+KEY|AUTO_INCREMENT|NOT\s+NULL|UNIQUE|FOREIGN\s+KEY|REFERENCES|IF\s+NOT\s+EXISTS|ASC|DESC|COUNT|AVG|SUM|MAX|MIN|INT|VARCHAR|TEXT|DECIMAL|BOOLEAN|DATE|DATETIME)\b/gi;
const SQL_FUNCTIONS = /\b(COUNT|AVG|SUM|MAX|MIN)\s*(?=\()/gi;
const SQL_TABLES = /\b(klant|product|bestelling|review|kortingscode|leverancier)\b/gi;

function sqlHighlight(code) {
  // Escape HTML first
  let h = code
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');

  // Tokeniseer stap voor stap om overlapping te voorkomen
  // 1. strings
  const strings = [];
  h = h.replace(/'(?:[^'\\]|\\.)*'/g, m => {
    strings.push(`<span class="hl-str">${m}</span>`);
    return `\x00S${strings.length-1}\x00`;
  });
  // 2. comments
  const comments = [];
  h = h.replace(/--[^\n]*/g, m => {
    comments.push(`<span class="hl-cmt">${m}</span>`);
    return `\x00C${comments.length-1}\x00`;
  });
  // 3. functions (before keywords to catch COUNT/AVG/etc)
  h = h.replace(/\b(COUNT|AVG|SUM|MAX|MIN)(?=\s*\()/gi, '<span class="hl-fn">$1</span>');
  // 4. keywords
  h = h.replace(/\b(SELECT|FROM|WHERE|INSERT\s+INTO|INSERT|INTO|VALUES|UPDATE|SET|DELETE\s+FROM|DELETE|CREATE\s+TABLE|CREATE|TABLE|ALTER\s+TABLE|ALTER|ADD\s+COLUMN|ADD|COLUMN|DROP|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|DISTINCT|AS|AND|OR|NOT\s+NULL|NOT|NULL|IS\s+NULL|IS\s+NOT\s+NULL|IS|IN|BETWEEN|LIKE|PRIMARY\s+KEY|AUTO_INCREMENT|UNIQUE|FOREIGN\s+KEY|REFERENCES|IF\s+NOT\s+EXISTS|ASC|DESC|INT|VARCHAR|TEXT|DECIMAL|BOOLEAN|DATE|DATETIME)\b/gi,
    '<span class="hl-kw">$1</span>');
  // 5. table names
  h = h.replace(/\b(klant|product|bestelling|review|kortingscode|leverancier)\b/gi,
    '<span class="hl-tbl">$1</span>');
  // 6. numbers
  h = h.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-num">$1</span>');
  // 7. restore strings and comments
  h = h.replace(/\x00S(\d+)\x00/g, (_,i) => strings[i]);
  h = h.replace(/\x00C(\d+)\x00/g, (_,i) => comments[i]);
  return h;
}

function initHighlighter(ta) {
  if (!ta || ta._hlInit) return;
  ta._hlInit = true;

  // Gebruik de bestaande hl-backdrop div als highlight-laag (al aanwezig in HTML)
  // De textarea zit al in een hl-wrap; maak geen extra sq-wrap aan.
  const wrap = ta.closest('.hl-wrap');
  let hlLayer = wrap ? wrap.querySelector('.hl-backdrop') : null;

  if (!hlLayer) {
    // Fallback: geen hl-wrap gevonden, maak wrapper zelf aan (vrije terminal / edge case)
    const parent = ta.parentNode;
    const newWrap = document.createElement('div');
    newWrap.className = 'sq-wrap';
    hlLayer = document.createElement('div');
    hlLayer.className = 'sql-highlight-layer';
    hlLayer.setAttribute('aria-hidden','true');
    parent.insertBefore(newWrap, ta);
    newWrap.appendChild(hlLayer);
    newWrap.appendChild(ta);
  }

  // Zorg dat de highlight-laag de juiste CSS-klasse heeft
  if (!hlLayer.classList.contains('sql-highlight-layer')) {
    hlLayer.classList.add('sql-highlight-layer');
  }

  // Copy relevant styles from textarea to layer
  const taStyle = getComputedStyle(ta);
  hlLayer.style.padding = taStyle.padding;
  hlLayer.style.fontSize = taStyle.fontSize;
  hlLayer.style.lineHeight = taStyle.lineHeight;
  hlLayer.style.fontFamily = taStyle.fontFamily;
  hlLayer.style.minHeight = taStyle.minHeight || '130px';
  hlLayer.style.height = taStyle.height;

  function sync() {
    const val = ta.value;
    hlLayer.innerHTML = sqlHighlight(val) + '\n'; // trailing newline prevents scroll drift
    // Sync scroll
    hlLayer.scrollTop = ta.scrollTop;
    hlLayer.scrollLeft = ta.scrollLeft;
    // Sync height if auto-expanding
    hlLayer.style.height = ta.offsetHeight + 'px';
  }

  ta.addEventListener('input', sync);
  ta.addEventListener('scroll', () => {
    hlLayer.scrollTop = ta.scrollTop;
  });
  ta.addEventListener('keydown', e => {
    // Tab → 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart, v = ta.value;
      ta.value = v.slice(0,s) + '  ' + v.slice(s);
      ta.selectionStart = ta.selectionEnd = s + 2;
    }
    setTimeout(sync, 0);
  });
  // Initial render
  sync();
  // Re-sync when value set externally (e.g. hint fill)
  // Safe per-instance setter using defineProperty on the instance only
  const nativeDescriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
  if (nativeDescriptor && nativeDescriptor.set) {
    Object.defineProperty(ta, 'value', {
      get() { return nativeDescriptor.get.call(this); },
      set(v) { nativeDescriptor.set.call(this, v); sync(); },
      configurable: true,
    });
  }
}

// Initialiseer de highlighter op alle SQL-tekstvakken wanneer ze zichtbaar worden
function initAllHighlighters() {
  // Free terminal
  const freeTa = EL['free-sql'];
  if (freeTa) initHighlighter(freeTa);
  // Mission textareas — both sql-editor and sq-input classes
  document.querySelectorAll('textarea.sql-editor, textarea.sq-input').forEach(ta => initHighlighter(ta));
}

// ── SQL SYNTAX FILTER ────────────────────────────────────────────
(function initSynFilter() {
  function setup() {
    const bar = document.querySelector('.syn-filter-bar');
    if (!bar) return;
    bar.addEventListener('click', e => {
      const btn = e.target.closest('.syn-filter-btn');
      if (!btn) return;
      const filter = btn.dataset.filter;
      // Update active button
      bar.querySelectorAll('.syn-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Show/hide cards
      document.querySelectorAll('.syn-card').forEach(card => {
        const cat = card.dataset.cat || '';
        if (filter === 'all' || cat === filter) {
          card.classList.remove('syn-hidden');
        } else {
          card.classList.add('syn-hidden');
        }
      });
    });
  }
  // Run after DOM is ready; also hook into panel open
  document.addEventListener('DOMContentLoaded', setup);
  setTimeout(setup, 500);
})();

// ── INIT ──────────────────────────────────────────────────────────
(function init() {
  const hasSave = load();
  if (hasSave) {
    EL['boot-name'].value = G.name;
    const info = $('boot-saved');
    info.classList.remove('boot-saved-hidden');
    info.textContent = `${t('js_saved_progress')} ${G.name}`;
    const skipBtn = $('boot-skip-cin');
    if (skipBtn) skipBtn.classList.remove('boot-saved-hidden');
  }

  // Boot name input: Enter key starts game
  const bootInput = EL['boot-name'];
  if (bootInput) {
    bootInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') APP.startGame();
    });
  }

  // Terugkerende speler met opgeslagen spel
  if (hasSave && G.name) {
    // Toon het startscherm zodat de speler zijn naam kan bevestigen of wijzigen
  }

  THEME.init();
  EL['s-boot'].classList.add('active');

  // Initialiseer highlighter voor dagelijkse textarea bij openen panel
  try { DAILY.updateBadge(); } catch(e) { /* badge update kan wachten tot game geladen is */ }
})();

// ── EVENT DELEGATION ─────────────────────────────────────────────
// Single listener replaces all onclick="..." inline handlers
document.addEventListener('click', function(e) {
  // Lang switcher buttons (boot + sidebar)
  const langBtn = e.target.closest('[data-lang]');
  if (langBtn && langBtn.classList.contains('lang-btn')) { setLang(langBtn.dataset.lang); return; }

  // DB sub-tabs & shortcuts
  const dbEl = e.target.closest('[data-dbtab]');
  if (dbEl) {
    APP.showDbTab(dbEl.dataset.dbtab);
    if (dbEl.dataset.dbtable) APP.renderDBTable(dbEl.dataset.dbtable);
    return;
  }
  // Terminal examples
  const exEl = e.target.closest('[data-example]');
  if (exEl) { APP.loadExampleIdx(parseInt(exEl.dataset.example)); return; }

  const el = e.target.closest('[data-panel],[data-filter],[data-theme],[data-action]');
  if (!el) return;

  if (el.dataset.panel)  { APP.showPanel(el.dataset.panel); return; }
  if (el.dataset.filter) { APP.setFilter(el.dataset.filter); return; }
  if (el.dataset.theme)  { THEME.set(el.dataset.theme); return; }

  switch (el.dataset.action) {
    case 'theme-toggle':      THEME.toggle(); break;
    case 'clear-search':      APP.clearSearch(); break;
    case 'open-key-help':     APP.openKeyHelp(); break;
    case 'close-key-help':    APP.closeKeyHelp(); break;
    case 'close-recap':       APP.closeRecap(); break;
    case 'close-completion':  APP.closeCompletion(); break;
    case 'download-cert':     APP.downloadCertificate(); break;
    case 'start-game':        APP.startGame(); break;
    case 'skip-cin':          APP.startGameSkipCin(); break;
    case 'clear-free':        APP.clearFree(); break;
    case 'run-free':          APP.runFree(); break;
    case 'tut-next':          TUT._next(); break;
    case 'set-ch':            APP.setCh(Number(el.dataset.ch)); break;
    case 'toggle-sc':         APP.toggleSc(el.dataset.sc); break;
    case 'show-hint':         APP.showHint(el.dataset.sc); break;
    case 'next-hint':         APP.nextHint(el.dataset.sc); break;
    case 'run-sc':            APP.runSc(el.dataset.sc); break;
    case 'replay-sc':         APP.replaySc(el.dataset.sc); break;
    case 'render-table':      APP.renderDBTable(el.dataset.table); break;
    case 'cin-done':          APP.cinDone(); break;
    case 'show-all-missions': APP.clearSearch(); APP.setFilter('all'); break;
    case 'confirm-reset':     SET.confirmReset(); break;
    case 'cancel-reset':      SET.cancelReset(); break;
    case 'do-reset':          SET.doReset(); break;
    case 'export-data':       SET.exportData(); break;
    // ── NEW: migrated from inline onclick ──
    case 'close-kw-popup':    { const p = document.getElementById('kw-popup'); if (p) p.remove(); break; }
    case 'toggle-daily-story': {
      const s = document.getElementById('daily-story-' + el.dataset.diff);
      if (s) { const exp = s.classList.toggle('expanded'); el.textContent = exp ? t('js_less_read') : t('js_more_read'); }
      break;
    }
    case 'daily-run':         DAILY.run(el.dataset.diff); break;
    case 'daily-reveal':      DAILY.revealSolution(el.dataset.diff); break;
    case 'open-tut-lesson':   APP.showPanel('tut'); TUT.openModule(el.dataset.mod); TUT._activeLes = Number(el.dataset.les); TUT.render(); break;
    case 'open-tut-module':   TUT.openModule(el.dataset.mod); break;
    case 'tut-back':          TUT._back(); break;
    case 'tut-go-lesson':     TUT._goLesson(Number(el.dataset.les)); break;
    case 'toggle-tut-hint':   { const h = el.nextElementSibling; if (h) { h.classList.toggle('hidden'); el.textContent = h.classList.contains('hidden') ? t('js_tut_show_hint') : t('js_tut_hide_hint'); } break; }
    case 'tut-run-exercise':  TUT._runExercise(); break;
    case 'tut-retry-exercise': TUT._retryExercise(); break;
    case 'tut-deeplink-table': APP.showPanel('db'); APP.showDbTab('data'); APP.renderDBTable(el.dataset.table); break;
  }
});

// ── SEARCH INPUT DELEGATION ──────────────────────────────────────
// Replaces inline oninput="APP.setSearch(this.value)"
document.addEventListener('input', function(e) {
  if (e.target.id === 'sc-search') APP.setSearch(e.target.value);
});
