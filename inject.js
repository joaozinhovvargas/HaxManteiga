(function () {
  if (window.__haxmantega) return;
  window.__haxmantega = true;

  var TOP = window === window.top;
  var TOUCH = /Android|iPhone|iPad/i.test(navigator.userAgent);
  var KEY = 'haxmantega_cfg';

  // ---------- Config salva ----------
  var defaults = {
    rainbow: false,
    rainbowMs: 500,
    theme: 'padrao',
    wallpaper: '',
    shortcuts: ['gg', 'boa!', 'passa a bola', 'bora!'],
    favorites: []
  };
  function load() {
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (e) { return Object.assign({}, defaults); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }
  var cfg = load();

  // ---------- Limite de 90 FPS ----------
  (function () {
    var MAX_FPS = 90;
    var interval = 1000 / MAX_FPS;
    var last = 0;
    var lastRun = -1;
    var realRAF = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = function (cb) {
      return realRAF(function tick(ts) {
        if (ts === lastRun) { cb(ts); return; } // mesmo quadro: deixa todos rodarem
        if (ts - last >= interval - 1) {
          last = ts;
          lastRun = ts;
          cb(ts);
        } else {
          realRAF(tick);
        }
      });
    };
  })();

  // ---------- Ajudantes do chat (dentro da sala) ----------
  function chatInput() { return document.querySelector('[data-hook="input"]'); }
  function sendChat(text) {
    var input = chatInput();
    if (!input) return false;
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    ['keydown', 'keyup'].forEach(function (t) {
      input.dispatchEvent(new KeyboardEvent(t, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    });
    input.value = '';
    return true;
  }
  function insertChat(text) {
    var input = chatInput();
    if (!input) return;
    input.value += text;
    input.focus();
  }

  // ---------- Temas e wallpaper ----------
  var themes = {
    padrao: '',
    escuro: 'body,.dialog,.room-view,.roomlist-view{background:#0d1114!important;color:#e6e6e6!important}',
    azul: 'body,.dialog,.room-view,.roomlist-view{background:#0b1a2e!important;color:#d7e8ff!important}',
    verde: 'body,.dialog,.room-view,.roomlist-view{background:#0b2414!important;color:#d6ffe0!important}',
    roxo: 'body,.dialog,.room-view,.roomlist-view{background:#1c0f2e!important;color:#ecd9ff!important}'
  };
  var styleEl = document.createElement('style');
  (document.head || document.documentElement).appendChild(styleEl);
  function applyTheme() {
    var css = themes[cfg.theme] || '';
    if (cfg.wallpaper) {
      css += 'body{background-image:url("' + cfg.wallpaper.replace(/"/g, '') + '")!important;background-size:cover!important;background-position:center!important}';
    }
    styleEl.textContent = css;
  }
  applyTheme();

  // ---------- Avatar arco-iris ----------
  var emojis = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'];
  var idx = 0;
  var rainbowTimer = null;
  function setRainbow(on) {
    cfg.rainbow = on; save();
    if (rainbowTimer) { clearInterval(rainbowTimer); rainbowTimer = null; }
    if (on) {
      rainbowTimer = setInterval(function () {
        sendChat('/avatar ' + emojis[idx % emojis.length]);
        idx++;
      }, cfg.rainbowMs);
    }
  }

  // ---------- Painel (F2 abre e fecha) ----------
  var panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;top:' + (TOUCH ? '64px' : '10px') + ';right:10px;z-index:2147483647;width:min(300px,92vw);max-height:' + (TOUCH ? 'calc(100vh - 76px)' : '90vh') + ';overflow:auto;-webkit-overflow-scrolling:touch;background:rgba(15,20,25,.95);color:#fff;font:13px sans-serif;border:1px solid #3a4a55;border-radius:8px;padding:10px;display:none';
  document.documentElement.appendChild(panel);

  function btn(label, fn) {
    var b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'margin:2px;padding:' + (TOUCH ? '10px 14px;font-size:15px' : '4px 8px') + ';background:#2b3a45;color:#fff;border:1px solid #475a68;border-radius:4px;cursor:pointer';
    b.onclick = fn;
    return b;
  }
  function title(t) {
    var h = document.createElement('div');
    h.textContent = t;
    h.style.cssText = 'margin:10px 0 4px;font-weight:bold;color:#8fd3ff';
    return h;
  }

  function render() {
    panel.innerHTML = '';
    var h = document.createElement('div');
    h.style.cssText = 'font-size:15px;font-weight:bold;display:flex;justify-content:space-between;align-items:center';
    var ht = document.createElement('span');
    ht.textContent = TOUCH ? 'HaxMantega' : 'HaxMantega  (F2 fecha)';
    h.appendChild(ht);
    h.appendChild(btn('✕', function () { panel.style.display = 'none'; }));
    panel.appendChild(h);

    // Avatar
    panel.appendChild(title('Avatar arco-iris'));
    panel.appendChild(btn(cfg.rainbow ? 'Desligar' : 'Ligar', function () { setRainbow(!cfg.rainbow); render(); }));
    var ms = document.createElement('input');
    ms.type = 'number'; ms.min = 200; ms.step = 100; ms.value = cfg.rainbowMs;
    ms.style.cssText = 'width:70px;margin-left:6px';
    ms.onchange = function () {
      cfg.rainbowMs = Math.max(200, parseInt(ms.value) || 500); save();
      if (cfg.rainbow) setRainbow(true);
    };
    panel.appendChild(ms);
    panel.appendChild(document.createTextNode(' ms'));

    // Temas
    panel.appendChild(title('Tema'));
    Object.keys(themes).forEach(function (t) {
      panel.appendChild(btn(t, function () { cfg.theme = t; save(); applyTheme(); }));
    });

    // Wallpaper
    panel.appendChild(title('Wallpaper (URL da imagem)'));
    var wp = document.createElement('input');
    wp.type = 'text'; wp.value = cfg.wallpaper; wp.placeholder = 'https://...';
    wp.style.cssText = 'width:100%;box-sizing:border-box';
    wp.onchange = function () { cfg.wallpaper = wp.value.trim(); save(); applyTheme(); };
    panel.appendChild(wp);

    // Emojis
    panel.appendChild(title('Emojis (clique para inserir no chat)'));
    ['😀', '😂', '😎', '😡', '😭', '👍', '👏', '🔥', '⚽', '🏆', '💀', '❤️'].forEach(function (e) {
      panel.appendChild(btn(e, function () { insertChat(e); }));
    });

    // Atalhos
    panel.appendChild(title(TOUCH ? 'Atalhos de chat (toque em Enviar)' : 'Atalhos de chat (Alt+1 ... Alt+4)'));
    cfg.shortcuts.forEach(function (s, i) {
      var row = document.createElement('div');
      row.appendChild(document.createTextNode('Alt+' + (i + 1) + ': '));
      var inp = document.createElement('input');
      inp.type = 'text'; inp.value = s; inp.style.width = TOUCH ? '120px' : '170px';
      if (TOUCH) inp.style.fontSize = '15px';
      inp.onchange = function () { cfg.shortcuts[i] = inp.value; save(); };
      row.appendChild(inp);
      row.appendChild(btn('Enviar', function () { sendChat(cfg.shortcuts[i]); }));
      panel.appendChild(row);
    });

    // Salas favoritas (so na pagina principal)
    if (TOP) {
      panel.appendChild(title('Salas favoritas'));
      panel.appendChild(btn('⭐ Favoritar sala atual', function () {
        var url = location.href;
        if (url.indexOf('c=') === -1) { alert('Entre em uma sala primeiro.'); return; }
        var nome = prompt('Nome da sala:', 'Sala ' + (cfg.favorites.length + 1));
        if (!nome) return;
        cfg.favorites.push({ name: nome, url: url }); save(); render();
      }));
      cfg.favorites.forEach(function (f, i) {
        var row = document.createElement('div');
        row.appendChild(btn(f.name, function () { location.href = f.url; }));
        row.appendChild(btn('x', function () { cfg.favorites.splice(i, 1); save(); render(); }));
        panel.appendChild(row);
      });
    }
  }
  render();

  // ---------- Contador de FPS ----------
  var fpsEl = document.createElement('div');
  fpsEl.style.cssText = 'position:fixed;top:4px;left:4px;z-index:2147483647;background:rgba(0,0,0,.55);color:#7CFC00;font:12px monospace;padding:2px 6px;border-radius:4px;pointer-events:none';
  document.documentElement.appendChild(fpsEl);
  var frames = 0, lastT = performance.now();
  (function loop() {
    frames++;
    var now = performance.now();
    if (now - lastT >= 1000) {
      fpsEl.textContent = frames + ' FPS (max 90)';
      frames = 0; lastT = now;
    }
    window.requestAnimationFrame(loop);
  })();

  // ---------- Teclas ----------
  window.addEventListener('keydown', function (e) {
    if (e.key === 'F2') {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      e.preventDefault();
    }
    if (e.altKey && e.key >= '1' && e.key <= '4') {
      var s = cfg.shortcuts[parseInt(e.key) - 1];
      if (s) sendChat(s);
      e.preventDefault();
    }
  }, true);

  if (cfg.rainbow) setRainbow(true);
})();
