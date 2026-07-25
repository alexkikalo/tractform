/* Tractform — Land data + pure calculator
   Multi-activity planning with scale, terrain, and location-banded cost.
*/
(function () {
  // Each activity has three scales so 2 chickens and 50 chickens are different
  const ACTIVITIES = {
    homesite: {
      id: 'homesite',
      name: 'Homesite & buildings',
      short: 'Homesite',
      optimalTerrain: 'open',
      terrainLabel: 'Open / gentle slope',
      note: 'House, drive, septic setbacks, utility space.',
      scales: {
        small:  { label: 'Small',  desc: 'Modest house + minimal outbuildings', acres: 0.5 },
        medium: { label: 'Medium', desc: 'House, garage, workshop space', acres: 1.0 },
        large:  { label: 'Large',  desc: 'House + multiple outbuildings', acres: 2.0 }
      }
    },
    garden: {
      id: 'garden',
      name: 'Kitchen garden / annuals',
      short: 'Garden',
      optimalTerrain: 'open',
      terrainLabel: 'Open, well-drained, full sun',
      note: 'Intensive beds; scale with how much you want to grow.',
      scales: {
        small:  { label: 'Small',  desc: 'Kitchen herbs + salad (~2,000 sq ft)', acres: 0.05 },
        medium: { label: 'Medium', desc: 'Family vegetable garden', acres: 0.25 },
        large:  { label: 'Large',  desc: 'Serious production / calorie crops', acres: 0.75 }
      }
    },
    orchard: {
      id: 'orchard',
      name: 'Orchard / perennials',
      short: 'Orchard',
      optimalTerrain: 'rolling',
      terrainLabel: 'Rolling or open, good air drainage',
      note: 'Fruit/nut trees and berry plantings.',
      scales: {
        small:  { label: 'Small',  desc: 'A few trees + berries', acres: 0.15 },
        medium: { label: 'Medium', desc: 'Home orchard', acres: 0.5 },
        large:  { label: 'Large',  desc: 'Substantial orchard block', acres: 2.0 }
      }
    },
    poultry: {
      id: 'poultry',
      name: 'Poultry & small livestock',
      short: 'Poultry',
      optimalTerrain: 'open',
      terrainLabel: 'Open with shade options',
      note: 'Coops, runs, and rotational pens. Scale = flock size.',
      scales: {
        small:  { label: 'Few',    desc: '2–6 birds (backyard)', acres: 0.05 },
        medium: { label: 'Flock',  desc: '12–25 birds', acres: 0.2 },
        large:  { label: 'Many',   desc: '40–100+ birds or mixed small stock', acres: 0.75 }
      }
    },
    pasture: {
      id: 'pasture',
      name: 'Livestock pasture',
      short: 'Pasture',
      optimalTerrain: 'open',
      terrainLabel: 'Open or rolling pasture',
      note: 'Grazing for sheep, goats, cattle. Scale with herd size.',
      scales: {
        small:  { label: 'Pair',   desc: 'A few sheep/goats or 1–2 cattle', acres: 2 },
        medium: { label: 'Small herd', desc: 'Modest flock or small herd', acres: 8 },
        large:  { label: 'Herd',   desc: 'Serious grazing enterprise', acres: 25 }
      }
    },
    hay: {
      id: 'hay',
      name: 'Hay / forage production',
      short: 'Hay',
      optimalTerrain: 'open',
      terrainLabel: 'Open, accessible for equipment',
      note: 'Winter feed or market hay.',
      scales: {
        small:  { label: 'Small',  desc: 'Supplement for a few animals', acres: 2 },
        medium: { label: 'Medium', desc: 'Self-sufficient winter feed', acres: 5 },
        large:  { label: 'Large',  desc: 'Extra for sale or bigger herd', acres: 15 }
      }
    },
    woodlot: {
      id: 'woodlot',
      name: 'Woodlot / timber',
      short: 'Woodlot',
      optimalTerrain: 'wooded',
      terrainLabel: 'Wooded or mixed',
      note: 'Firewood, timber, wildlife, windbreak.',
      scales: {
        small:  { label: 'Small',  desc: 'Firewood + windbreak', acres: 1 },
        medium: { label: 'Medium', desc: 'Ongoing firewood supply', acres: 5 },
        large:  { label: 'Large',  desc: 'Timber / larger woodlot', acres: 20 }
      }
    },
    mixed: {
      id: 'mixed',
      name: 'Mixed buffer & access',
      short: 'Buffer',
      optimalTerrain: 'rolling',
      terrainLabel: 'Any workable terrain',
      note: 'Lanes, setbacks, wildlife strips, future flexibility.',
      scales: {
        small:  { label: 'Minimal', desc: 'Basic lanes and setbacks', acres: 0.5 },
        medium: { label: 'Standard', desc: 'Comfortable buffer', acres: 1.5 },
        large:  { label: 'Generous', desc: 'Extra flexibility and wildlife', acres: 3 }
      }
    }
  };

  // USDA-ish 2025 statewide farm real estate base ($/acre).
  // Used as the midpoint for "rural" setting; other settings multiply this.
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

  // Setting multipliers relative to statewide average.
  // Large states (TX, CA, NY) vary enormously; this band is the honest way to show that.
  const SETTINGS = {
    remote: {
      id: 'remote',
      label: 'Remote rural',
      hint: 'Far from towns, limited services',
      low: 0.45,
      high: 0.75
    },
    rural: {
      id: 'rural',
      label: 'Rural',
      hint: 'Countryside, not next to a city',
      low: 0.75,
      high: 1.15
    },
    mixed: {
      id: 'mixed',
      label: 'Mixed / edge of town',
      hint: 'Small-town fringe or popular rural areas',
      low: 1.2,
      high: 2.2
    },
    metro: {
      id: 'metro',
      label: 'Near metro',
      hint: 'Within commuting distance of a larger city',
      low: 2.0,
      high: 5.0
    }
  };

  function parseStateFromPlace(place) {
    if (!place) return null;
    const s = String(place).trim().toUpperCase();
    const m = s.match(/\b([A-Z]{2})\b(?:\s*\d{5})?$/);
    if (m && STATE_PRICE[m[1]]) return m[1];
    for (const [code, name] of Object.entries(STATE_NAMES)) {
      if (s.includes(name.toUpperCase())) return code;
    }
    return null;
  }

  async function stateFromZip(zip) {
    const clean = String(zip).replace(/\D/g, '').slice(0, 5);
    if (clean.length !== 5) return null;
    try {
      const res = await fetch('https://usps-zip-codes.deno.dev/' + clean, { mode: 'cors' });
      if (!res.ok) return null;
      const data = await res.json();
      const st = (data.state || data.State || '').toUpperCase();
      return STATE_PRICE[st] ? st : null;
    } catch {
      return null;
    }
  }

  /**
   * state = {
   *   activities: [{ id, scale }],  // scale: small|medium|large
   *   setting: remote|rural|mixed|metro,
   *   place, zone, stateCode
   * }
   */
  function calculate(state) {
    const activityList = Array.isArray(state.activities) && state.activities.length
      ? state.activities
      : [{ id: 'homesite', scale: 'medium' }, { id: 'garden', scale: 'medium' }];

    const settingKey = state.setting || 'rural';
    const setting = SETTINGS[settingKey] || SETTINGS.rural;

    const rows = activityList.map(item => {
      const a = ACTIVITIES[item.id];
      if (!a) return null;
      const scaleKey = item.scale && a.scales[item.scale] ? item.scale : 'medium';
      const sc = a.scales[scaleKey];
      return {
        id: a.id,
        name: a.name,
        short: a.short,
        scale: scaleKey,
        scaleLabel: sc.label,
        scaleDesc: sc.desc,
        acres: sc.acres,
        optimalTerrain: a.optimalTerrain,
        terrainLabel: a.terrainLabel,
        note: a.note,
        scales: a.scales
      };
    }).filter(Boolean);

    const acresSum = rows.reduce((s, r) => s + r.acres, 0);
    const hasBuffer = rows.some(r => r.id === 'mixed');
    const buffer = hasBuffer ? 0 : Math.max(0.25, +(acresSum * 0.1).toFixed(2));
    const totalAcres = +(acresSum + buffer).toFixed(2);

    // Cost
    let cost = {
      hasLocation: false,
      lookingUp: false,
      message: 'Enter a city or ZIP in the header to see approximate land cost.',
      perAcreLow: null,
      perAcreHigh: null,
      perAcreMid: null,
      stateCode: null,
      stateName: null,
      totalLow: null,
      totalHigh: null,
      totalMid: null,
      settingLabel: setting.label,
      source: null
    };

    const place = state.place || '';
    const zipMatch = String(place).match(/\b(\d{5})\b/);
    let stateCode = state.stateCode || parseStateFromPlace(place);

    if (stateCode && STATE_PRICE[stateCode]) {
      const base = STATE_PRICE[stateCode];
      const perLow = Math.round(base * setting.low);
      const perHigh = Math.round(base * setting.high);
      const perMid = Math.round((perLow + perHigh) / 2);
      cost = {
        hasLocation: true,
        lookingUp: false,
        message: null,
        perAcreLow: perLow,
        perAcreHigh: perHigh,
        perAcreMid: perMid,
        stateCode,
        stateName: STATE_NAMES[stateCode],
        totalLow: Math.round(perLow * totalAcres),
        totalHigh: Math.round(perHigh * totalAcres),
        totalMid: Math.round(perMid * totalAcres),
        settingLabel: setting.label,
        source: 'Based on USDA statewide farm real estate average, adjusted for ' +
          setting.label.toLowerCase() + ' setting. Large states vary widely by county — this is a planning range, not a listing price.'
      };
    }

    // Climate
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
      totalAcres,
      buffer,
      hasBuffer,
      setting,
      cost,
      season,
      frost,
      zone,
      place,
      _pendingZip: (!stateCode && zipMatch) ? zipMatch[1] : null
    };
  }

  window.TractformLand = {
    ACTIVITIES,
    SETTINGS,
    STATE_PRICE,
    STATE_NAMES,
    calculate,
    stateFromZip,
    parseStateFromPlace
  };
})();
