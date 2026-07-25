/* Tractform — compact location control in header
   City + State (required) + optional ZIP for zone lookup.
*/
(function () {
  const STORAGE_KEY = 'tractform_location';

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
    // Normalize legacy shape { place: "Decatur, TX" } into city/state if possible
    if (d.place && !d.state) {
      const m = String(d.place).match(/,\s*([A-Za-z]{2})\s*$/);
      if (m) {
        d.state = m[1].toUpperCase();
        d.city = String(d.place).replace(/,\s*[A-Za-z]{2}\s*$/, '').trim();
      } else {
        d.city = d.place;
      }
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

  async function stateFromZip(zip) {
    const clean = String(zip).replace(/\D/g, '').slice(0, 5);
    if (clean.length !== 5) return null;
    try {
      const res = await fetch('https://usps-zip-codes.deno.dev/' + clean, { mode: 'cors' });
      if (!res.ok) return null;
      const data = await res.json();
      const st = (data.state || data.State || '').toUpperCase();
      return STATES.some(([c]) => c === st) ? st : null;
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
    if (loc.zone && loc.state) label.textContent = loc.state + ' · Zone ' + loc.zone;
    else if (loc.zone) label.textContent = 'Zone ' + loc.zone;
    else if (loc.state) label.textContent = loc.state;
    else label.textContent = 'Location';
  }

  function mount() {
    const headerInner = document.querySelector('header > div');
    if (!headerInner || document.getElementById('tf-loc-wrap')) return;

    const loc = getLocation();
    const zoneOptions = ZONES.map(z =>
      '<option value="' + z + '"' + (loc.zone === z ? ' selected' : '') + '>' + z + '</option>'
    ).join('');
    const stateOptions = STATES.map(([code, name]) =>
      '<option value="' + code + '"' + (loc.state === code ? ' selected' : '') + '>' + code + ' — ' + name + '</option>'
    ).join('');

    const wrap = document.createElement('div');
    wrap.id = 'tf-loc-wrap';
    wrap.className = 'relative ml-auto flex items-center shrink-0';
    wrap.innerHTML =
      '<button type="button" id="tf-loc-tab" class="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 text-emerald-200" aria-hidden="true">' +
          '<path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.017.007.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" />' +
        '</svg>' +
        '<span id="tf-tab-label">Location</span>' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 text-emerald-200/80">' +
          '<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />' +
        '</svg>' +
      '</button>' +
      '<div id="tf-loc-panel" class="hidden absolute right-0 top-full mt-2 w-80 rounded-xl border border-stone-200 bg-white shadow-lg p-4 z-50 text-stone-900">' +
        '<p class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Your place</p>' +
        '<div class="grid grid-cols-3 gap-2 mb-3">' +
          '<div class="col-span-2">' +
            '<label class="block text-xs text-stone-500 mb-1">City</label>' +
            '<input id="tf-city" type="text" placeholder="Decatur" ' +
              'class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700" />' +
          '</div>' +
          '<div>' +
            '<label class="block text-xs text-stone-500 mb-1">State</label>' +
            '<select id="tf-state" class="w-full rounded-lg border border-stone-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700">' +
              '<option value="">—</option>' + stateOptions +
            '</select>' +
          '</div>' +
        '</div>' +
        '<label class="block text-xs text-stone-500 mb-1">ZIP <span class="font-normal">(optional — fills zone)</span></label>' +
        '<input id="tf-zip" type="text" inputmode="numeric" maxlength="10" placeholder="76234" ' +
          'class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700" />' +
        '<p id="tf-lookup-status" class="text-xs text-stone-400 mb-3 min-h-[1rem]"></p>' +
        '<label class="block text-xs text-stone-500 mb-1">USDA hardiness zone</label>' +
        '<select id="tf-zone" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700">' +
          '<option value="">Select…</option>' + zoneOptions +
        '</select>' +
        '<p class="text-xs text-stone-400 mt-2">State is required for cost estimates. ZIP can fill zone (and state) when available.</p>' +
      '</div>';

    headerInner.classList.add('gap-4');
    headerInner.appendChild(wrap);

    const tab = document.getElementById('tf-loc-tab');
    const panel = document.getElementById('tf-loc-panel');
    const cityInput = document.getElementById('tf-city');
    const stateSelect = document.getElementById('tf-state');
    const zipInput = document.getElementById('tf-zip');
    const zoneSelect = document.getElementById('tf-zone');
    const statusEl = document.getElementById('tf-lookup-status');

    cityInput.value = loc.city || '';
    if (loc.state) stateSelect.value = loc.state;
    zipInput.value = loc.zip || '';
    if (loc.zone) zoneSelect.value = loc.zone;
    updateTabLabel();

    function toggle(open) {
      const show = open === undefined ? panel.classList.contains('hidden') : open;
      panel.classList.toggle('hidden', !show);
    }

    tab.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) toggle(false); });

    function persist() {
      const city = (cityInput.value || '').trim();
      const state = (stateSelect.value || '').trim().toUpperCase();
      const zip = (zipInput.value || '').replace(/\D/g, '').slice(0, 5);
      const zone = zoneSelect.value || '';
      const place = city && state ? (city + ', ' + state) : (city || state || '');
      save({ city, state, zip, zone, place });
    }

    cityInput.addEventListener('change', persist);
    cityInput.addEventListener('blur', persist);
    stateSelect.addEventListener('change', () => {
      statusEl.textContent = stateSelect.value ? '' : 'Select a state for cost estimates';
      persist();
    });
    zoneSelect.addEventListener('change', () => {
      if (zoneSelect.value) statusEl.textContent = 'Zone set manually';
      persist();
    });

    let lookupTimer;
    async function tryZipLookup() {
      const zip = (zipInput.value || '').replace(/\D/g, '').slice(0, 5);
      if (zip.length !== 5) {
        persist();
        return;
      }
      statusEl.textContent = 'Looking up ZIP…';
      const [z, st] = await Promise.all([zoneFromZip(zip), stateFromZip(zip)]);
      const parts = [];
      if (st) {
        stateSelect.value = st;
        parts.push(st);
      }
      if (z) {
        zoneSelect.value = z;
        parts.push('Zone ' + z);
      }
      statusEl.textContent = parts.length
        ? parts.join(' · ') + ' from ZIP ' + zip
        : 'Couldn’t auto-detect — set state and zone';
      persist();
    }

    zipInput.addEventListener('input', () => {
      clearTimeout(lookupTimer);
      lookupTimer = setTimeout(tryZipLookup, 450);
    });
    zipInput.addEventListener('change', tryZipLookup);
    zipInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); tryZipLookup(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  window.TractformLocation = {
    get: getLocation,
    displayPlace,
    zoneNumber,
    zoneInRange,
    onChange(fn) { window.addEventListener('tractform:location', (e) => fn(e.detail)); }
  };
})();
