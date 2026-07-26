/* Tractform — shared site controls

   - Location: By place (city+state → ZIP → zone) or Zone only
   - Mobile nav: hamburger left of location chip
*/
(function () {
  const STORAGE_KEY = 'tractform_location';

  const NAV_LINKS = [
    { href: '/land.html', label: 'Land' },
    { href: '/utilities.html', label: 'Utilities' },
    { href: '/buildings.html', label: 'Buildings' },
    { href: '/production.html', label: 'Livestock' },
    { href: '/gardens.html', label: 'Gardens' },
    { href: '/family.html', label: 'Household' }
  ];

  const ZONES = [
    '1a','1b','2a','2b','3a','3b','4a','4b','5a','5b',
    '6a','6b','7a','7b','8a','8b','9a','9b','10a','10b',
    '11a','11b','12a','12b','13a','13b'
  ];

  const STATES = [
    ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
    ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
    ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
    ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
    ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
    ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
    ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
    ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
    ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
    ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']
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

  function getLocation() {
    const d = load();
    if (d.place && !d.state) {
      const m = String(d.place).match(/,\s*([A-Za-z]{2})\s*$/);
      if (m) {
        d.state = m[1].toUpperCase();
        d.city = String(d.place).replace(/,\s*[A-Za-z]{2}\s*$/, '').trim();
      } else {
        d.city = d.place;
      }
    }
    if (!d.mode) {
      d.mode = (d.city || d.state || d.zip) ? 'place' : (d.zone ? 'zone' : 'place');
    }
    return d;
  }

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

  async function zoneFromZip(zip) {
    const clean = String(zip).replace(/\D/g, '').slice(0, 5);
    if (clean.length !== 5) return null;
    try {
      const res = await fetch('https://phzmapi.org/' + clean + '.json', { mode: 'cors' });
      if (!res.ok) return null;
      const json = await res.json();
      const raw = json.zone || json.hardiness_zone || json.usda_zone || json.Zone;
      return normalizeZone(raw);
    } catch {
      return null;
    }
  }

  async function placeFromZip(zip) {
    const clean = String(zip).replace(/\D/g, '').slice(0, 5);
    if (clean.length !== 5) return null;
    try {
      const res = await fetch('https://api.zippopotam.us/us/' + clean, { mode: 'cors' });
      if (!res.ok) return null;
      const data = await res.json();
      const st = (data['state abbreviation'] || '').toUpperCase();
      const places = data.places || [];
      const city = places[0] ? places[0]['place name'] : '';
      return {
        state: STATES.some(([c]) => c === st) ? st : null,
        city: city || ''
      };
    } catch {
      return null;
    }
  }

  async function zipFromCityState(city, state) {
    const c = String(city || '').trim().toLowerCase();
    const st = String(state || '').trim().toLowerCase();
    if (!c || !st || st.length !== 2) return null;
    try {
      const res = await fetch(
        'https://api.zippopotam.us/us/' + encodeURIComponent(st) + '/' + encodeURIComponent(c),
        { mode: 'cors' }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const places = data.places || [];
      if (!places.length) return null;
      return String(places[0]['post code'] || '').replace(/\D/g, '').slice(0, 5) || null;
    } catch {
      return null;
    }
  }

  function displayPlace(loc) {
    const city = (loc.city || '').trim();
    const state = (loc.state || '').trim();
    if (city && state) return city + ', ' + state;
    if (state) return state;
    if (city) return city;
    if (loc.place) return loc.place;
    return '';
  }

  function updateTabLabel() {
    const loc = getLocation();
    const label = document.getElementById('tf-tab-label');
    if (!label) return;
    // Compact on narrow screens: prefer short zone/state labels
    if (loc.mode === 'zone' && loc.zone) label.textContent = 'Z ' + loc.zone;
    else if (loc.zone && loc.state) label.textContent = loc.state + ' · ' + loc.zone;
    else if (loc.state) label.textContent = loc.state;
    else if (loc.zone) label.textContent = 'Z ' + loc.zone;
    else label.textContent = 'Place';
  }

  function currentPath() {
    let p = (location.pathname || '/').replace(/\/+$/, '');
    if (!p) p = '/';
    return p;
  }

  function isActiveHref(href) {
    const path = currentPath();
    if (href === '/') return path === '/' || path === '/index.html';
    return path === href || path.endsWith(href);
  }

  /* ---- Mobile hamburger (sits left of location chip) ---- */
  function mountMobileNav() {
    const header = document.querySelector('header');
    const headerInner = document.querySelector('header > div');
    const locWrap = document.getElementById('tf-loc-wrap');
    if (!header || !headerInner || document.getElementById('tf-menu-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'tf-menu-btn';
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.className =
      'sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/25 bg-white/10 text-white hover:bg-white/20 transition shrink-0';
    btn.innerHTML =
      '<svg id="tf-menu-icon-open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">' +
        '<path fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clip-rule="evenodd" />' +
      '</svg>' +
      '<svg id="tf-menu-icon-close" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 hidden">' +
        '<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />' +
      '</svg>';

    // Keep menu + location as a tight right cluster
    if (locWrap) {
      locWrap.classList.remove('ml-auto');
      const cluster = document.createElement('div');
      cluster.id = 'tf-header-actions';
      cluster.className = 'ml-auto flex items-center gap-2 shrink-0';
      headerInner.insertBefore(cluster, locWrap);
      cluster.appendChild(btn);
      cluster.appendChild(locWrap);
    } else {
      btn.className += ' ml-auto';
      headerInner.appendChild(btn);
    }

    const panel = document.createElement('div');
    panel.id = 'tf-mobile-nav';
    panel.className = 'hidden sm:hidden border-t border-emerald-800/80 bg-emerald-950';
    panel.innerHTML =
      '<nav class="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">' +
      NAV_LINKS.map(function (link) {
        const active = isActiveHref(link.href);
        return (
          '<a href="' + link.href + '" class="rounded-lg px-3 py-2.5 text-sm font-medium ' +
          (active ? 'bg-white/15 text-white' : 'text-emerald-100/90 hover:bg-white/10 hover:text-white') +
          '">' + link.label + '</a>'
        );
      }).join('') +
      '</nav>';

    header.appendChild(panel);

    function setOpen(open) {
      panel.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      const openIcon = document.getElementById('tf-menu-icon-open');
      const closeIcon = document.getElementById('tf-menu-icon-close');
      if (openIcon) openIcon.classList.toggle('hidden', open);
      if (closeIcon) closeIcon.classList.toggle('hidden', !open);
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(panel.classList.contains('hidden'));
    });

    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) setOpen(false);
    });

    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
  }

  /* ---- Location control ---- */
  function mountLocation() {
    const headerInner = document.querySelector('header > div');
    if (!headerInner || document.getElementById('tf-loc-wrap')) return;

    const loc = getLocation();
    const zoneOptions = ZONES.map(z =>
      '<option value="' + z + '">' + z + '</option>'
    ).join('');
    const stateOptions = STATES.map(([code, name]) =>
      '<option value="' + code + '">' + code + ' — ' + name + '</option>'
    ).join('');

    const wrap = document.createElement('div');
    wrap.id = 'tf-loc-wrap';
    wrap.className = 'relative flex items-center shrink-0';
    wrap.innerHTML =
      '<button type="button" id="tf-loc-tab" class="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 pl-2.5 pr-2.5 sm:px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition max-w-[9.5rem] sm:max-w-none">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 text-emerald-200 shrink-0" aria-hidden="true">' +
          '<path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.017.007.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" />' +
        '</svg>' +
        '<span id="tf-tab-label" class="truncate">Place</span>' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 text-emerald-200/80 shrink-0 hidden sm:block">' +
          '<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />' +
        '</svg>' +
      '</button>' +
      '<div id="tf-loc-panel" class="hidden absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-stone-200 bg-white shadow-lg p-4 z-50 text-stone-900">' +
        '<p class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Location</p>' +
        '<div class="flex rounded-lg border border-stone-200 p-0.5 mb-3 text-xs font-medium">' +
          '<button type="button" id="tf-mode-place" class="flex-1 rounded-md px-2 py-1.5 transition">By place</button>' +
          '<button type="button" id="tf-mode-zone" class="flex-1 rounded-md px-2 py-1.5 transition">Zone only</button>' +
        '</div>' +
        '<div id="tf-place-fields">' +
          '<div class="grid grid-cols-3 gap-2 mb-2">' +
            '<div class="col-span-2">' +
              '<label class="block text-xs text-stone-500 mb-1">City</label>' +
              '<input id="tf-city" type="text" autocomplete="address-level2" ' +
                'class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700" />' +
            '</div>' +
            '<div>' +
              '<label class="block text-xs text-stone-500 mb-1">State</label>' +
              '<select id="tf-state" class="w-full rounded-lg border border-stone-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700">' +
                '<option value="">—</option>' + stateOptions +
              '</select>' +
            '</div>' +
          '</div>' +
          '<label class="block text-xs text-stone-500 mb-1">ZIP</label>' +
          '<input id="tf-zip" type="text" inputmode="numeric" maxlength="10" autocomplete="postal-code" ' +
            'class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700" />' +
        '</div>' +
        '<label class="block text-xs text-stone-500 mb-1">USDA hardiness zone</label>' +
        '<select id="tf-zone" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700">' +
          '<option value="">—</option>' + zoneOptions +
        '</select>' +
        '<p id="tf-lookup-status" class="text-xs text-stone-400 mt-2 min-h-[1rem]"></p>' +
        '<p id="tf-mode-hint" class="text-xs text-stone-400 mt-1"></p>' +
      '</div>';

    headerInner.classList.add('gap-3');
    headerInner.appendChild(wrap);

    const tab = document.getElementById('tf-loc-tab');
    const panel = document.getElementById('tf-loc-panel');
    const cityInput = document.getElementById('tf-city');
    const stateSelect = document.getElementById('tf-state');
    const zipInput = document.getElementById('tf-zip');
    const zoneSelect = document.getElementById('tf-zone');
    const statusEl = document.getElementById('tf-lookup-status');
    const hintEl = document.getElementById('tf-mode-hint');
    const modePlaceBtn = document.getElementById('tf-mode-place');
    const modeZoneBtn = document.getElementById('tf-mode-zone');
    const placeFields = document.getElementById('tf-place-fields');

    let mode = loc.mode === 'zone' ? 'zone' : 'place';
    let lookupSeq = 0;

    cityInput.value = loc.city || '';
    if (loc.state) stateSelect.value = loc.state;
    zipInput.value = loc.zip || '';
    if (loc.zone) zoneSelect.value = loc.zone;

    function setModeUI() {
      const placeOn = mode === 'place';
      modePlaceBtn.className = placeOn
        ? 'flex-1 rounded-md px-2 py-1.5 transition bg-emerald-800 text-white'
        : 'flex-1 rounded-md px-2 py-1.5 transition text-stone-600 hover:bg-stone-50';
      modeZoneBtn.className = !placeOn
        ? 'flex-1 rounded-md px-2 py-1.5 transition bg-emerald-800 text-white'
        : 'flex-1 rounded-md px-2 py-1.5 transition text-stone-600 hover:bg-stone-50';

      placeFields.style.opacity = placeOn ? '1' : '0.45';
      cityInput.disabled = !placeOn;
      stateSelect.disabled = !placeOn;
      zipInput.disabled = !placeOn;

      zoneSelect.disabled = placeOn;
      zoneSelect.classList.toggle('bg-stone-50', placeOn);
      zoneSelect.classList.toggle('text-stone-500', placeOn);

      hintEl.textContent = placeOn
        ? 'Zone is set from ZIP for this place — not chosen separately.'
        : 'Place fields are cleared. Pick a zone only.';
    }

    function persist() {
      if (mode === 'zone') {
        const zone = zoneSelect.value || '';
        save({ mode: 'zone', city: '', state: '', zip: '', zone, place: '' });
        return;
      }
      const city = (cityInput.value || '').trim();
      const state = (stateSelect.value || '').trim().toUpperCase();
      const zip = (zipInput.value || '').replace(/\D/g, '').slice(0, 5);
      const zone = zoneSelect.value || '';
      const place = city && state ? (city + ', ' + state) : (city || state || '');
      save({ mode: 'place', city, state, zip, zone, place });
    }

    function switchMode(next) {
      if (next === mode) return;
      mode = next;
      if (mode === 'zone') {
        cityInput.value = '';
        stateSelect.value = '';
        zipInput.value = '';
        statusEl.textContent = '';
      } else {
        if (!zipInput.value) zoneSelect.value = '';
        statusEl.textContent = '';
      }
      setModeUI();
      persist();
    }

    modePlaceBtn.addEventListener('click', () => switchMode('place'));
    modeZoneBtn.addEventListener('click', () => switchMode('zone'));

    function toggle(open) {
      const show = open === undefined ? panel.classList.contains('hidden') : open;
      panel.classList.toggle('hidden', !show);
    }

    tab.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) toggle(false); });

    async function applyZip(zip) {
      const clean = String(zip || '').replace(/\D/g, '').slice(0, 5);
      if (clean.length !== 5) return;
      const seq = ++lookupSeq;
      statusEl.textContent = 'Looking up ZIP…';
      const [z, place] = await Promise.all([zoneFromZip(clean), placeFromZip(clean)]);
      if (seq !== lookupSeq) return;

      zipInput.value = clean;
      if (place && place.state) stateSelect.value = place.state;
      if (place && place.city && !cityInput.value.trim()) cityInput.value = place.city;
      if (z) zoneSelect.value = z;

      const parts = [];
      if (place && place.state) parts.push(place.state);
      if (z) parts.push('Zone ' + z);
      statusEl.textContent = parts.length ? parts.join(' · ') + ' from ZIP' : 'ZIP found; zone lookup failed';
      persist();
    }

    async function applyCityState() {
      if (mode !== 'place') return;
      const city = (cityInput.value || '').trim();
      const state = (stateSelect.value || '').trim();
      if (!city || !state) {
        persist();
        return;
      }
      const seq = ++lookupSeq;
      statusEl.textContent = 'Looking up place…';
      const zip = await zipFromCityState(city, state);
      if (seq !== lookupSeq) return;

      if (!zip) {
        statusEl.textContent = 'Couldn’t find a ZIP for that city — enter ZIP to set zone';
        zoneSelect.value = '';
        persist();
        return;
      }
      zipInput.value = zip;
      await applyZip(zip);
    }

    let cityTimer;
    let zipTimer;

    cityInput.addEventListener('input', () => {
      clearTimeout(cityTimer);
      cityTimer = setTimeout(applyCityState, 550);
    });
    cityInput.addEventListener('change', applyCityState);
    stateSelect.addEventListener('change', applyCityState);

    zipInput.addEventListener('input', () => {
      clearTimeout(zipTimer);
      const z = (zipInput.value || '').replace(/\D/g, '').slice(0, 5);
      if (z.length === 5) zipTimer = setTimeout(() => applyZip(z), 400);
      else persist();
    });
    zipInput.addEventListener('change', () => {
      const z = (zipInput.value || '').replace(/\D/g, '').slice(0, 5);
      if (z.length === 5) applyZip(z);
      else persist();
    });

    zoneSelect.addEventListener('change', () => {
      if (mode === 'zone') persist();
    });

    setModeUI();
    updateTabLabel();

    if (mode === 'place' && loc.zip && loc.zip.length === 5 && !loc.zone) {
      applyZip(loc.zip);
    }
  }

  function mountAll() {
    // Location first so menu can cluster left of it
    mountLocation();
    mountMobileNav();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
  else mountAll();

  window.TractformLocation = {
    get: getLocation,
    displayPlace,
    zoneNumber,
    zoneInRange,
    onChange(fn) { window.addEventListener('tractform:location', (e) => fn(e.detail)); }
  };
})();
