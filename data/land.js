/* Tractform — Land data + pure calculator
   Multi-activity land planning with acreage breakdown and approximate cost.
*/
(function () {
  // Recommended acreage ranges and optimal terrain for common homestead activities
  const ACTIVITIES = {
    homesite: {
      id: 'homesite',
      name: 'Homesite & buildings',
      short: 'Homesite',
      acresMin: 0.5,
      acresMax: 2,
      acresTypical: 1,
      optimalTerrain: 'open',
      terrainLabel: 'Open / gentle slope',
      note: 'House, drive, septic setbacks, and utility space.'
    },
    garden: {
      id: 'garden',
      name: 'Kitchen garden / annuals',
      short: 'Garden',
      acresMin: 0.1,
      acresMax: 0.5,
      acresTypical: 0.25,
      optimalTerrain: 'open',
      terrainLabel: 'Open, well-drained, full sun',
      note: 'Intensive beds; scale up for calorie crops.'
    },
    orchard: {
      id: 'orchard',
      name: 'Orchard / perennials',
      short: 'Orchard',
      acresMin: 0.25,
      acresMax: 2,
      acresTypical: 0.75,
      optimalTerrain: 'rolling',
      terrainLabel: 'Rolling or open, good air drainage',
      note: 'Fruit/nut trees and berry plantings.'
    },
    poultry: {
      id: 'poultry',
      name: 'Poultry & small livestock',
      short: 'Poultry',
      acresMin: 0.1,
      acresMax: 1,
      acresTypical: 0.25,
      optimalTerrain: 'open',
      terrainLabel: 'Open with shade options',
      note: 'Coops, runs, and rotational pens.'
    },
    pasture: {
      id: 'pasture',
      name: 'Livestock pasture',
      short: 'Pasture',
      acresMin: 2,
      acresMax: 40,
      acresTypical: 8,
      optimalTerrain: 'open',
      terrainLabel: 'Open or rolling pasture',
      note: 'Grazing for sheep, goats, cattle. Scale with herd size.'
    },
    hay: {
      id: 'hay',
      name: 'Hay / forage production',
      short: 'Hay',
      acresMin: 2,
      acresMax: 20,
      acresTypical: 5,
      optimalTerrain: 'open',
      terrainLabel: 'Open, accessible for equipment',
      note: 'Winter feed production or market hay.'
    },
    woodlot: {
      id: 'woodlot',
      name: 'Woodlot / timber',
      short: 'Woodlot',
      acresMin: 2,
      acresMax: 40,
      acresTypical: 5,
      optimalTerrain: 'wooded',
      terrainLabel: 'Wooded or mixed',
      note: 'Firewood, timber, wildlife, and windbreak.'
    },
    mixed: {
      id: 'mixed',
      name: 'Mixed buffer & access',
      short: 'Buffer',
      acresMin: 0.5,
      acresMax: 3,
      acresTypical: 1,
      optimalTerrain: 'rolling',
      terrainLabel: 'Any workable terrain',
      note: 'Lanes, setbacks, wildlife strips, and future flexibility.'
    }
  };

  // Approximate 2025 USDA farm real estate values ($/acre) by state.
  // Source: USDA NASS Land Values Summary 2025 (farm real estate = land + buildings).
  // These are statewide averages — local prices vary widely by water, access, and proximity to towns.
  const STATE_PRICE = {
    AL: 4200, AK: 2800, AZ: 3800, AR: 4100, CA: 13700,
    CO: 2200, CT: 14400, DE: 9550, FL: 7200, GA: 4800,
    HI: 12000, ID: 4500, IL: 8930, IN: 8200, IA: 9790,
    KS: 2800, KY: 4900, LA: 3800, ME: 3200, MD: 9750,
    MA: 14900, MI: 5900, MN: 6100, MS: 3400, MO: 4600,
    MT: 1600, NE: 3800, NV: 1500, NH: 6200, NJ: 16600,
    NM: 725, NY: 4000, NC: 5000, ND: 2200, OH: 9350,
    OK: 2300, OR: 3800, PA: 7500, RI: 22500, SC: 4500,
    SD: 2800, TN: 5200, TX: 2800, UT: 3200, VT: 4200,
    VA: 5500, WA: 3800, WV: 3400, WI: 6200, WY: 1100
  };

  const STATE_NAMES = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
  };

  function parseStateFromPlace(place) {
    if (!place) return null;
    const s = String(place).trim().toUpperCase();
    // "City, TX" or "TX 76234" or trailing state code
    const m = s.match(/\b([A-Z]{2})\b(?:\s*\d{5})?$/);
    if (m && STATE_PRICE[m[1]]) return m[1];
    // Full state name
    for (const [code, name] of Object.entries(STATE_NAMES)) {
      if (s.includes(name.toUpperCase())) return code;
    }
    return null;
  }

  async function stateFromZip(zip) {
    const clean = String(zip).replace(/\D/g, '').slice(0, 5);
    if (clean.length !== 5) return null;
    try {
      // Free public ZIP → city/state (no key)
      const res = await fetch('https://usps-zip-codes.deno.dev/' + clean, { mode: 'cors' });
      if (!res.ok) return null;
      const data = await res.json();
      const st = (data.state || data.State || '').toUpperCase();
      return STATE_PRICE[st] ? st : null;
    } catch {
      return null;
    }
  }

  function calculate(state) {
    const selected = Array.isArray(state.activities) && state.activities.length
      ? state.activities
      : ['homesite', 'garden'];

    const rows = selected.map(id => {
      const a = ACTIVITIES[id];
      if (!a) return null;
      return {
        id: a.id,
        name: a.name,
        short: a.short,
        acresMin: a.acresMin,
        acresMax: a.acresMax,
        acresTypical: a.acresTypical,
        optimalTerrain: a.optimalTerrain,
        terrainLabel: a.terrainLabel,
        note: a.note
      };
    }).filter(Boolean);

    const typicalSum = rows.reduce((s, r) => s + r.acresTypical, 0);
    const minSum = rows.reduce((s, r) => s + r.acresMin, 0);
    const maxSum = rows.reduce((s, r) => s + r.acresMax, 0);

    // Small buffer for lanes, setbacks, and future flexibility if not already included
    const hasBuffer = selected.includes('mixed');
    const buffer = hasBuffer ? 0 : Math.max(0.5, typicalSum * 0.1);
    const totalTypical = +(typicalSum + buffer).toFixed(1);
    const totalMin = +(minSum + (hasBuffer ? 0 : 0.5)).toFixed(1);
    const totalMax = +(maxSum + (hasBuffer ? 0 : Math.max(1, maxSum * 0.1))).toFixed(1);

    // Cost
    let cost = {
      hasLocation: false,
      message: 'Enter a city or ZIP in the header to see approximate land cost.',
      perAcre: null,
      stateCode: null,
      stateName: null,
      totalLow: null,
      totalHigh: null,
      totalTypical: null,
      source: null
    };

    const place = state.place || '';
    const zipMatch = String(place).match(/\b(\d{5})\b/);
    let stateCode = state.stateCode || parseStateFromPlace(place);

    if (stateCode && STATE_PRICE[stateCode]) {
      const perAcre = STATE_PRICE[stateCode];
      cost = {
        hasLocation: true,
        message: null,
        perAcre,
        stateCode,
        stateName: STATE_NAMES[stateCode],
        totalLow: Math.round(perAcre * totalMin),
        totalHigh: Math.round(perAcre * totalMax),
        totalTypical: Math.round(perAcre * totalTypical),
        source: 'USDA NASS 2025 statewide farm real estate average (land + buildings). Local prices vary widely.'
      };
    }

    // Climate still useful
    const zone = state.zone || null;
    const zoneNum = zone && window.TractformLocation
      ? window.TractformLocation.zoneNumber(zone)
      : null;

    let season = '—', frost = '—';
    if (zoneNum != null) {
      if (zoneNum <= 3) { season = '~70–110 days'; frost = 'High / late'; }
      else if (zoneNum <= 5) { season = '~110–150 days'; frost = 'Moderate–high'; }
      else if (zoneNum <= 7) { season = '~150–190 days'; frost = 'Moderate'; }
      else if (zoneNum <= 9) { season = '~190–240 days'; frost = 'Mild'; }
      else { season = '~240–300+ days'; frost = 'Low / rare'; }
    }

    return {
      rows,
      totalTypical,
      totalMin,
      totalMax,
      buffer,
      hasBuffer,
      cost,
      season,
      frost,
      zone,
      place,
      // expose for async ZIP resolution
      _pendingZip: (!stateCode && zipMatch) ? zipMatch[1] : null
    };
  }

  window.TractformLand = {
    ACTIVITIES,
    STATE_PRICE,
    STATE_NAMES,
    calculate,
    stateFromZip,
    parseStateFromPlace
  };
})();
