/* Tractform — Land data + pure calculator
   Used by land.html
*/
(function () {
  const USES = {
    livestock: {
      name: 'Livestock',
      blurb: 'Prioritize forage, water access, fencing, and handling areas.'
    },
    garden: {
      name: 'Garden / crops',
      blurb: 'Prioritize sun exposure, workable soil near water, and frost window.'
    },
    timber: {
      name: 'Timber',
      blurb: 'Prioritize equipment access and long-cycle stands.'
    },
    homestead: {
      name: 'Mixed homestead',
      blurb: 'Balance pasture, garden, building sites, and daily chore routes.'
    }
  };

  const TERRAIN = {
    open: {
      label: 'Open pasture / field',
      build: 28,
      access: 78,
      forage: 72
    },
    rolling: {
      label: 'Rolling / mixed',
      build: 45,
      access: 58,
      forage: 55
    },
    wooded: {
      label: 'Mostly wooded',
      build: 58,
      access: 38,
      forage: 22
    },
    steep: {
      label: 'Steep or broken',
      build: 82,
      access: 22,
      forage: 28
    }
  };

  function climateFromZone(zoneNum) {
    if (zoneNum == null) {
      return {
        cold: 40,
        heat: 40,
        garden: 50,
        season: '—',
        frost: '—',
        coldLabel: '—',
        heatLabel: '—',
        gardenLabel: '—'
      };
    }

    // Rough but useful curves based on USDA zone
    const cold = Math.max(5, Math.min(95, (8 - zoneNum) * 11 + 18));
    const heat = Math.max(5, Math.min(95, (zoneNum - 4) * 11 + 12));
    const garden = Math.max(18, Math.min(92, 100 - Math.abs(zoneNum - 7) * 9));

    let season, frost;
    if (zoneNum <= 3) {
      season = '~70–110 days';
      frost = 'High / late';
    } else if (zoneNum <= 5) {
      season = '~110–150 days';
      frost = 'Moderate–high';
    } else if (zoneNum <= 7) {
      season = '~150–190 days';
      frost = 'Moderate';
    } else if (zoneNum <= 9) {
      season = '~190–240 days';
      frost = 'Mild';
    } else {
      season = '~240–300+ days';
      frost = 'Low / rare';
    }

    return {
      cold,
      heat,
      garden,
      season,
      frost,
      coldLabel: cold > 60 ? 'High' : cold > 35 ? 'Moderate' : 'Low',
      heatLabel: heat > 60 ? 'High' : heat > 35 ? 'Moderate' : 'Low',
      gardenLabel: garden > 65 ? 'Strong' : garden > 40 ? 'Fair' : 'Short season'
    };
  }

  function calculate(state) {
    const useKey = state.use || 'livestock';
    const use = USES[useKey] || USES.livestock;
    const terrainKey = state.terrain || 'open';
    const terrain = TERRAIN[terrainKey] || TERRAIN.open;
    const acres = Math.max(0.25, parseFloat(state.acres) || 1);

    const zone = state.zone || null;
    const zoneNum = zone && window.TractformLocation
      ? window.TractformLocation.zoneNumber(zone)
      : null;

    const climate = climateFromZone(zoneNum);

    // Adjust forage & garden based on use intent
    let foragePct = terrain.forage;
    let gardenPct = climate.garden;

    if (useKey === 'timber') foragePct = Math.round(foragePct * 0.35);
    if (useKey === 'garden') gardenPct = Math.min(95, gardenPct + 12);
    if (useKey === 'livestock') foragePct = Math.min(95, foragePct + 8);

    return {
      useKey,
      useName: use.name,
      blurb: use.blurb,
      terrainKey,
      terrainLabel: terrain.label,
      acres,

      climate,

      bars: {
        cold: { pct: climate.cold, label: climate.coldLabel },
        heat: { pct: climate.heat, label: climate.heatLabel },
        forage: {
          pct: foragePct,
          label: foragePct > 55 ? 'Good' : foragePct > 35 ? 'Fair' : 'Limited'
        },
        garden: { pct: gardenPct, label: climate.gardenLabel },
        build: {
          pct: terrain.build,
          label: terrain.build > 60 ? 'Hard' : terrain.build > 40 ? 'Moderate' : 'Easier'
        },
        access: {
          pct: terrain.access,
          label: terrain.access > 60 ? 'Good' : terrain.access > 40 ? 'Fair' : 'Limited'
        }
      },

      seasonLabel: climate.season,
      frostLabel: climate.frost,
      fitLabel: use.name.split(' ')[0],

      zoneStatus: zone
        ? {
            hasZone: true,
            label: `Zone ${zone}${state.place ? ' · ' + state.place : ''}`,
            detail: `Growing season ${climate.season}, frost ${climate.frost.toLowerCase()}.`
          }
        : {
            hasZone: false,
            label: 'Set zone in the header for climate stats.',
            detail: 'Cold, heat, and season will calibrate to your USDA zone.'
          }
    };
  }

  window.TractformLand = {
    USES,
    TERRAIN,
    calculate
  };
})();
