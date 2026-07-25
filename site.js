/* Tractform — compact location control in header */
(function () {
  const STORAGE_KEY = 'tractform_location';

  const ZONES = [
    '1a','1b','2a','2b','3a','3b','4a','4b','5a','5b',
    '6a','6b','7a','7b','8a','8b','9a','9b','10a','10b',
    '11a','11b','12a','12b','13a','13b'
  ];

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('tractform:location', { detail: data }));
    updateTabLabel();
  }

  function getLocation() { return load(); }

  function zoneNumber(z) {
    if (!z) return null;
    const n = parseInt(String(z).replace(/[ab]/i, ''), 10);
    return Number.isFinite(n) ? n : null;
  }

  function zoneInRange(zone, min, max) {
    const n = zoneNumber(zone);
    if (n == null) return null;
    return n >= min && n <= max;
  }

  function normalizeZone(raw) {
    if (!raw) return '';
    const s = String(raw).trim().toLowerCase();
    const m = s.match(/(\d{1,2})\s*([ab])?/i);
    if (!m) return '';
    const num = parseInt(m[1], 10);
    const letter = (m[2] || 'a').toLowerCase();
    const z = num + letter;
    return ZONES.includes(z) ? z : (ZONES.includes(num + 'a') ? num + 'a' : '');
  }

  /** Lookup USDA zone from ZIP via phzmapi.org (browser-side). */
  async function zoneFromZip(zip) {
    const clean = String(zip).replace(/\D/g, '').slice(0, 5);
    if (clean.length !== 5) return null;
    try {
      const res = await fetch('https://phzmapi.org/' + clean + '.json', { mode: 'cors' });
      if (!res.ok) return null;
      const json = await res.json();
      // API shapes vary: { zone: "8a" } or { hardiness_zone: "8a" }
      const raw = json.zone || json.hardiness_zone || json.usda_zone || json.Zone;
      return normalizeZone(raw);
    } catch {
      return null;
    }
  }

  function updateTabLabel() {
    const loc = load();
    const label = document.getElementById('tf-tab-label');
    if (!label) return;
    if (loc.zone) {
      label.textContent = 'Zone ' + loc.zone;
    } else {
      label.textContent = 'Location';
    }
  }

  function mount() {
    const headerInner = document.querySelector('header > div');
    if (!headerInner || document.getElementById('tf-loc-wrap')) return;

    const loc = load();
    const options = ZONES.map(z =>
      '<option value="' + z + '"' + (loc.zone === z ? ' selected' : '') + '>' + z + '</option>'
    ).join('');

    const wrap = document.createElement('div');
    wrap.id = 'tf-loc-wrap';
    wrap.className = 'relative ml-auto flex items-center';
    wrap.innerHTML =
      '<button type="button" id="tf-loc-tab" class="flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 text-emerald-800" aria-hidden="true">' +
          '<path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.017.007.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" />' +
        '</svg>' +
        '<span id="tf-tab-label">Location</span>' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 text-stone-400">' +
          '<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />' +
        '</svg>' +
      '</button>' +
      '<div id="tf-loc-panel" class="hidden absolute right-0 top-full mt-2 w-72 rounded-xl border border-stone-200 bg-white shadow-lg p-4 z-50">' +
        '<p class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Your place</p>' +
        '<label class="block text-xs text-stone-500 mb-1">City or ZIP</label>' +
        '<input id="tf-place" type="text" placeholder="76234 or Decatur, TX" ' +
          'class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700" />' +
        '<p id="tf-lookup-status" class="text-xs text-stone-400 mb-3 min-h-[1rem]"></p>' +
        '<label class="block text-xs text-stone-500 mb-1">USDA hardiness zone</label>' +
        '<select id="tf-zone" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700">' +
          '<option value="">Select…</option>' + options +
        '</select>' +
        '<p class="text-xs text-stone-400 mt-2">ZIP fills zone automatically when possible. You can override.</p>' +
      '</div>';

    // Put control on the far right of the header row
    headerInner.classList.add('gap-4');
    headerInner.appendChild(wrap);

    const tab = document.getElementById('tf-loc-tab');
    const panel = document.getElementById('tf-loc-panel');
    const placeInput = document.getElementById('tf-place');
    const zoneSelect = document.getElementById('tf-zone');
    const statusEl = document.getElementById('tf-lookup-status');

    placeInput.value = loc.place || '';
    if (loc.zone) zoneSelect.value = loc.zone;
    updateTabLabel();

    function toggle(open) {
      const show = open === undefined ? panel.classList.contains('hidden') : open;
      panel.classList.toggle('hidden', !show);
    }

    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) toggle(false);
    });

    function persist() {
      save({
        place: (placeInput.value || '').trim(),
        zone: zoneSelect.value || ''
      });
    }

    zoneSelect.addEventListener('change', () => {
      statusEl.textContent = zoneSelect.value ? 'Zone set manually' : '';
      persist();
    });

    let lookupTimer;
    async function tryLookup() {
      const raw = (placeInput.value || '').trim();
      const zipMatch = raw.match(/\b(\d{5})\b/);
      if (!zipMatch) {
        persist();
        return;
      }
      const zip = zipMatch[1];
      statusEl.textContent = 'Looking up zone…';
      const z = await zoneFromZip(zip);
      if (z) {
        zoneSelect.value = z;
        statusEl.textContent = 'Zone ' + z + ' from ZIP ' + zip;
      } else {
        statusEl.textContent = 'Couldn’t auto-detect — pick a zone';
      }
      persist();
    }

    placeInput.addEventListener('input', () => {
      clearTimeout(lookupTimer);
      lookupTimer = setTimeout(tryLookup, 500);
    });
    placeInput.addEventListener('change', tryLookup);
    placeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        tryLookup();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.TractformLocation = {
    get: getLocation,
    zoneNumber,
    zoneInRange,
    onChange(fn) {
      window.addEventListener('tractform:location', (e) => fn(e.detail));
    }
  };
})();
