/* Tractform — Land data + pure calculator
   Multi-activity planning with scale, terrain, and location-aware cost.

   Cost priority:
   1) Local market band (county/metro) when place matches
   2) State USDA base × setting × parcel type (fallback only)
*/
(function () {
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

  // USDA 2025 statewide farm real estate base ($/acre) — fallback only
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

  /* Local market bands for homestead-scale parcels (approx. retail asking / recent medians).
     Prefer these over state×multiplier when the place matches.
     Expand this table over time — it is the real product improvement. */
  const LOCAL_MARKETS = [
    {
      id: 'tx-wise',
      state: 'TX',
      name: 'Wise County, TX (Decatur area)',
      match: [/\bdecatur\b/i, /\bwise county\b/i, /\bbridgeport\b/i, /\bboyd\b/i, /\brhome\b/i, /\bspringtown\b/i, /\balvord\b/i, /\bchico\b/i, /\bparadise\b/i, /\b76234\b/, /\b76225\b/, /\b76023\b/, /\b76426\b/, /\b76073\b/],
      homesteadLow: 20000,
      homesteadHigh: 55000,
      workingLow: 8000,
      workingHigh: 25000,
      note: 'DFW northwest fringe. Small 5–30 ac tracts often list $20k–$55k/acre; larger ranch tracts lower.'
    },
    {
      id: 'tx-denton',
      state: 'TX',
      name: 'Denton County, TX',
      match: [/\bdenton\b/i, /\bsanger\b/i, /\bpilot point\b/i, /\bkrum\b/i, /\baubrey\b/i, /\bpilot\b/i, /\b76227\b/, /\b76207\b/, /\b76205\b/, /\b76201\b/, /\b76210\b/],
      homesteadLow: 30000,
      homesteadHigh: 80000,
      workingLow: 25000,
      workingHigh: 70000,
      note: 'Closer-in DFW north. Higher pressure than Wise; small acreage often well above $30k/acre.'
    },
    {
      id: 'tx-parker',
      state: 'TX',
      name: 'Parker County, TX (Weatherford area)',
      match: [/\bweatherford\b/i, /\bparker county\b/i, /\baledo\b/i, /\bhudson oaks\b/i, /\bspringtown\b/i, /\b76087\b/, /\b76086\b/, /\b76082\b/],
      homesteadLow: 22000,
      homesteadHigh: 60000,
      workingLow: 10000,
      workingHigh: 30000,
      note: 'DFW west growth corridor. Similar retail pressure to Wise for small tracts.'
    },
    {
      id: 'tx-johnson',
      state: 'TX',
      name: 'Johnson County, TX (Cleburne / Burleson)',
      match: [/\bcleburne\b/i, /\bburleson\b/i, /\bjoshua\b/i, /\bkeene\b/i, /\b76031\b/, /\b76028\b/, /\b76033\b/],
      homesteadLow: 20000,
      homesteadHigh: 50000,
      workingLow: 10000,
      workingHigh: 28000,
      note: 'DFW south/southwest fringe.'
    },
    {
      id: 'tx-hill-country',
      state: 'TX',
      name: 'Texas Hill Country (approx.)',
      match: [/\bfredericksburg\b/i, /\bkerrville\b/i, /\bboerne\b/i, /\bwimberley\b/i, /\bdripping springs\b/i, /\bblanco\b/i, /\bjohnson city\b/i, /\b78606\b/, /\b78028\b/, /\b78006\b/],
      homesteadLow: 15000,
      homesteadHigh: 45000,
      workingLow: 7000,
      workingHigh: 25000,
      note: 'Scenic demand keeps small tracts elevated; varies widely by water and views.'
    },
    {
      id: 'tx-panhandle',
      state: 'TX',
      name: 'Texas Panhandle / South Plains',
      match: [/\bamarillo\b/i, /\blubbock\b/i, /\bcanyon\b/i, /\bplainview\b/i, /\b791\d{2}\b/, /\b794\d{2}\b/],
      homesteadLow: 3000,
      homesteadHigh: 12000,
      workingLow: 1500,
      workingHigh: 4000,
      note: 'Much closer to pure ag values; small tracts near towns still carry a premium.'
    }
  ];

  const SETTINGS = {
    remote: { id: 'remote', label: 'Remote rural', hint: 'Far from towns, limited services', low: 1.0, high: 2.5 },
    rural:  { id: 'rural',  label: 'Rural', hint: 'Countryside, not on a metro fringe', low: 3.0, high: 8.0 },
    mixed:  { id: 'mixed',  label: 'Mixed / edge of town', hint: 'Small-town fringe or popular rural areas', low: 7.0, high: 15.0 },
    metro:  { id: 'metro',  label: 'Near metro', hint: 'Commuting distance to a larger city', low: 12.0, high: 25.0 }
  };

  const MARKETS = {
    working:   { id: 'working',   label: 'Working ranch / ag', hint: 'Larger tracts used mainly for grazing or crops', low: 0.85, high: 1.0 },
    homestead: { id: 'homestead', label: 'Homestead / small acreage', hint: 'Residential-oriented 2–30 acre parcels', low: 1.0, high: 1.35 }
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

  function findLocalMarket(place, stateCode) {
    if (!place) return null;
    const text = String(place);
    for (const m of LOCAL_MARKETS) {
      if (stateCode && m.state !== stateCode) continue;
      if (m.match.some(re => re.test(text))) return m;
    }
    // If state unknown, still try match (city name may be unique enough)
    if (!stateCode) {
      for (const m of LOCAL_MARKETS) {
        if (m.match.some(re => re.test(text))) return m;
      }
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

  function listingSearchUrls(place) {
    const q = encodeURIComponent(String(place || '').trim());
    if (!q) return null;
    return {
      landwatch: 'https://www.landwatch.com/search?key=' + q + '&property_type=land',
      zillow: 'https://www.zillow.com/' + encodeURIComponent(String(place).trim().replace(/,\s*/g, '-').replace(/\s+/g, '-')) + '/land/',
      landsearch: 'https://www.landsearch.com/properties/' + q.replace(/%20/g, '-')
    };
  }

  function calculate(state) {
    const activityList = Array.isArray(state.activities) && state.activities.length
      ? state.activities
      : [{ id: 'homesite', scale: 'medium' }, { id: 'garden', scale: 'medium' }];

    const settingKey = state.setting || 'mixed';
    const setting = SETTINGS[settingKey] || SETTINGS.mixed;
    const marketKey = state.market || 'homestead';
    const market = MARKETS[marketKey] || MARKETS.homestead;

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

    const place = state.place || '';
    const zipMatch = String(place).match(/\b(\d{5})\b/);
    let stateCode = state.stateCode || parseStateFromPlace(place);
    const local = findLocalMarket(place, stateCode);

    let cost = {
      hasLocation: false,
      sourceType: null, // 'local' | 'state'
      message: 'Enter a city or ZIP in the header to see approximate land cost.',
      perAcreLow: null,
      perAcreHigh: null,
      perAcreMid: null,
      stateCode: null,
      stateName: null,
      localName: null,
      totalLow: null,
      totalHigh: null,
      totalMid: null,
      settingLabel: setting.label,
      marketLabel: market.label,
      note: null,
      source: null,
      listings: listingSearchUrls(place)
    };

    if (local) {
      // Prefer local market band — do not understate high-pressure areas
      const isHomestead = marketKey === 'homestead';
      const perLow = isHomestead ? local.homesteadLow : local.workingLow;
      const perHigh = isHomestead ? local.homesteadHigh : local.workingHigh;
      const perMid = Math.round((perLow + perHigh) / 2);
      if (!stateCode) stateCode = local.state;
      cost = {
        hasLocation: true,
        sourceType: 'local',
        message: null,
        perAcreLow: perLow,
        perAcreHigh: perHigh,
        perAcreMid: perMid,
        stateCode,
        stateName: STATE_NAMES[stateCode] || stateCode,
        localName: local.name,
        totalLow: Math.round(perLow * totalAcres),
        totalHigh: Math.round(perHigh * totalAcres),
        totalMid: Math.round(perMid * totalAcres),
        settingLabel: setting.label,
        marketLabel: market.label,
        note: local.note,
        source: 'Local market band for ' + local.name + ' based on recent listing/sale ranges for similar parcel types. Always verify with current listings.',
        listings: listingSearchUrls(place)
      };
    } else if (stateCode && STATE_PRICE[stateCode]) {
      const base = STATE_PRICE[stateCode];
      const perLow = Math.round(base * setting.low * market.low);
      const perHigh = Math.round(base * setting.high * market.high);
      const perMid = Math.round((perLow + perHigh) / 2);
      cost = {
        hasLocation: true,
        sourceType: 'state',
        message: null,
        perAcreLow: perLow,
        perAcreHigh: perHigh,
        perAcreMid: perMid,
        stateCode,
        stateName: STATE_NAMES[stateCode],
        localName: null,
        totalLow: Math.round(perLow * totalAcres),
        totalHigh: Math.round(perHigh * totalAcres),
        totalMid: Math.round(perMid * totalAcres),
        settingLabel: setting.label,
        marketLabel: market.label,
        note: 'No local market band yet for this area. Using statewide fallback — can understate prices near cities.',
        source: 'Fallback: USDA statewide farm average scaled by setting and parcel type. Local retail for small tracts is often higher. Check live listings.',
        listings: listingSearchUrls(place)
      };
    }

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
      market,
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
    MARKETS,
    LOCAL_MARKETS,
    STATE_PRICE,
    STATE_NAMES,
    calculate,
    stateFromZip,
    parseStateFromPlace,
    findLocalMarket,
    listingSearchUrls
  };
})();
