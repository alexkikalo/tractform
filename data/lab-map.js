(function () {
  const KEY = 'tractform_map_proto_v2';
  const FT_AC = 43560;
  const EIGHTH_SIDE = Math.sqrt(FT_AC / 8);
  const YARD = 3;

  const USES = {
    homesite: { id:'homesite', name:'Homesite', short:'House', color:'#064e3b', wiki:'/land.html', topic:'Land', min:0.5, ok:1, w:80, h:80, detail:'House, drive, septic setbacks. Land sizes this at 0.5-2 ac.' },
    garden:   { id:'garden', name:'Kitchen garden', short:'Garden', color:'#65a30d', wiki:'/gardens.html', topic:'Gardens', min:0.05, ok:0.25, w:50, h:40, detail:'Beds near the house. Gardens topic is sq ft + water method.' },
    orchard:  { id:'orchard', name:'Orchard', short:'Orchard', color:'#a16207', wiki:'/gardens.html', topic:'Gardens', min:0.15, ok:0.5, w:90, h:70, detail:'A home orchard wants about 0.5 ac and air drainage.' },
    poultry:  { id:'poultry', name:'Poultry yard', short:'Poultry', color:'#d97706', wiki:'/production.html', topic:'Livestock', min:0.05, ok:0.2, w:40, h:40, detail:'Backyard flock footprint. Livestock sizes head count and coop.' },
    pasture:  { id:'pasture', name:'Pasture', short:'Pasture', color:'#4d7c0f', wiki:'/production.html', topic:'Livestock', min:2, ok:8, w:200, h:160, detail:'A pair of sheep or 1-2 cattle wants ~2 ac. Small herd ~8 ac.' },
    hay:      { id:'hay', name:'Hay field', short:'Hay', color:'#ca8a04', wiki:'/land.html', topic:'Land', min:2, ok:5, w:180, h:140, detail:'Winter feed for a few animals starts around 2 ac.' },
    woodlot:  { id:'woodlot', name:'Woodlot', short:'Woods', color:'#166534', wiki:'/land.html', topic:'Land', min:1, ok:5, w:140, h:140, detail:'Counted as placed, not extra usable pasture.' },
    barn:     { id:'barn', name:'Barn / shop', short:'Barn', color:'#7c2d12', wiki:'/buildings.html', topic:'Buildings', min:0.05, ok:0.15, w:50, h:36, detail:'Footprint only. Buildings covers frost and style.' },
    well:     { id:'well', name:'Well / septic', short:'Well', color:'#0369a1', wiki:'/utilities.html', topic:'Utilities', min:0.02, ok:0.08, w:28, h:28, detail:'Utilities estimates demand. Grid does not enforce setbacks yet.' },
    access:   { id:'access', name:'Drive / lane', short:'Lane', color:'#78716c', wiki:'/land.html', topic:'Land', min:0.1, ok:0.25, w:120, h:18, detail:'Access and setbacks. More honest than an auto buffer.' }
  };

  const state = {
    targetAc: 5,
    shape: 'square',
    verts: [],
    stamps: [],
    selected: null,
    scale: 1,
    ox: 0,
    oy: 0,
    drag: null
  };

  const svg = document.getElementById('stage');

  function uid() { return 's' + Math.random().toString(36).slice(2, 8); }

  function shoelace(verts) {
    let a = 0;
    for (let i = 0; i < verts.length; i++) {
      const p = verts[i], q = verts[(i + 1) % verts.length];
      a += p.x * q.y - q.x * p.y;
    }
    return Math.abs(a) / 2;
  }

  function rectFor(acres, shape) {
    const area = acres * FT_AC;
    const ratio = shape === 'wide' ? 2 : shape === 'deep' ? 0.5 : 1;
    const w = Math.sqrt(area * ratio);
    const h = area / w;
    return [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h }
    ];
  }

  function bounds(verts) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    verts.forEach(p => {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    });
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }

  function fit() {
    const b = bounds(state.verts);
    const r = svg.getBoundingClientRect();
    const pad = 48;
    const sx = (r.width - pad * 2) / Math.max(40, b.w);
    const sy = (r.height - pad * 2) / Math.max(40, b.h);
    state.scale = Math.max(0.02, Math.min(sx, sy));
    state.ox = pad - b.minX * state.scale;
    state.oy = pad - b.minY * state.scale;
  }

  function toWorld(clientX, clientY) {
    const r = svg.getBoundingClientRect();
    return {
      x: (clientX - r.left - state.ox) / state.scale,
      y: (clientY - r.top - state.oy) / state.scale
    };
  }

  function inside(pt, verts) {
    let odd = false;
    for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
      const a = verts[i], b = verts[j];
      if ((a.y > pt.y) !== (b.y > pt.y) &&
          pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x) odd = !odd;
    }
    return odd;
  }

  function dist2(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }

  function distToSeg(p, a, b) {
    const vx = b.x - a.x, vy = b.y - a.y;
    const len2 = vx * vx + vy * vy || 1;
    let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2;
    t = Math.max(0, Math.min(1, t));
    const q = { x: a.x + t * vx, y: a.y + t * vy };
    return { t, q, d: Math.sqrt(dist2(p, q)) };
  }

  function gridStepFt() {
    const px = state.scale;
    const want = 56 / px;
    const steps = [YARD, 9, 18, 36, EIGHTH_SIDE / 2, EIGHTH_SIDE, EIGHTH_SIDE * 2, EIGHTH_SIDE * 4];
    for (let i = 0; i < steps.length; i++) if (steps[i] >= want) return steps[i];
    return steps[steps.length - 1];
  }

  function gridLabel(step) {
    if (Math.abs(step - YARD) < 0.05) return '1 yard';
    if (Math.abs(step - 9) < 0.1) return '3 yards';
    if (Math.abs(step - EIGHTH_SIDE) < 0.5) return '1/8 acre square';
    if (Math.abs(step - EIGHTH_SIDE / 2) < 0.5) return '~1/32 acre';
    if (step < EIGHTH_SIDE) return Math.round(step) + ' ft';
    const ac = (step * step) / FT_AC;
    return ac >= 0.12 ? ac.toFixed(2) + ' ac cells' : Math.round(step) + ' ft';
  }

  function stampAreaAc(s) {
    return +((s.w * s.h) / FT_AC).toFixed(3);
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!raw) return false;
      if (raw.targetAc) state.targetAc = raw.targetAc;
      if (raw.shape) state.shape = raw.shape;
      if (Array.isArray(raw.verts) && raw.verts.length >= 3) state.verts = raw.verts;
      if (Array.isArray(raw.stamps)) state.stamps = raw.stamps;
      return !!state.verts.length;
    } catch (e) { return false; }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify({
      targetAc: state.targetAc,
      shape: state.shape,
      verts: state.verts,
      stamps: state.stamps
    }));
  }

  function renderPalette() {
    document.getElementById('palette').innerHTML = Object.values(USES).map(u =>
      '<div class="chip flex items-center gap-2 rounded-lg border border-stone-200 px-2 py-1.5 bg-white" draggable="true" data-id="' + u.id + '">' +
        '<span class="w-3.5 h-3.5 rounded-sm shrink-0" style="background:' + u.color + '"></span>' +
        '<span class="text-xs font-medium">' + u.short + '</span></div>'
    ).join('');
    document.querySelectorAll('#palette .chip').forEach(el => {
      el.addEventListener('dragstart', ev => {
        ev.dataTransfer.setData('text/plain', el.dataset.id);
        ev.dataTransfer.effectAllowed = 'copy';
      });
    });
  }

  function issuesFor(id, acres) {
    const u = USES[id];
    if (acres + 1e-9 < u.min) return { level:'short', text: acres + ' ac is under the usual minimum (' + u.min + ' ac) for ' + u.name.toLowerCase() + '.' };
    if (acres + 1e-9 < u.ok) return { level:'tight', text: acres + ' ac is a tight ' + u.name.toLowerCase() + ' (comfortable ~' + u.ok + ' ac).' };
    return { level:'ok', text: acres + ' ac covers a basic ' + u.name.toLowerCase() + '.' };
  }

  function renderVerdict() {
    const drawnAc = +(shoelace(state.verts) / FT_AC).toFixed(2);
    const drift = +(drawnAc - state.targetAc).toFixed(2);
    document.getElementById('area-meta').textContent =
      'Drawn area ' + drawnAc + ' ac \u00b7 target ' + state.targetAc + ' ac' +
      (Math.abs(drift) >= 0.1 ? ' \u00b7 ' + (drift > 0 ? '+' : '') + drift + ' ac vs target' : '');

    const used = {};
    state.stamps.forEach(s => { used[s.use] = +((used[s.use] || 0) + stampAreaAc(s)).toFixed(3); });
    const list = [];
    if (Math.abs(drift) >= 0.25) list.push({ level:'tight', text:'Shape area is ' + drawnAc + ' ac, not the ' + state.targetAc + ' ac target. Dragging nodes changes survey area.' });
    if (!state.stamps.length) list.push({ level:'unset', text:'No uses placed yet.' });
    if (!used.homesite && state.stamps.length) list.push({ level:'tight', text:'No homesite on the tract.' });
    if (used.pasture && used.pasture < 2) list.push({ level:'short', text:'Pasture stamp is only ' + used.pasture + ' ac.' });
    state.stamps.forEach(s => {
      const c = { x: s.x + s.w / 2, y: s.y + s.h / 2 };
      if (!inside(c, state.verts)) list.push({ level:'short', text: USES[s.use].short + ' sits outside the parcel boundary.' });
    });
    const worst = list.find(x => x.level === 'short') || list.find(x => x.level === 'tight') || list[0];
    document.getElementById('verdict-head').textContent = worst ? worst.text : 'Layout looks workable.';
    document.getElementById('verdict-detail').textContent = 'Topics stay generic. This page only flags fit and sends you there.';
    document.getElementById('verdict-list').innerHTML = Object.keys(used).map(id => {
      const bad = issuesFor(id, used[id]).level === 'short';
      return '<li class="flex justify-between gap-2"><span>' + USES[id].short + '</span><span class="tabular-nums ' + (bad ? 'text-amber-300' : 'text-emerald-100') + '">' + used[id] + ' ac</span></li>';
    }).join('');
    document.getElementById('zoom-meta').textContent = 'Grid: ' + gridLabel(gridStepFt()) + ' \u00b7 ' + (state.scale * 3).toFixed(1) + ' px / yard';
  }

  function inspectStamp(s) {
    const box = document.getElementById('inspector');
    if (!s) { box.classList.add('hidden'); return; }
    const u = USES[s.use];
    const ac = stampAreaAc(s);
    const flag = issuesFor(s.use, ac);
    document.getElementById('ins-name').textContent = u.name;
    document.getElementById('ins-acres').textContent = ac + ' ac footprint \u00b7 ' + Math.round(s.w) + ' \u00d7 ' + Math.round(s.h) + ' ft';
    document.getElementById('ins-note').textContent = u.detail;
    const link = document.getElementById('ins-link');
    link.href = u.wiki;
    link.textContent = 'Open ' + u.topic + ' topic \u2192';
    const cls = flag.level === 'short' ? 'bg-amber-50 text-amber-900 border-amber-200' :
      flag.level === 'tight' ? 'bg-stone-50 text-stone-700 border-stone-200' :
      'bg-emerald-50 text-emerald-900 border-emerald-200';
    document.getElementById('ins-flags').innerHTML = '<p class="text-xs leading-relaxed border rounded-lg px-3 py-2 ' + cls + '">' + flag.text + '</p>';
    box.classList.remove('hidden');
  }

  function draw() {
    const r = svg.getBoundingClientRect();
    const step = gridStepFt();
    const b = bounds(state.verts);
    const pad = 400;
    const x0 = Math.floor((b.minX - pad) / step) * step;
    const y0 = Math.floor((b.minY - pad) / step) * step;
    const x1 = b.maxX + pad;
    const y1 = b.maxY + pad;
    let grid = '';
    for (let x = x0; x <= x1; x += step) {
      const sx = state.ox + x * state.scale;
      grid += '<line x1="' + sx + '" y1="0" x2="' + sx + '" y2="' + r.height + '" stroke="#d6d3d1" stroke-width="1"/>';
    }
    for (let y = y0; y <= y1; y += step) {
      const sy = state.oy + y * state.scale;
      grid += '<line x1="0" y1="' + sy + '" x2="' + r.width + '" y2="' + sy + '" stroke="#d6d3d1" stroke-width="1"/>';
    }

    const pts = state.verts.map(p => (state.ox + p.x * state.scale) + ',' + (state.oy + p.y * state.scale)).join(' ');
    const nodes = state.verts.map((p, i) => {
      const cx = state.ox + p.x * state.scale, cy = state.oy + p.y * state.scale;
      return '<circle data-vert="' + i + '" cx="' + cx + '" cy="' + cy + '" r="7" fill="#fff" stroke="#065f46" stroke-width="2"/>';
    }).join('');

    const mids = state.verts.map((p, i) => {
      const q = state.verts[(i + 1) % state.verts.length];
      const mx = state.ox + (p.x + q.x) / 2 * state.scale;
      const my = state.oy + (p.y + q.y) / 2 * state.scale;
      return '<circle data-edge="' + i + '" cx="' + mx + '" cy="' + my + '" r="4.5" fill="#a7f3d0" stroke="#065f46" stroke-width="1" opacity="0.9"/>';
    }).join('');

    const stamps = state.stamps.map(s => {
      const u = USES[s.use];
      const x = state.ox + s.x * state.scale;
      const y = state.oy + s.y * state.scale;
      const w = s.w * state.scale;
      const h = s.h * state.scale;
      const on = state.selected === s.id;
      return '<g data-stamp="' + s.id + '" cursor="move">' +
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + u.color + '" fill-opacity="0.55" stroke="' + (on ? '#fbbf24' : u.color) + '" stroke-width="' + (on ? 3 : 1.5) + '" rx="3"/>' +
        '<text x="' + (x + 6) + '" y="' + (y + 14) + '" font-size="11" fill="#fff" font-family="Inter,system-ui">' + u.short + '</text></g>';
    }).join('');

    svg.innerHTML =
      '<rect width="100%" height="100%" fill="#f5f5f4"/>' + grid +
      '<polygon points="' + pts + '" fill="#ecfdf5" fill-opacity="0.7" stroke="#065f46" stroke-width="2"/>' +
      stamps + mids + nodes;
    renderVerdict();
    save();
  }

  function hitVert(w, pxTol) {
    const tol = pxTol / state.scale;
    for (let i = 0; i < state.verts.length; i++) {
      if (Math.sqrt(dist2(w, state.verts[i])) <= tol) return i;
    }
    return -1;
  }

  function hitEdge(w, pxTol) {
    const tol = pxTol / state.scale;
    for (let i = 0; i < state.verts.length; i++) {
      const a = state.verts[i], b = state.verts[(i + 1) % state.verts.length];
      const s = distToSeg(w, a, b);
      if (s.d <= tol && s.t > 0.08 && s.t < 0.92) return { i, q: s.q };
    }
    return null;
  }

  function hitStamp(w) {
    for (let i = state.stamps.length - 1; i >= 0; i--) {
      const s = state.stamps[i];
      if (w.x >= s.x && w.x <= s.x + s.w && w.y >= s.y && w.y <= s.y + s.h) return s;
    }
    return null;
  }

  svg.addEventListener('wheel', ev => {
    ev.preventDefault();
    const w = toWorld(ev.clientX, ev.clientY);
    const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
    const next = Math.max(0.02, Math.min(8, state.scale * factor));
    state.ox = ev.clientX - svg.getBoundingClientRect().left - w.x * next;
    state.oy = ev.clientY - svg.getBoundingClientRect().top - w.y * next;
    state.scale = next;
    draw();
  }, { passive: false });

  svg.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    const w = toWorld(ev.clientX, ev.clientY);
    const vi = hitVert(w, 12);
    if (vi >= 0) {
      if (ev.altKey && state.verts.length > 3) {
        state.verts.splice(vi, 1);
        draw();
        return;
      }
      state.drag = { kind: 'vert', i: vi };
      svg.setPointerCapture(ev.pointerId);
      return;
    }
    const st = hitStamp(w);
    if (st) {
      state.selected = st.id;
      inspectStamp(st);
      state.drag = { kind: 'stamp', id: st.id, dx: w.x - st.x, dy: w.y - st.y };
      svg.setPointerCapture(ev.pointerId);
      draw();
      return;
    }
    state.selected = null;
    inspectStamp(null);
    state.drag = { kind: 'pan', x: ev.clientX, y: ev.clientY, ox: state.ox, oy: state.oy };
    svg.classList.add('drag');
    svg.setPointerCapture(ev.pointerId);
    draw();
  });

  svg.addEventListener('pointermove', ev => {
    if (!state.drag) return;
    if (state.drag.kind === 'pan') {
      state.ox = state.drag.ox + (ev.clientX - state.drag.x);
      state.oy = state.drag.oy + (ev.clientY - state.drag.y);
      draw();
      return;
    }
    const w = toWorld(ev.clientX, ev.clientY);
    if (state.drag.kind === 'vert') {
      state.verts[state.drag.i] = { x: w.x, y: w.y };
      draw();
    } else if (state.drag.kind === 'stamp') {
      const s = state.stamps.find(x => x.id === state.drag.id);
      if (s) { s.x = w.x - state.drag.dx; s.y = w.y - state.drag.dy; draw(); }
    }
  });

  svg.addEventListener('pointerup', () => {
    state.drag = null;
    svg.classList.remove('drag');
  });

  svg.addEventListener('dblclick', ev => {
    const w = toWorld(ev.clientX, ev.clientY);
    const edge = hitEdge(w, 14);
    if (!edge) return;
    ev.preventDefault();
    state.verts.splice(edge.i + 1, 0, edge.q);
    draw();
  });

  svg.addEventListener('dragover', ev => ev.preventDefault());
  svg.addEventListener('drop', ev => {
    ev.preventDefault();
    const id = ev.dataTransfer.getData('text/plain');
    if (!USES[id]) return;
    const w = toWorld(ev.clientX, ev.clientY);
    const u = USES[id];
    const s = { id: uid(), use: id, x: w.x - u.w / 2, y: w.y - u.h / 2, w: u.w, h: u.h };
    state.stamps.push(s);
    state.selected = s.id;
    inspectStamp(s);
    draw();
  });

  document.getElementById('acres').addEventListener('change', () => {
    const n = Number(document.getElementById('acres').value);
    state.targetAc = Number.isFinite(n) && n > 0 ? n : 5;
    state.verts = rectFor(state.targetAc, state.shape);
    fit();
    draw();
  });
  document.getElementById('shape-btns').addEventListener('click', ev => {
    const btn = ev.target.closest('[data-shape]');
    if (!btn) return;
    state.shape = btn.dataset.shape;
    document.querySelectorAll('.shape-btn').forEach(b => {
      const on = b.dataset.shape === state.shape;
      b.className = 'shape-btn px-2.5 py-1.5 rounded-md border text-xs font-medium ' +
        (on ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-stone-300 bg-white');
    });
    state.verts = rectFor(state.targetAc, state.shape);
    fit();
    draw();
  });
  document.getElementById('fit-btn').addEventListener('click', () => { fit(); draw(); });
  document.getElementById('clear-uses').addEventListener('click', () => {
    state.stamps = [];
    state.selected = null;
    inspectStamp(null);
    draw();
  });
  document.getElementById('ins-remove').addEventListener('click', () => {
    state.stamps = state.stamps.filter(s => s.id !== state.selected);
    state.selected = null;
    inspectStamp(null);
    draw();
  });

  renderPalette();
  const restored = load();
  document.getElementById('acres').value = state.targetAc;
  document.querySelectorAll('.shape-btn').forEach(b => {
    const on = b.dataset.shape === state.shape;
    b.className = 'shape-btn px-2.5 py-1.5 rounded-md border text-xs font-medium ' +
      (on ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-stone-300 bg-white');
  });
  if (!restored) state.verts = rectFor(state.targetAc, state.shape);
  requestAnimationFrame(() => { fit(); draw(); });
  window.addEventListener('resize', () => draw());
})();
