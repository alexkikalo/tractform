/* Tractform — shared homestead plan + cart drawer
   Persists across pages in localStorage. Pages write slices; the cart reads them.
*/
(function () {
  const STORAGE_KEY = 'tractform_plan';
  const EVENT = 'tractform:plan';

  const LAND_ACRES = {
    homesite: { small: 0.5, medium: 1, large: 2 },
    garden: { small: 0.05, medium: 0.25, large: 0.75 },
    orchard: { small: 0.15, medium: 0.5, large: 2 },
    poultry: { small: 0.05, medium: 0.2, large: 0.75 },
    pasture: { small: 2, medium: 8, large: 25 },
    hay: { small: 2, medium: 5, large: 15 },
    woodlot: { small: 1, medium: 5, large: 20 },
    mixed: { small: 0.5, medium: 1.5, large: 3 }
  };
  const LAND_SHORT = {
    homesite: 'Homesite', garden: 'Garden', orchard: 'Orchard', poultry: 'Poultry',
    pasture: 'Pasture', hay: 'Hay', woodlot: 'Woodlot', mixed: 'Buffer'
  };
  const BUILDING_NAMES = {
    house: 'House / cabin', barn: 'Barn / shop', coop: 'Chicken coop', shed: 'Shed / lean-to'
  };
  const GARDEN_NAMES = {
    kitchen: 'Kitchen garden', calorie: 'Calorie crops', orchard: 'Orchard', market: 'Market garden'
  };
  const STYLE_NAMES = {
    stick: 'Stick-frame', cabin: 'Simple cabin', barndominium: 'Barndominium',
    pole: 'Pole barn', rigid: 'Rigid-frame metal', postbeam: 'Post-and-beam',
    static: 'Fixed coop + run', tractor: 'Chicken tractor', 'tractor-barn': 'Mini barn coop',
    skid: 'Skid shed', leanto: 'Lean-to', slab: 'Slab shed'
  };

  function emptyPlan() {
    return {
      v: 1,
      people: 4,
      acresOnHand: null,
      land: null,
      livestock: [],
      buildings: [],
      gardens: [],
      utilities: { livestockWater: 'small', irrigation: 'garden' }
    };
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return emptyPlan();
      const base = emptyPlan();
      return Object.assign({}, base, raw, {
        livestock: Array.isArray(raw.livestock) ? raw.livestock : [],
        buildings: Array.isArray(raw.buildings) ? raw.buildings : [],
        gardens: Array.isArray(raw.gardens) ? raw.gardens : [],
        utilities: Object.assign({}, base.utilities, raw.utilities || {})
      });
    } catch (e) {
      return emptyPlan();
    }
  }

  function save(next) {
    const plan = Object.assign({}, emptyPlan(), next, { v: 1, updatedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: plan }));
    updateBadge();
    renderDrawer();
    return plan;
  }

  function patch(partial) {
    return save(Object.assign({}, load(), partial));
  }

  function itemCount(plan) {
    const p = plan || load();
    return (p.land ? 1 : 0) + p.livestock.length + p.buildings.length + p.gardens.length;
  }

  function landAcresFromMix(land) {
    if (!land || !Array.isArray(land.activities) || !land.activities.length) return 0;
    if (window.TractformLand && window.TractformLand.calculate) {
      const loc = window.TractformLocation ? window.TractformLocation.get() : {};
      const r = window.TractformLand.calculate({
        activities: land.activities,
        setting: land.setting || 'mixed',
        market: land.market || 'homestead',
        city: loc.city || '',
        stateCode: loc.state || null,
        zip: loc.zip || '',
        place: loc.place || '',
        zone: loc.zone || null
      });
      return r.totalAcres || 0;
    }
    var sum = 0;
    land.activities.forEach(function (a) {
      var scales = LAND_ACRES[a.id];
      if (scales) sum += scales[a.scale] || scales.medium || 0;
    });
    var hasBuffer = land.activities.some(function (a) { return a.id === 'mixed'; });
    if (!hasBuffer) sum += Math.max(0.25, +(sum * 0.1).toFixed(2));
    return +sum.toFixed(2);
  }

  function livestockTotals(plan) {
    var out = { landAcres: 0, waterGal: 0, laborMin: 0, shelterSqFt: 0 };
    (plan.livestock || []).forEach(function (row) {
      var snap = row;
      if (window.TractformLivestock && window.TractformLivestock.calculate) {
        var loc = window.TractformLocation ? window.TractformLocation.get() : {};
        var r = window.TractformLivestock.calculate({
          animal: row.animal, breed: row.breed, quantity: row.quantity, zone: loc.zone || null
        });
        if (r) snap = r;
      }
      out.landAcres += Number(snap.landAcres) || 0;
      out.waterGal += Number(snap.waterGal) || 0;
      out.laborMin += Number(snap.laborMin) || 0;
      out.shelterSqFt += Number(snap.shelterSqFt) || 0;
    });
    return out;
  }

  function utilityWater(plan) {
    var people = Math.max(1, Number(plan.people) || 1);
    var gal = people * 75;
    var live = (plan.utilities && plan.utilities.livestockWater) || 'none';
    var irrig = (plan.utilities && plan.utilities.irrigation) || 'none';
    if (live === 'small') gal += 40;
    if (live === 'cattle') gal += 200;
    if (irrig === 'garden') gal += 50;
    if (irrig === 'field') gal += 300;
    var liveTot = livestockTotals(plan);
    if (liveTot.waterGal) gal = people * 75 + liveTot.waterGal + (irrig === 'garden' ? 50 : irrig === 'field' ? 300 : 0);
    return gal;
  }

  function summarize(plan) {
    var p = plan || load();
    var loc = window.TractformLocation ? window.TractformLocation.get() : {};
    var landAcres = landAcresFromMix(p.land);
    var live = livestockTotals(p);
    var gardenSq = (p.gardens || []).reduce(function (s, g) { return s + (Number(g.area) || 0); }, 0);
    return {
      count: itemCount(p),
      place: window.TractformLocation ? window.TractformLocation.displayPlace(loc) : (loc.place || ''),
      zone: loc.zone || '',
      people: p.people,
      acresOnHand: p.acresOnHand,
      landAcres: landAcres,
      livestockLand: +live.landAcres.toFixed(2),
      waterGal: Math.round(utilityWater(p)),
      laborMin: Math.round(live.laborMin),
      shelterSqFt: Math.round(live.shelterSqFt),
      gardenSq: gardenSq
    };
  }

  function addLivestock(entry) {
    var plan = load();
    var animal = entry.animal;
    var breed = entry.breed;
    var quantity = Math.max(1, parseInt(entry.quantity, 10) || 1);
    var extra = {};
    if (window.TractformLivestock && window.TractformLivestock.calculate) {
      var loc = window.TractformLocation ? window.TractformLocation.get() : {};
      var r = window.TractformLivestock.calculate({ animal: animal, breed: breed, quantity: quantity, zone: loc.zone || null });
      if (r) {
        extra = {
          animalName: r.animalName,
          breedName: r.breedName,
          landAcres: r.landAcres,
          waterGal: r.waterGal,
          laborMin: r.laborMin,
          shelterSqFt: r.shelterSqFt,
          landLabel: r.landLabel,
          waterLabel: r.waterLabel,
          laborLabel: r.laborLabel
        };
      }
    }
    var id = animal + ':' + breed;
    var next = plan.livestock.filter(function (row) { return row.id !== id; });
    next.push({
      id: id, animal: animal, breed: breed, quantity: quantity,
      animalName: extra.animalName || entry.animalName || animal,
      breedName: extra.breedName || entry.breedName || breed,
      landAcres: extra.landAcres,
      waterGal: extra.waterGal,
      laborMin: extra.laborMin,
      shelterSqFt: extra.shelterSqFt,
      landLabel: extra.landLabel,
      waterLabel: extra.waterLabel,
      laborLabel: extra.laborLabel
    });
    return patch({ livestock: next });
  }

  function addBuilding(entry) {
    var plan = load();
    var type = entry.type;
    var style = entry.style;
    var sqft = Math.max(40, parseInt(entry.sqft, 10) || 0);
    var id = type + ':' + style;
    var next = plan.buildings.filter(function (row) { return row.id !== id; });
    next.push({
      id: id, type: type, style: style, sqft: sqft,
      typeName: BUILDING_NAMES[type] || type,
      styleName: STYLE_NAMES[style] || style
    });
    return patch({ buildings: next });
  }

  function addGarden(entry) {
    var plan = load();
    var focus = entry.focus;
    var area = Math.max(50, parseInt(entry.area, 10) || 0);
    var water = entry.water || 'drip';
    var next = plan.gardens.filter(function (row) { return row.focus !== focus; });
    next.push({ id: focus, focus: focus, area: area, water: water, name: GARDEN_NAMES[focus] || focus });
    return patch({ gardens: next });
  }

  function setLand(land) {
    return patch({ land: land && land.activities && land.activities.length ? land : null });
  }

  function remove(kind, id) {
    var plan = load();
    if (kind === 'land') return patch({ land: null });
    if (kind === 'livestock') return patch({ livestock: plan.livestock.filter(function (r) { return r.id !== id; }) });
    if (kind === 'building') return patch({ buildings: plan.buildings.filter(function (r) { return r.id !== id; }) });
    if (kind === 'garden') return patch({ gardens: plan.gardens.filter(function (r) { return r.id !== id; }) });
    return plan;
  }

  function clear() { return save(emptyPlan()); }

  function fmtAcres(n) {
    if (n == null || !isFinite(n)) return '—';
    if (n < 1) return Math.round(n * 43560).toLocaleString() + ' sq ft';
    return (+n).toFixed(n >= 10 ? 0 : 1) + ' ac';
  }

  function laborLabel(min) {
    if (!min) return '—';
    if (min < 60) return '~' + Math.round(min) + ' min/day';
    return '~' + (min / 60).toFixed(1) + ' hr/day';
  }

  function toast(msg) {
    var el = document.getElementById('tf-plan-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tf-plan-toast';
      el.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] hidden rounded-full bg-emerald-900 text-white text-sm px-4 py-2 shadow-lg';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.add('hidden'); }, 1600);
  }

  function updateBadge() {
    var n = itemCount();
    var badge = document.getElementById('tf-plan-badge');
    if (!badge) return;
    badge.textContent = String(n);
    badge.classList.toggle('hidden', n === 0);
  }

  function setOpen(open) {
    var drawer = document.getElementById('tf-plan-drawer');
    var overlay = document.getElementById('tf-plan-overlay');
    if (!drawer || !overlay) return;
    drawer.classList.toggle('translate-x-full', !open);
    overlay.classList.toggle('hidden', !open);
    overlay.classList.toggle('opacity-0', !open);
    document.body.classList.toggle('overflow-hidden', open);
    var btn = document.getElementById('tf-plan-btn');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) renderDrawer();
  }

  function lineRow(opts) {
    return '<div class="flex items-start gap-2 py-2.5 border-b border-stone-100">' +
      '<div class="min-w-0 flex-1">' +
      '<div class="text-sm font-medium text-stone-900 leading-snug">' + opts.title + '</div>' +
      (opts.meta ? '<div class="text-xs text-stone-500 mt-0.5">' + opts.meta + '</div>' : '') +
      '</div>' +
      (opts.right ? '<div class="text-xs tabular-nums text-stone-600 shrink-0 pt-0.5">' + opts.right + '</div>' : '') +
      '<button type="button" class="tf-plan-remove text-stone-400 hover:text-red-600 shrink-0" data-kind="' + opts.kind + '" data-id="' + (opts.id || '') + '" aria-label="Remove">×</button>' +
      '</div>';
  }

  function renderDrawer() {
    var body = document.getElementById('tf-plan-body');
    if (!body) return;
    var plan = load();
    var sum = summarize(plan);
    var loc = window.TractformLocation ? window.TractformLocation.get() : {};
    var people = document.getElementById('tf-plan-people');
    var acres = document.getElementById('tf-plan-acres');
    if (people && document.activeElement !== people) people.value = plan.people || 4;
    if (acres && document.activeElement !== acres) acres.value = plan.acresOnHand != null ? plan.acresOnHand : '';
    var placeEl = document.getElementById('tf-plan-place');
    if (placeEl) {
      var label = sum.place ? sum.place + (sum.zone ? ' · Z ' + sum.zone : '') : (sum.zone ? 'Zone ' + sum.zone : 'Set place in the header');
      placeEl.textContent = label;
    }
    var html = '';
    if (!plan.land && !plan.livestock.length && !plan.buildings.length && !plan.gardens.length) {
      html += '<p class="text-sm text-stone-500 py-6">Plan is empty. Add a land mix, animals, buildings, or a garden from those pages.</p>';
    } else {
      if (plan.land && plan.land.activities) {
        html += '<p class="text-[10px] uppercase tracking-wide font-semibold text-emerald-800 pt-1">Land</p>';
        var bits = plan.land.activities.map(function (a) {
          return (LAND_SHORT[a.id] || a.id) + ' · ' + (a.scale || 'medium');
        }).join(', ');
        html += lineRow({ kind: 'land', id: 'land', title: 'Activity mix', meta: bits, right: fmtAcres(sum.landAcres) });
      }
      if (plan.livestock.length) {
        html += '<p class="text-[10px] uppercase tracking-wide font-semibold text-emerald-800 pt-3">Livestock</p>';
        plan.livestock.forEach(function (row) {
          html += lineRow({ kind: 'livestock', id: row.id, title: row.quantity + ' × ' + (row.breedName || row.breed), meta: row.animalName || row.animal, right: row.landLabel || fmtAcres(row.landAcres) });
        });
      }
      if (plan.buildings.length) {
        html += '<p class="text-[10px] uppercase tracking-wide font-semibold text-emerald-800 pt-3">Buildings</p>';
        plan.buildings.forEach(function (row) {
          html += lineRow({ kind: 'building', id: row.id, title: row.typeName || BUILDING_NAMES[row.type] || row.type, meta: (row.styleName || row.style) + ' · ' + Number(row.sqft).toLocaleString() + ' sq ft' });
        });
      }
      if (plan.gardens.length) {
        html += '<p class="text-[10px] uppercase tracking-wide font-semibold text-emerald-800 pt-3">Gardens</p>';
        plan.gardens.forEach(function (row) {
          html += lineRow({ kind: 'garden', id: row.id, title: row.name || GARDEN_NAMES[row.focus] || row.focus, meta: Number(row.area).toLocaleString() + ' sq ft · ' + row.water });
        });
      }
    }
    body.innerHTML = html;
    body.querySelectorAll('.tf-plan-remove').forEach(function (btn) {
      btn.addEventListener('click', function () { remove(btn.dataset.kind, btn.dataset.id); });
    });
    var rec = document.getElementById('tf-plan-rec');
    var waterEl = document.getElementById('tf-plan-water');
    var labor = document.getElementById('tf-plan-labor');
    var fit = document.getElementById('tf-plan-fit');
    if (rec) rec.textContent = sum.landAcres ? fmtAcres(sum.landAcres) : '—';
    if (waterEl) waterEl.textContent = sum.waterGal ? '~' + sum.waterGal + ' gal/day' : '—';
    if (labor) labor.textContent = laborLabel(sum.laborMin);
    if (fit) {
      if (sum.acresOnHand != null && sum.landAcres) {
        var delta = +(sum.acresOnHand - sum.landAcres).toFixed(2);
        if (delta >= 0) {
          fit.textContent = sum.acresOnHand + ' ac on hand covers the mix (+' + delta + ' ac).';
          fit.className = 'text-xs text-emerald-800 leading-relaxed';
        } else {
          fit.textContent = sum.acresOnHand + ' ac on hand is short by ' + Math.abs(delta) + ' ac.';
          fit.className = 'text-xs text-amber-800 leading-relaxed';
        }
      } else if (sum.acresOnHand != null && sum.livestockLand) {
        var d2 = +(sum.acresOnHand - sum.livestockLand).toFixed(2);
        fit.textContent = d2 >= 0
          ? sum.acresOnHand + ' ac covers livestock land (+' + d2 + ' ac). Add a land mix for the full lot.'
          : 'Livestock alone wants ~' + sum.livestockLand + ' ac; you have ' + sum.acresOnHand + ' ac.';
        fit.className = 'text-xs text-stone-600 leading-relaxed';
      } else {
        fit.textContent = loc.state || loc.zone ? 'Add a land mix to see recommended lot size.' : 'Set a place, then add land or livestock.';
        fit.className = 'text-xs text-stone-500 leading-relaxed';
      }
    }
    updateBadge();
  }

  function mountCart() {
    if (document.getElementById('tf-plan-btn')) { updateBadge(); return; }
    var headerInner = document.querySelector('header > div');
    if (!headerInner) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'tf-plan-btn';
    btn.setAttribute('aria-label', 'Open plan');
    btn.setAttribute('aria-expanded', 'false');
    btn.className = 'relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/25 bg-white/10 text-white hover:bg-white/20 transition shrink-0';
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M1 1.75A.75.75 0 011.75 1h1.628a1.75 1.75 0 011.734 1.51L5.18 5.5h12.07a.75.75 0 01.73.93l-1.7 6.8A1.75 1.75 0 0114.57 14.5H7.43a1.75 1.75 0 01-1.71-1.27L3.04 3.52a.25.25 0 00-.247-.216H1.75A.75.75 0 011 2.554V1.75zM6.5 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/></svg><span id="tf-plan-badge" class="hidden absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-bold leading-[1.1rem] text-center">0</span>';
    var cluster = document.getElementById('tf-header-actions');
    var locWrap = document.getElementById('tf-loc-wrap');
    if (cluster) cluster.insertBefore(btn, locWrap || cluster.firstChild);
    else if (locWrap) headerInner.insertBefore(btn, locWrap);
    else headerInner.appendChild(btn);
    var overlay = document.createElement('div');
    overlay.id = 'tf-plan-overlay';
    overlay.className = 'hidden fixed inset-0 bg-stone-900/40 z-[70] opacity-0 transition-opacity';
    var drawer = document.createElement('aside');
    drawer.id = 'tf-plan-drawer';
    drawer.className = 'fixed top-0 right-0 h-full w-[22rem] max-w-[calc(100vw-1.25rem)] bg-white text-stone-900 z-[71] shadow-2xl translate-x-full transition-transform duration-200 flex flex-col';
    drawer.innerHTML = '<div class="h-14 px-4 border-b border-stone-200 flex items-center justify-between shrink-0"><div><p class="text-sm font-semibold text-emerald-950">Your plan</p><p id="tf-plan-place" class="text-[11px] text-stone-500">Set place in the header</p></div><button type="button" id="tf-plan-close" class="w-8 h-8 rounded-lg text-stone-500 hover:bg-stone-100" aria-label="Close plan">×</button></div><div class="px-4 py-3 border-b border-stone-100 grid grid-cols-2 gap-2 shrink-0"><label class="block"><span class="block text-[11px] text-stone-500 mb-1">People</span><input id="tf-plan-people" type="number" min="1" max="20" class="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm" /></label><label class="block"><span class="block text-[11px] text-stone-500 mb-1">Acres on hand</span><input id="tf-plan-acres" type="number" min="0" step="0.1" placeholder="Optional" class="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm" /></label></div><div id="tf-plan-body" class="flex-1 overflow-y-auto px-4 py-2"></div><div class="border-t border-stone-200 px-4 py-3 space-y-2 shrink-0 bg-stone-50"><div class="flex justify-between text-sm"><span class="text-stone-500">Recommended lot</span><span id="tf-plan-rec" class="font-medium tabular-nums">—</span></div><div class="flex justify-between text-sm"><span class="text-stone-500">Peak water</span><span id="tf-plan-water" class="font-medium tabular-nums">—</span></div><div class="flex justify-between text-sm"><span class="text-stone-500">Chore time</span><span id="tf-plan-labor" class="font-medium tabular-nums">—</span></div><p id="tf-plan-fit" class="text-xs text-stone-500 leading-relaxed"></p><a href="/plan.html" class="block text-center rounded-lg bg-emerald-800 text-white text-sm font-medium py-2.5 hover:bg-emerald-900">View full plan</a></div>';
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(true); });
    overlay.addEventListener('click', function () { setOpen(false); });
    document.getElementById('tf-plan-close').addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    document.getElementById('tf-plan-people').addEventListener('change', function (e) {
      patch({ people: Math.max(1, parseInt(e.target.value, 10) || 1) });
    });
    document.getElementById('tf-plan-acres').addEventListener('change', function (e) {
      var raw = e.target.value;
      patch({ acresOnHand: raw === '' ? null : Math.max(0, parseFloat(raw)) });
    });
    window.addEventListener(EVENT, renderDrawer);
    if (window.TractformLocation) window.TractformLocation.onChange(renderDrawer);
    updateBadge();
    renderDrawer();
  }

  window.TractformPlan = {
    get: load,
    patch: patch,
    setLand: setLand,
    addLivestock: addLivestock,
    addBuilding: addBuilding,
    addGarden: addGarden,
    remove: remove,
    clear: clear,
    summarize: summarize,
    count: itemCount,
    toast: toast,
    open: function () { setOpen(true); },
    mount: mountCart,
    LAND_SHORT: LAND_SHORT,
    BUILDING_NAMES: BUILDING_NAMES,
    GARDEN_NAMES: GARDEN_NAMES,
    STYLE_NAMES: STYLE_NAMES
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountCart);
  else mountCart();
})();
