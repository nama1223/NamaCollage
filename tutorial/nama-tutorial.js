/* NamaTutorial キット v1 — 全アプリ共通チュートリアルエンジン
   使い方: window.NAMA_TUTORIAL_CONFIG を定義した config.js を先に読み込み、
   次にこのファイルを読み込む。アプリ側は window[cfg.bridge] に
   { navigate(id), currentPage(), snapshotKeys() } を用意する。 */
(function () {
  'use strict';
  var cfg = window.NAMA_TUTORIAL_CONFIG;
  if (!cfg || !cfg.appId) return;
  // 橋渡しは遅延解決する（React製アプリなど、キット読み込み後に橋渡しを登録するアプリにも対応）
  var _bridge = null;
  function bridge() {
    if (!_bridge) { var b = window[cfg.bridge || 'NamaTutorialBridge']; if (b) _bridge = b; }
    return _bridge || {};
  }
  var LS_KEY = 'nama_tutorial_v1:' + cfg.appId;
  var IMG = cfg.assetBase || 'tutorial/img/';

  function loadRec() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; } }
  function saveRec() { try { localStorage.setItem(LS_KEY, JSON.stringify(rec)); } catch (e) {} }
  var rec = loadRec();
  if (!rec.chapters) rec.chapters = {};

  var ASSET_V = '18'; // 素材・キットの版。更新のたびに上げると端末側の古いキャッシュを確実に回避できる
  function poseSrc(pose) { return IMG + 'N_' + pose + '.webp?v=' + ASSET_V; }
  function chapterById(id) { for (var i = 0; i < cfg.chapters.length; i++) if (cfg.chapters[i].id === id) return cfg.chapters[i]; return null; }
  function isDone(ch) { var r = rec.chapters[ch.id]; return !!(r && r.done && r.version >= (ch.since || 1)); }
  function isNew(ch) { var r = rec.chapters[ch.id]; return (ch.since || 1) > ((r && r.version) || 0); }
  function newCount() { return cfg.chapters.filter(isNew).length; }

  /* ── DOM ── */
  var btn, root, shield, hl, dimSvg, dimPath, bubble, charImg, textEl, chapNameEl, counterEl, actionsEl, panel;
  function el(tag, id) { var e = document.createElement(tag); if (id) e.id = id; return e; }

  function buildDom() {
    btn = el('button', 'nt-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'チュートリアルを開く');
    var bi = document.createElement('img');
    bi.src = cfg.buttonImage ? cfg.buttonImage + '?v=' + ASSET_V : poseSrc('wave');
    bi.alt = '';
    btn.appendChild(bi);
    var badge = el('span'); badge.className = 'nt-badge'; badge.id = 'nt-badge'; badge.style.display = 'none';
    btn.appendChild(badge);
    btn.addEventListener('click', function () { if (btnDragged) { btnDragged = false; return; } openPanel(false); });
    // アプリ別のボタン配置（config）: 大きさ / 右上の初期配置 / 右からの寄せ量。ドラッグや保存位置が優先される
    if (cfg.buttonSize) { btn.style.width = cfg.buttonSize + 'px'; btn.style.height = cfg.buttonSize + 'px'; }
    if (cfg.buttonAnchor === 'top-right') { btn.style.bottom = 'auto'; btn.style.top = '14px'; }
    if (cfg.buttonOffsetRight) { btn.style.right = (14 + cfg.buttonOffsetRight) + 'px'; }
    initBtnDrag();
    document.body.appendChild(btn);

    root = el('div', 'nt-root');
    shield = el('div', 'nt-shield');
    hl = el('div', 'nt-hl');
    bubble = el('div', 'nt-bubble');
    bubble.innerHTML =
      '<div class="nt-row"><img id="nt-char" alt=""><div id="nt-text"></div></div>' +
      '<div id="nt-meta"><span id="nt-chapter-name"></span><span id="nt-counter"></span></div>' +
      '<div id="nt-actions"></div>';
    panel = el('div', 'nt-panel');
    angerEl = el('div', 'nt-anger');
    angerEl.style.cssText = 'position:fixed;z-index:60;pointer-events:none;display:none;';
    dimSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dimSvg.id = 'nt-dimsvg';
    dimPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dimPath.setAttribute('fill', 'rgba(10,16,22,0.55)');
    dimPath.setAttribute('fill-rule', 'evenodd');
    dimSvg.appendChild(dimPath);
    root.appendChild(shield); root.appendChild(dimSvg); root.appendChild(hl); root.appendChild(bubble); root.appendChild(panel); root.appendChild(angerEl);
    document.body.appendChild(root);
    // メニュー表示中だけ、エリア外タップで閉じる（説明が始まった後は閉じない）
    shield.addEventListener('click', function () {
      if (panel.style.display === 'block') {
        if (panelMode === 'intro') { rec.introSeen = true; saveRec(); }
        requestCloseAll();
      }
    });
    charImg = bubble.querySelector('#nt-char');
    initCharGag();
    textEl = bubble.querySelector('#nt-text');
    chapNameEl = bubble.querySelector('#nt-chapter-name');
    counterEl = bubble.querySelector('#nt-counter');
    actionsEl = bubble.querySelector('#nt-actions');
    updateBadge();
  }

  function updateBadge() {
    var b = document.getElementById('nt-badge');
    if (!b) return;
    var n = newCount();
    b.style.display = n > 0 ? '' : 'none';
    b.textContent = n > 0 ? String(n) : '';
  }

  /* ── 履歴（戻るボタン）連携: 層を開くたびに1つ積む ── */
  var openLayers = 0;
  function pushLayer() {
    openLayers++;
    try { history.pushState({ nt: openLayers, page: bridge().currentPage ? bridge().currentPage() : undefined }, ''); } catch (e) {}
  }
  window.addEventListener('popstate', function () {
    if (openLayers > 0) closeTopLayer(true);
  });
  function closeTopLayer(fromPop) {
    if (player.active) { stopPlayer(true); showPanel(); openLayers = Math.max(0, openLayers - 1); afterLayerClosed(); return; }
    hideAll();
    openLayers = 0;
    afterLayerClosed();
  }
  function afterLayerClosed() {
    if (closingAll > 0) {
      closingAll--;
      if (openLayers > 0) { try { history.back(); } catch (e) {} }
      else closingAll = 0;
    }
  }
  function requestCloseLayer() {
    var st = null;
    try { st = history.state; } catch (e) {}
    if (st && st.nt) { history.back(); } // popstate 側で閉じる
    else closeTopLayer(false);
  }
  function requestCloseAll() {
    var st = null;
    try { st = history.state; } catch (e) {}
    if (st && st.nt && openLayers > 0) {
      closingAll = openLayers;
      history.back();
    } else { hideAll(); openLayers = 0; closingAll = 0; }
  }
  var closingAll = 0;

  function hideAll() {
    stopPlayer(false);
    dropsTotal = 0; dropsShown = 0; angerRendered = -1; // 落下回数はチュートリアルを閉じたらリセット
    if (angerTimer) { clearInterval(angerTimer); angerTimer = 0; }
    if (angerEl) angerEl.style.display = 'none';
    root.classList.remove('nt-open');
    root.classList.remove('nt-passthrough');
    root.classList.remove('nt-dim');
    bubble.style.display = 'none';
    panel.style.display = 'none';
    hl.style.display = 'none'; if (dimSvg) dimSvg.style.display = 'none';
  }
  function showRoot() {
    root.classList.add('nt-open');
    if (!angerTimer) angerTimer = setInterval(updateAnger, 120);
  }

  /* ── 落下回数で増える 💢 マーク（キャラに重ねてバラつかせて表示・追従）
        回数は落下のたびに数えるが、表示への反映は復活したタイミング。
        decay再生中は非表示。チュートリアルを閉じるとリセット ── */
  var angerEl = null, angerTimer = 0, dropsTotal = 0, dropsShown = 0, angerRendered = -1;
  var ANGER_SPOTS = [
    { x: 52, y: -12, r: -14, s: 20 }, { x: 76, y: 3, r: 12, s: 17 },
    { x: 26, y: -18, r: 20, s: 15 }, { x: 86, y: -15, r: -22, s: 21 },
    { x: 8, y: -3, r: 8, s: 16 }, { x: 63, y: -27, r: -6, s: 18 }
  ];
  function angerCount() {
    if (dropsShown >= 10) return 6;
    if (dropsShown >= 8) return 3;
    if (dropsShown >= 5) return 2;
    if (dropsShown >= 2) return 1;
    return 0;
  }
  function updateAnger() {
    if (!angerEl) return;
    var n = angerCount();
    var target = (gag && gag.fly) ? gag.fly : charImg;
    if (n === 0 || !target || !root.classList.contains('nt-open') || (gag && gag.mode === 'decay')) { angerEl.style.display = 'none'; return; }
    if (!gag.fly && charImg.style.visibility === 'hidden') { angerEl.style.display = 'none'; return; }
    var r = target.getBoundingClientRect();
    if (r.width === 0) { angerEl.style.display = 'none'; return; }
    if (angerRendered !== n) {
      angerRendered = n;
      angerEl.innerHTML = '';
      for (var i = 0; i < n; i++) {
        var spot = ANGER_SPOTS[i % ANGER_SPOTS.length];
        var sp = document.createElement('span');
        sp.textContent = '💢';
        sp.style.cssText = 'position:absolute;left:' + spot.x + '%;top:' + spot.y + 'px;font-size:' + spot.s + 'px;transform:rotate(' + spot.r + 'deg);text-shadow:0 1px 3px rgba(0,0,0,0.3);';
        angerEl.appendChild(sp);
      }
    }
    angerEl.style.left = r.left + 'px';
    angerEl.style.top = r.top + 'px';
    angerEl.style.width = r.width + 'px';
    angerEl.style.height = r.height + 'px';
    angerEl.style.display = 'block';
  }

  /* ── パネル（初回案内 / 章メニュー） ── */
  function openPanel(intro) {
    stopPlayer(false);
    showRoot();
    bubble.style.display = 'none';
    hl.style.display = 'none'; if (dimSvg) dimSvg.style.display = 'none';
    root.classList.remove('nt-passthrough');
    root.classList.add('nt-dim');
    if (openLayers === 0) pushLayer();
    if (intro && !rec.introSeen) renderIntro();
    else renderMenu();
    panel.style.display = 'block';
  }
  function showPanel() { // プレイヤーから戻る時に層を積み直さない表示
    showRoot();
    bubble.style.display = 'none';
    hl.style.display = 'none'; if (dimSvg) dimSvg.style.display = 'none';
    root.classList.remove('nt-passthrough');
    renderMenu();
    panel.style.display = 'block';
  }
  var panelMode = 'menu';
  function renderIntro() {
    panelMode = 'intro';
    panel.innerHTML =
      '<h2>' + esc(cfg.introTitle || '使い方のご案内') + '</h2>' +
      '<div class="nt-sub">' + esc(cfg.introText || 'このアプリの使い方を、画面を触りながら案内します。') + '</div>' +
      '<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">' +
      '<img src="' + poseSrc('wave') + '" style="width:72px;height:72px;" alt="">' +
      '<div style="font-size:13px;line-height:1.6;">あとからでも、画面右下の「生」アイコンからいつでも見られナマ。</div></div>' +
      '<div style="display:flex;gap:8px;">' +
      '<button type="button" class="nt-tbtn nt-primary" id="nt-intro-start">チュートリアルをはじめる</button>' +
      '<button type="button" class="nt-tbtn" id="nt-intro-later">あとで見る</button></div>';
    panel.querySelector('#nt-intro-start').addEventListener('click', function () {
      rec.introSeen = true; saveRec();
      // 設定があれば、初回は「今いる画面の章」へ直接入る（共有URLからプレイヤー直行した人などの初動を分かりやすく）
      if (cfg.startWithCurrentChapter && bridge().currentPage) {
        var cur = null;
        try { cur = bridge().currentPage(); } catch (e) {}
        for (var i = 0; i < cfg.chapters.length; i++) {
          if (cfg.chapters[i].page && cfg.chapters[i].page === cur) { renderMenu(); startChapter(cfg.chapters[i].id); return; }
        }
      }
      renderMenu();
    });
    panel.querySelector('#nt-intro-later').addEventListener('click', function () { rec.introSeen = true; saveRec(); requestCloseAll(); });
  }
  function renderMenu() {
    panelMode = 'menu';
    var html = '<h2>チュートリアル</h2><div class="nt-sub">見たい項目を選んでください。見終わった項目には ✓ が付きます。アプリが更新されると、新しい項目に NEW が付きます。</div>';
    cfg.chapters.forEach(function (ch) {
      var done = isDone(ch), nw = isNew(ch) && !done;
      var chip = done ? '<span class="nt-chip nt-done">✓ 完了</span>' : (nw ? '<span class="nt-chip nt-new">NEW</span>' : '<span class="nt-chip">未見</span>');
      html += '<button type="button" class="nt-chapter" data-ch="' + ch.id + '">' +
        '<img src="' + poseSrc(ch.icon || 'wave') + '" alt="">' +
        '<span class="nt-ch-main"><span class="nt-ch-title">' + esc(ch.title) + '</span>' +
        '<span class="nt-ch-desc" style="display:block;">' + esc(ch.desc || '') + '</span></span>' + chip + '</button>';
    });
    html += '<div id="nt-close-row"><button type="button" class="nt-tbtn" id="nt-menu-close">とじる</button></div>';
    panel.innerHTML = html;
    Array.prototype.forEach.call(panel.querySelectorAll('.nt-chapter'), function (b) {
      b.addEventListener('click', function () { startChapter(b.getAttribute('data-ch')); });
    });
    panel.querySelector('#nt-menu-close').addEventListener('click', requestCloseAll);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ── スナップショット（チュートリアル中の変更を元に戻す） ── */
  var snapshot = null;
  function takeSnapshot() {
    snapshot = null;
    if (!bridge().snapshotKeys) return;
    var keys = [];
    try { keys = bridge().snapshotKeys() || []; } catch (e) {}
    snapshot = {};
    keys.forEach(function (k) { snapshot[k] = localStorage.getItem(k); });
  }
  function restoreSnapshot() {
    if (!snapshot) return;
    Object.keys(snapshot).forEach(function (k) {
      if (snapshot[k] === null) localStorage.removeItem(k);
      else localStorage.setItem(k, snapshot[k]);
    });
    snapshot = null;
  }

  /* ── プレイヤー ── */
  var player = { active: false, ch: null, idx: 0, el: null, els: [], step: null, watchTimer: null, tapHandler: null, missingSince: 0, runId: 0, skipped: {} };

  function startChapter(id) {
    var ch = chapterById(id);
    if (!ch) return;
    panel.style.display = 'none';
    pushLayer();
    takeSnapshot();
    player.active = true;
    player.ch = ch;
    player.idx = 0;
    player.skipped = {};
    var rid = ++player.runId;
    var begin = function () { if (player.active && rid === player.runId) showStep(0); };
    // 章の開始ページへ先に移動してから始める（別のページで開いても画面と説明が一致するように）
    if (ch.page && bridge().navigate && bridge().currentPage && bridge().currentPage() !== ch.page) {
      bridge().navigate(ch.page);
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        if (!player.active || rid !== player.runId) { clearInterval(iv); return; }
        if (bridge().currentPage() === ch.page || tries >= 20) { clearInterval(iv); begin(); }
      }, 120);
    } else begin();
  }

  function stopPlayer(restore) {
    gagReset();
    player.runId++; // 保留中の非同期処理をすべて無効化
    if (player.watchTimer) { clearInterval(player.watchTimer); player.watchTimer = null; }
    detachTap();
    player.active = false;
    if (restore) restoreSnapshot();
  }

  function stepSelectors(step) { return step.target ? (Array.isArray(step.target) ? step.target : [step.target]) : []; }
  function queryTargets(step) {
    var out = [];
    stepSelectors(step).forEach(function (sel) {
      var el = null;
      try { el = document.querySelector(sel); } catch (e) {}
      if (el) {
        var r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' && out.indexOf(el) === -1) out.push(el);
      }
    });
    return out;
  }
  function resolveTargets(step, done) {
    var tries = 0;
    (function attempt() {
      var targets = queryTargets(step);
      if (targets.length || !step.target || tries >= 6) { done(targets); return; }
      tries++;
      setTimeout(attempt, 110);
    })();
  }
  function unionRect(els) {
    var rect = null;
    (els || []).forEach(function (el) {
      if (!document.contains(el)) return;
      var r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (!rect) rect = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      else { rect.left = Math.min(rect.left, r.left); rect.top = Math.min(rect.top, r.top); rect.right = Math.max(rect.right, r.right); rect.bottom = Math.max(rect.bottom, r.bottom); }
    });
    if (!rect) return null;
    rect.width = rect.right - rect.left; rect.height = rect.bottom - rect.top;
    return rect;
  }
  function detachTap() {
    if (player.tapHandler && player.els) player.els.forEach(function (el) { el.removeEventListener('click', player.tapHandler, true); el.removeEventListener('pointerdown', player.tapHandler, true); });
    player.tapHandler = null;
  }

  function prevShownIdx() {
    for (var j = player.idx - 1; j >= 0; j--) if (!player.skipped[j]) return j;
    return -1;
  }

  function showStep(i) {
    if (!player.active) return;
    var ch = player.ch;
    if (i >= ch.steps.length) { finishChapter(); return; }
    var rid = ++player.runId;
    player.idx = i;
    var step = ch.steps[i];
    player.step = step;
    if (player.watchTimer) { clearInterval(player.watchTimer); player.watchTimer = null; }
    detachTap();

    var go = function () {
      resolveTargets(step, function (targets) {
        if (!player.active || rid !== player.runId) return;
        if (step.target && !targets.length) {
          // 対象が無いステップ: 無言で飛ばさず、一言添えてから進む（戻る時はここを飛ばす）
          player.skipped[i] = true;
          renderSkipNote(step);
          setTimeout(function () { if (player.active && rid === player.runId) showStep(i + 1); }, 550);
          return;
        }
        player.el = targets[0] || null;
        player.els = targets;
        renderStep(step, targets, rid);
      });
    };
    if (step.page && bridge().navigate && bridge().currentPage && bridge().currentPage() !== step.page) {
      bridge().navigate(step.page);
      setTimeout(function () { if (rid === player.runId) go(); }, 400);
    } else go();
  }

  function renderSkipNote(step) {
    gagReset();
    showRoot();
    panel.style.display = 'none';
    hl.style.display = 'none'; if (dimSvg) dimSvg.style.display = 'none';
    root.classList.remove('nt-passthrough');
    root.classList.add('nt-dim');
    charImg.src = poseSrc('wave');
    textEl.textContent = '（この項目は今の画面にないので、ここは飛ばしナマ）';
    chapNameEl.textContent = player.ch.title;
    counterEl.textContent = (player.idx + 1) + ' / ' + player.ch.steps.length;
    actionsEl.innerHTML = '<button type="button" class="nt-tbtn nt-quiet" data-a="quit">✕</button>';
    wireActions();
    bubble.style.display = 'block';
    var bh = bubble.offsetHeight || 190;
    bubble.style.top = Math.max(12, (window.innerHeight - bh) / 2) + 'px';
  }

  function pointPose(rect, bubbleBelow) {
    var cx = rect.left + rect.width / 2;
    var third = window.innerWidth / 3;
    var h = cx < third ? '_left' : (cx > third * 2 ? '_right' : '');
    return (bubbleBelow ? 'up' : 'down') + h;
  }

  function renderStep(step, targets, rid) {
    gagReset();
    showRoot();
    panel.style.display = 'none';
    root.classList.toggle('nt-dim', !targets.length); // 対象がある時は穴あき（シールド透明＋ハイライトの影）だけにする
    var rect = null;
    if (targets.length) {
      targets[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    var place = function () {
      if (!player.active) return;
      rect = unionRect(player.els);
      var bubbleBelow = true;
      // 枠は要素ごとに独立して出し、暗転は穴あきSVGで一括（複数枠でも互いを暗くしない）
      var rects = [];
      (player.els || []).forEach(function (elm) {
        if (!document.contains(elm)) return;
        var r = elm.getBoundingClientRect();
        if (r.width > 0 || r.height > 0) rects.push(r);
      });
      while (hl.children.length > rects.length) hl.removeChild(hl.lastChild);
      while (hl.children.length < rects.length) { var bd = document.createElement('div'); bd.className = 'nt-hlbox'; hl.appendChild(bd); }
      rects.forEach(function (r, i) {
        var b = hl.children[i];
        b.style.left = (r.left - 6) + 'px'; b.style.top = (r.top - 6) + 'px';
        b.style.width = (r.width + 12) + 'px'; b.style.height = (r.height + 12) + 'px';
      });
      if (rects.length) {
        var W = window.innerWidth, H = window.innerHeight;
        var dAttr = 'M0 0 H' + W + ' V' + H + ' H0 Z';
        rects.forEach(function (r) {
          dAttr += ' M' + Math.max(0, r.left - 6) + ' ' + Math.max(0, r.top - 6) + ' H' + Math.min(W, r.right + 6) + ' V' + Math.min(H, r.bottom + 6) + ' H' + Math.max(0, r.left - 6) + ' Z';
        });
        dimPath.setAttribute('d', dAttr);
        dimSvg.style.display = 'block';
        hl.style.display = 'block';
        bubbleBelow = (window.innerHeight - rect.bottom) >= 240 || rect.top < 240;
      } else {
        hl.style.display = 'none'; if (dimSvg) dimSvg.style.display = 'none';
        bubbleBelow = true;
      }
      bubble.style.display = 'block';
      var bh = bubble.offsetHeight || 190;
      var top;
      if (step.bubblePos === 'bottom') top = window.innerHeight - bh - 12;
      else if (step.bubblePos === 'top') top = 12;
      else if (!rect) top = Math.max(12, (window.innerHeight - bh) / 2);
      else if (bubbleBelow) top = Math.min(window.innerHeight - bh - 12, rect.bottom + 14);
      else top = Math.max(12, rect.top - bh - 14);
      bubble.style.top = top + 'px';
      var pose = step.pose || 'wave';
      if (pose === 'point') pose = rect ? pointPose(rect, bubbleBelow) : 'thinking';
      charImg.src = poseSrc(pose);
    };
    player._place = place;
    charImg.src = poseSrc(step.pose === 'point' ? 'up' : (step.pose || 'wave'));
    textEl.textContent = step.text || '';
    chapNameEl.textContent = player.ch.title;
    counterEl.textContent = (player.idx + 1) + ' / ' + player.ch.steps.length;
    renderActions(step);
    requestAnimationFrame(place);
    setTimeout(function () { if (rid === player.runId) place(); }, 380); // スクロール後の位置で合わせ直す
    root.classList.toggle('nt-passthrough', (step.mode === 'tap' || step.mode === 'free') && !!targets.length);

    player.operated = false;
    if (step.mode === 'tap' && targets.length) {
      // tap は「操作だけさせる」形式: 押しても自動では進まない。操作を検知したら進むボタンの表示を変える
      player.tapHandler = function () {
        if (player.operated || rid !== player.runId) return;
        player.operated = true;
        var nb = actionsEl.querySelector('[data-a="next"]');
        if (nb) { nb.textContent = (player.idx >= player.ch.steps.length - 1) ? 'おわる' : 'つぎへ →'; nb.classList.add('nt-primary'); }
      };
      targets.forEach(function (el) { el.addEventListener('pointerdown', player.tapHandler, true); });
    }

    player.missingSince = 0;
    player.watchTimer = setInterval(function () {
      if (!player.active || rid !== player.runId) return;
      if (!step.target) return;
      // 対象の集合を取り直す（再描画での差し替え・複数対象の増減に追従）
      var fresh = queryTargets(step);
      var old = player.els || [];
      var changed = fresh.length !== old.length || fresh.some(function (el, i) { return el !== old[i]; });
      if (changed) {
        var h = player.tapHandler;
        if (h) old.forEach(function (el) { el.removeEventListener('pointerdown', h, true); });
        player.els = fresh;
        player.el = fresh[0] || null;
        if (h) fresh.forEach(function (el) { el.addEventListener('pointerdown', h, true); });
        place();
      }
      var r = unionRect(player.els);
      if (!r) {
        if (!player.missingSince) player.missingSince = Date.now();
        else if (Date.now() - player.missingSince > 1600) { player.skipped[player.idx] = true; showStep(player.idx + 1); } // 消えたままなら救済スキップ
        return;
      }
      player.missingSince = 0;
      // 対象の位置・大きさが変わったら（キーボード表示・回転・リサイズ等）吹き出しごと合わせ直す
      var key = [r.left, r.top, r.width, r.height].join(',');
      if (key !== player._lastRectKey) { player._lastRectKey = key; place(); }
    }, 250);
  }

  function wireActions() {
    Array.prototype.forEach.call(actionsEl.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-a');
        if (a === 'next') showStep(player.idx + 1);
        else if (a === 'prev') { var p = prevShownIdx(); if (p >= 0) showStep(p); }
        else if (a === 'quit') requestCloseLayer();
      });
    });
  }

  function renderActions(step) {
    var html = '';
    if (prevShownIdx() >= 0) html += '<button type="button" class="nt-tbtn" data-a="prev">← もどる</button>';
    if (step.mode === 'tap') html += '<button type="button" class="nt-tbtn" data-a="next">できない・つぎへ</button>';
    else html += '<button type="button" class="nt-tbtn nt-primary" data-a="next">' + (player.idx >= player.ch.steps.length - 1 ? 'おわる' : 'つぎへ →') + '</button>';
    html += '<button type="button" class="nt-tbtn nt-quiet" data-a="quit">✕</button>';
    actionsEl.innerHTML = html;
    wireActions();
  }

  function finishChapter() {
    var ch = player.ch;
    rec.chapters[ch.id] = { done: true, version: ch.since || 1, at: Date.now() };
    saveRec();
    updateBadge();
    if (player.watchTimer) { clearInterval(player.watchTimer); player.watchTimer = null; }
    detachTap();
    restoreSnapshot();
    player.finished = true; // 層の管理上はプレイヤーを開いたままにし、戻る操作でメニューへ帰す
    showRoot();
    root.classList.remove('nt-passthrough');
    root.classList.add('nt-dim');
    hl.style.display = 'none'; if (dimSvg) dimSvg.style.display = 'none';
    panel.style.display = 'none';
    bubble.style.display = 'block';
    bubble.style.top = Math.max(12, (window.innerHeight - 220) / 2) + 'px';
    charImg.src = poseSrc('thumbs_up');
    textEl.textContent = '「' + ch.title + '」はこれでおしまいナマ。おつかれナマ！';
    chapNameEl.textContent = ch.title;
    counterEl.textContent = '完了';
    actionsEl.innerHTML =
      '<button type="button" class="nt-tbtn" data-a="menu">メニューへ</button>' +
      '<button type="button" class="nt-tbtn nt-primary" data-a="close">とじる</button>';
    Array.prototype.forEach.call(actionsEl.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('data-a') === 'menu') requestCloseLayer(); // popstate で stopPlayer 済みの状態からメニューが出る
        else requestCloseAll();
      });
    });
  }

  /* ── キャラのドラッグ演出: ドラッグで run → 離すと panic で落下 →
        画面下から上へ回り込んで元の位置へ戻ると decay（アニメWebP）で消滅 →
        約3秒後に何事もなかったように復帰する ── */
  var gag = { mode: 'idle', fly: null, raf: 0, timer: 0, origin: null, x: 0, y: 0, vy: 0, last: 0, wrapped: false, grabDX: 0, grabDY: 0 };
  var DECAY_MS = 1300; // N_decay.webp = 32コマ × 25fps

  function gagReset() {
    if (gag.mode === 'fall' || gag.mode === 'decay') dropsShown = dropsTotal; // 表示への反映は復活時
    if (gag.raf) cancelAnimationFrame(gag.raf);
    if (gag.timer) clearTimeout(gag.timer);
    gag.raf = 0; gag.timer = 0;
    if (gag.fly) { gag.fly.remove(); gag.fly = null; }
    gag.mode = 'idle';
    if (charImg) charImg.style.visibility = '';
  }

  function initCharGag() {
    charImg.draggable = false;
    charImg.style.touchAction = 'none';
    charImg.style.cursor = 'grab';
    charImg.addEventListener('pointerdown', function (e) {
      if (gag.mode !== 'idle') return;
      if (bubble.style.display === 'none') return;
      e.preventDefault();
      var r = charImg.getBoundingClientRect();
      gag.origin = { left: r.left, top: r.top, width: r.width, height: r.height };
      gag.x = r.left; gag.y = r.top;
      gag.grabDX = e.clientX - r.left; gag.grabDY = e.clientY - r.top;
      var fly = document.createElement('img');
      fly.id = 'nt-fly';
      fly.src = poseSrc('run');
      fly.alt = '';
      fly.style.cssText = 'position:fixed;z-index:50;pointer-events:none;width:' + r.width + 'px;height:' + r.height + 'px;left:' + r.left + 'px;top:' + r.top + 'px;';
      root.appendChild(fly);
      gag.fly = fly;
      gag.mode = 'drag';
      charImg.style.visibility = 'hidden';
      var move = function (ev) {
        if (gag.mode !== 'drag') return;
        gag.x = ev.clientX - gag.grabDX;
        gag.y = ev.clientY - gag.grabDY;
        fly.style.left = gag.x + 'px';
        fly.style.top = gag.y + 'px';
      };
      var up = function () {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        if (gag.mode === 'drag') gagStartFall();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
  }

  function gagStartFall() {
    gag.mode = 'fall';
    dropsTotal++;
    gag.fly.src = poseSrc('panic');
    gag.vy = 0;
    gag.wrapped = false;
    gag.last = performance.now();
    var stepFn = function (now) {
      if (gag.mode !== 'fall') return;
      var dt = Math.min(0.05, (now - gag.last) / 1000);
      gag.last = now;
      gag.vy += 2600 * dt;
      gag.y += gag.vy * dt;
      gag.x += (gag.origin.left - gag.x) * Math.min(1, dt * 3); // 元の位置へ横方向に寄せる
      if (gag.y > window.innerHeight + 4) { gag.y -= (window.innerHeight + gag.origin.height); gag.wrapped = true; }
      if (gag.wrapped && gag.y >= gag.origin.top) {
        gag.y = gag.origin.top;
        gag.x = gag.origin.left;
        gag.fly.style.left = gag.x + 'px';
        gag.fly.style.top = gag.y + 'px';
        gagStartDecay();
        return;
      }
      gag.fly.style.left = gag.x + 'px';
      gag.fly.style.top = gag.y + 'px';
      gag.raf = requestAnimationFrame(stepFn);
    };
    gag.raf = requestAnimationFrame(stepFn);
  }

  function gagStartDecay() {
    gag.mode = 'decay';
    if (angerEl) angerEl.style.display = 'none'; // decay中は即非表示（追従更新を待たない）
    gag.fly.src = poseSrc('decay') + '&t=' + Date.now(); // パラメータを変えて先頭から再生させる
    gag.timer = setTimeout(function () { gagReset(); }, DECAY_MS + 4000); // 消滅後、間を置いてから復帰
  }

  window.addEventListener('resize', function () {
    if (player.active && player._place) player._place();
  });

  /* ── 呼び出しボタンのドラッグ移動（位置は端末に保存） ── */
  var btnDragged = false;
  function setBtnPos(x, y) {
    btn.style.left = x + 'px'; btn.style.top = y + 'px';
    btn.style.right = 'auto'; btn.style.bottom = 'auto';
  }
  function applyBtnPos() {
    if (!rec.btnPos || !btn) return;
    var w = btn.offsetWidth || 62, h = btn.offsetHeight || 62;
    var x = Math.round((rec.btnPos.fx || 0) * Math.max(0, window.innerWidth - w));
    var y = Math.round((rec.btnPos.fy || 0) * Math.max(0, window.innerHeight - h));
    setBtnPos(x, y);
  }
  function initBtnDrag() {
    var drag = null;
    btn.addEventListener('pointerdown', function (e) {
      btnDragged = false; // 新しい押下で前回のドラッグ判定を持ち越さない
      var r = btn.getBoundingClientRect();
      drag = { sx: e.clientX, sy: e.clientY, left: r.left, top: r.top, moved: false };
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
    });
    btn.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && Math.sqrt(dx * dx + dy * dy) < 8) return;
      drag.moved = true; btnDragged = true;
      var w = btn.offsetWidth || 62, h = btn.offsetHeight || 62;
      setBtnPos(
        Math.max(2, Math.min(window.innerWidth - w - 2, drag.left + dx)),
        Math.max(2, Math.min(window.innerHeight - h - 2, drag.top + dy))
      );
    });
    var end = function () {
      if (drag && drag.moved) {
        var r = btn.getBoundingClientRect();
        var w = btn.offsetWidth || 62, h = btn.offsetHeight || 62;
        rec.btnPos = {
          fx: Math.max(0, Math.min(1, r.left / Math.max(1, window.innerWidth - w))),
          fy: Math.max(0, Math.min(1, r.top / Math.max(1, window.innerHeight - h)))
        };
        saveRec();
      }
      drag = null;
    };
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointercancel', end);
    applyBtnPos();
    window.addEventListener('resize', applyBtnPos);
  }

  /* ── 呼び出しボタンの表示制御（表示ページ制限＋利用者のON/OFF） ── */
  function btnShouldShow() {
    if (rec.btnOff) return false;
    if (cfg.buttonPages && bridge().currentPage) {
      try { return cfg.buttonPages.indexOf(bridge().currentPage()) >= 0; } catch (e) { return true; }
    }
    return true;
  }
  function applyBtn() { if (btn) btn.style.display = btnShouldShow() ? '' : 'none'; }

  // アプリ側（設定画面など）から使う公開API
  window.NamaTutorial = {
    open: function () { openPanel(false); },
    setButtonVisible: function (v) { rec.btnOff = !v; saveRec(); applyBtn(); },
    isButtonVisible: function () { return !rec.btnOff; }
  };

  /* ── 起動 ── */
  function init() {
    buildDom();
    applyBtn();
    // ポーズ画像を先読みしてキャッシュに温める（弱い回線で表示直前に取りに行くと読み込み不能表示になりやすいため）
    ['wave', 'yay', 'thinking', 'question', 'thumbs_up', 'sparkle', 'fainted', 'left', 'right', 'up', 'up_left', 'up_right', 'down', 'down_left', 'down_right', 'run', 'panic', 'decay'].forEach(function (p) {
      var im = new Image(); im.src = poseSrc(p);
    });
    // それでも失敗したら1回だけ自動で読み直す
    charImg.addEventListener('load', function () { charImg._imgRetried = false; });
    charImg.addEventListener('error', function () {
      if (charImg._imgRetried) return;
      charImg._imgRetried = true;
      var src = charImg.src;
      setTimeout(function () { charImg.src = src; }, 700);
    });
    setInterval(applyBtn, 400); // ページ移動に追従してボタンの出し分けをする
    if (!rec.introSeen) {
      // 初回案内は「ボタンを出してよい画面」でのみ自動で開く（ログイン画面などでは開かず、対象画面に来るまで待つ）
      var introTries = 0;
      var introIv = setInterval(function () {
        introTries++;
        if (rec.introSeen || introTries > 15) { clearInterval(introIv); return; }
        if (openLayers > 0 || player.active) return;
        if (btnShouldShow()) { clearInterval(introIv); openPanel(true); }
      }, 900);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
