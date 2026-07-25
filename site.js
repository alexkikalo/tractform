/* Tractform shared site controls — location & hardiness zone */
(function () {
  const STORAGE_KEY = 'tractform_location';

  const ZONES = [
    '1a','1b','2a','2b','3a','3b','4a','4b','5a','5b',
    '6a','6b','7a','7b','8a','8b','9a','9b','10a','10b',
    '11a','11b','12a','12b','13a','13b'
  ];

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('tractform:location', { detail: data }));
  }

  function getLocation() {
    return load();
  }

  function zoneNumber(z) {
    if (!z) return null;
    const n = parseInt(String(z).replace(/[ab]/i, ''), 10);
    return Number.isFinite(n) ? n : null;
  }

  /** Returns true if zone is within min–max inclusive (numeric zone). */
  function zoneInRange(zone, min, max) {
    const n = zoneNumber(zone);
    if (n == null) return null;
    return n >= min && n <= max;
  }

  function buildBar() {
    const loc = load();
    const options = ZONES.map(z =>
      `<option value="${z}"${loc.zone === z ? ' selected' : ''}>${z}</option>`
    ).join('');

    return `
    <div id="tf-location-bar" class="border-b border-stone-200 bg-stone-100/80">
      <div class="max-w-6xl mx-auto px-6 py-2.5 flex flex-wrap items-center gap-3 text-sm">
        <span class="text-stone-500 font-medium text-xs uppercase tracking-wide mr-1">Your place</span>
        <label class="flex items-center gap-1.5">
          <span class="text-stone-500 text-xs">City / ZIP</span>
          <input id="tf-place" type="text" placeholder="e.g. Decatur, TX or 76234"
            value="${loc.place ? String(loc.place).replace(/"/g, '"') : ''}"
            class="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm w-40 sm:w-52 focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700" />
        </label>
        <label class="flex items-center gap-1.5">
          <span class="text-stone-500 text-xs">USDA zone</span>
          <select id="tf-zone" class="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700">
            <option value="">Select…</option>
            ${options}
          </select>
        </label>
        <span id="tf-zone-hint" class="text-xs text-stone-400 hidden sm:inline"></span>
      </div>
    </div>`;
  }

  function mount() {
    const header = document.querySelector('header');
    if (!header || document.getElementById('tf-location-bar')) return;

    header.insertAdjacentHTML('afterend', buildBar());

    const placeInput = document.getElementById('tf-place');
    const zoneSelect = document.getElementById('tf-zone');
    const hint = document.getElementById('tf-zone-hint');

    function updateHint() {
      const loc = load();
      if (loc.zone) {
        hint.textContent = `Zone ${loc.zone} saved for this browser`;
      } else {
        hint.textContent = 'Set zone once — used across all pages';
      }
    }

    function persist() {
      save({
        place: (placeInput.value || '').trim(),
        zone: zoneSelect.value || ''
      });
      updateHint();
    }

    placeInput.addEventListener('change', persist);
    placeInput.addEventListener('blur', persist);
    zoneSelect.addEventListener('change', persist);
    updateHint();
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