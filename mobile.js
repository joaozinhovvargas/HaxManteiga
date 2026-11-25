(function () {
  if (window.__haxmantega_mobile) return;
  window.__haxmantega_mobile = true;
  if (window === window.top) return; // so roda dentro do iframe do jogo

  var KEY = 'haxmantega_mobile';
  var cfg = { on: /Android/i.test(navigator.userAgent), size: 150 };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) cfg = Object.assign(cfg, saved);
  } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }

  // ---------- Envio de teclas para o jogo ----------
  var K = {
    13: { key: 'Enter', code: 'Enter' },
    27: { key: 'Escape', code: 'Escape' },
    37: { key: 'ArrowLeft', code: 'ArrowLeft' },
    38: { key: 'ArrowUp', code: 'ArrowUp' },
    39: { key: 'ArrowRight', code: 'ArrowRight' },
    40: { key: 'ArrowDown', code: 'ArrowDown' },
    88: { key: 'x', code: 'KeyX' }
  };
  var down = {};
  function fire(type, code, target) {
    var k = K[code];
    var e = new KeyboardEvent(type, {
      key: k.key, code: k.code, keyCode: code, which: code,
      bubbles: true, cancelable: true
    });
    if (e.keyCode !== code) {
      Object.defineProperty(e, 'keyCode', { get: function () { return code; } });
      Object.defineProperty(e, 'which', { get: function () { return code; } });
    }
    (target || document.body || document).dispatchEvent(e);
  }
  function setKey(code, on) {
    if (!!down[code] === on) return;
    down[code] = on;
    fire(on ? 'keydown' : 'keyup', code);
  }
  function blurActive() {
    var a = document.activeElement;
    if (a && a.blur && a !== document.body) a.blur();
  }

  // ---------- Chat ----------
  function chatInput() { return document.querySelector('[data-hook="input"]'); }
  function sendChat(text) {
    var input = chatInput();
    if (!input) return;
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fire('keydown', 13, input);
    fire('keyup', 13, input);
    input.value = '';
    input.blur();
  }

  // ---------- Interface ----------
  var root = document.createElement('div');
  root.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483646;pointer-events:none;display:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none';
  root.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.documentElement.appendChild(root);

  var circle = 'border-radius:50%;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.4);pointer-events:auto;touch-action:none;position:absolute;display:flex;align-items:center;justify-content:center;color:#fff;font-family:sans-serif;';

  var base = document.createElement('div');
  var knob = document.createElement('div');
  base.appendChild(knob);
  root.appendChild(base);

  var kick = document.createElement('div');
  kick.textContent = '⚽';
  root.appendChild(kick);

  function layout() {
    var s = cfg.size;
    base.style.cssText = circle + 'left:4vw;bottom:8vh;width:' + s + 'px;height:' + s + 'px;';
    knob.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:50%;background:rgba(255,255,255,.55);pointer-events:none;width:' + (s * 0.45) + 'px;height:' + (s * 0.45) + 'px;';
    var k = s * 0.75;
    kick.style.cssText = circle + 'right:5vw;bottom:10vh;width:' + k + 'px;height:' + k + 'px;font-size:' + (k * 0.45) + 'px;';
  }
  layout();

  // Joystick
  var activeId = null;
  function moveStick(e) {
    var r = base.getBoundingClientRect();
    var max = r.width / 2;
    var dx = e.clientX - (r.left + max);
    var dy = e.clientY - (r.top + max);
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > max) { dx = dx / dist * max; dy = dy / dist * max; }
    knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    var dz = max * 0.3;
    setKey(37, dx < -dz);
    setKey(39, dx > dz);
    setKey(38, dy < -dz);
    setKey(40, dy > dz);
  }
  function endStick(e) {
    if (e.pointerId !== activeId) return;
    activeId = null;
    knob.style.transform = 'translate(-50%,-50%)';
    [37, 38, 39, 40].forEach(function (c) { setKey(c, false); });
  }
  base.addEventListener('pointerdown', function (e) {
    activeId = e.pointerId;
    try { base.setPointerCapture(e.pointerId); } catch (x) {}
    blurActive();
    moveStick(e);
    e.preventDefault();
  });
  base.addEventListener('pointermove', function (e) { if (e.pointerId === activeId) moveStick(e); });
  base.addEventListener('pointerup', endStick);
  base.addEventListener('pointercancel', endStick);

  // Botao de chute (X)
  kick.addEventListener('pointerdown', function (e) {
    try { kick.setPointerCapture(e.pointerId); } catch (x) {}
    blurActive();
    kick.style.background = 'rgba(255,80,80,.45)';
    setKey(88, true);
    e.preventDefault();
  });
  function kickUp() {
    kick.style.background = 'rgba(255,255,255,.14)';
    setKey(88, false);
  }
  kick.addEventListener('pointerup', kickUp);
  kick.addEventListener('pointercancel', kickUp);

  // Barra de chat rapido (atalhos + emojis), abre no botao 💬
  var bar = document.createElement('div');
  bar.style.cssText = 'position:absolute;top:60px;right:8px;max-width:64vw;display:none;flex-wrap:wrap;gap:6px;padding:8px;background:rgba(15,20,25,.93);border:1px solid rgba(255,255,255,.3);border-radius:10px;pointer-events:auto;touch-action:manipulation';
  root.appendChild(bar);

  function chip(label, fn) {
    var b = document.createElement('div');
    b.textContent = label;
    b.style.cssText = 'padding:10px 14px;background:#2b3a45;color:#fff;border:1px solid #475a68;border-radius:8px;font:15px sans-serif;';
    b.addEventListener('pointerdown', function (e) { fn(); e.preventDefault(); });
    bar.appendChild(b);
  }
  function buildBar() {
    bar.innerHTML = '';
    var list = ['gg', 'boa!', 'passa a bola', 'bora!'];
    try {
      var c = JSON.parse(localStorage.getItem('haxmantega_cfg') || '{}');
      if (c.shortcuts) list = c.shortcuts;
    } catch (e) {}
    list.forEach(function (t) {
      if (t) chip(t, function () { sendChat(t); bar.style.display = 'none'; });
    });
    ['😂', '😎', '👍', '🔥', '💀', '⚽'].forEach(function (em) {
      chip(em, function () { sendChat(em); bar.style.display = 'none'; });
    });
    chip('⌨ Digitar', function () {
      bar.style.display = 'none';
      var i = chatInput();
      if (i) i.focus();
    });
  }

  // Botoes pequenos (topo): chat, menu do jogo, painel HaxMantega
  function small(label, right, fn) {
    var b = document.createElement('div');
    b.textContent = label;
    b.style.cssText = circle + 'top:8px;right:' + right + 'px;width:44px;height:44px;font-size:20px;';
    b.addEventListener('pointerdown', function (e) { fn(); e.preventDefault(); });
    root.appendChild(b);
  }
  small('💬', 8, function () {
    if (bar.style.display === 'none') { buildBar(); bar.style.display = 'flex'; }
    else bar.style.display = 'none';
  });
  small('☰', 60, function () {
    bar.style.display = 'none';
    fire('keydown', 27); fire('keyup', 27);
  });
  small('⚙', 112, function () {
    bar.style.display = 'none';
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2', code: 'F2', bubbles: true, cancelable: true }));
  });

  // ---------- Mostrar so quando o jogo estiver aberto ----------
  function update() {
    var show = cfg.on && !!document.querySelector('canvas');
    root.style.display = show ? 'block' : 'none';
  }
  setInterval(update, 1000);
  update();

  // F3 liga/desliga o modo mobile (para telas touch no PC)
  window.addEventListener('keydown', function (e) {
    if (e.key === 'F3') {
      cfg.on = !cfg.on; save(); update();
      e.preventDefault();
    }
  }, true);
})();
