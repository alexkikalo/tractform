/* Tractform — Livestock data + pure calculator
   Single source of truth for animals, breeds, rates, and zone fit.
   Used by production.html
*/
(function () {
  const ANIMALS = {
    sheep: {
      name: 'Sheep',
      video: '/videos/animals/sheep/Katahdin.mp4',
      unit: 'head',
      blurb: 'Meat, wool, or dual-purpose. Manageable on small acreage when stocking rates and fencing are right.',
      zoneMin: 3,
      zoneMax: 9,
      coldNote: 'Provide windbreak and dry bedding in hard freezes.',
      heatNote: 'Shade and continuous fresh water are critical above the mid-90s.',
      breeds: {
        katahdin: {
          name: 'Katahdin',
          video: '/videos/animals/sheep/Katahdin.mp4',
          note: 'Hair sheep — no shearing. Easy care, good meat.',
          landPer: 0.25,
          waterGal: 2.0,
          feedLb: 3.5,
          laborMin: 3,
          shelterSqFt: 16,
          uses: 'Meat',
          zoneMin: 3,
          zoneMax: 9,
          barrier: 30,
          yield: 55,
          life: 60
        },
        dorper: {
          name: 'Dorper',
          video: '/videos/animals/sheep/Dorper.mp4',
          note: 'Hair sheep, hardy, fast growth.',
          landPer: 0.25,
          waterGal: 2.0,
          feedLb: 3.8,
          laborMin: 3,
          shelterSqFt: 16,
          uses: 'Meat',
          zoneMin: 4,
          zoneMax: 10,
          barrier: 32,
          yield: 58,
          life: 55
        },
        suffolk: {
          name: 'Suffolk',
          video: '/videos/animals/sheep/Suffolk.mp4',
          note: 'Wool + meat. Needs shearing.',
          landPer: 0.30,
          waterGal: 2.5,
          feedLb: 4.0,
          laborMin: 5,
          shelterSqFt: 18,
          uses: 'Meat, wool',
          zoneMin: 3,
          zoneMax: 8,
          barrier: 40,
          yield: 60,
          life: 55
        },
        'east-friesian': {
          name: 'East Friesian',
          video: '/videos/animals/sheep/Friesian.mp4',
          note: 'Dairy-oriented. Higher feed and labor.',
          landPer: 0.35,
          waterGal: 3.5,
          feedLb: 5.0,
          laborMin: 12,
          shelterSqFt: 20,
          uses: 'Milk, meat',
          zoneMin: 4,
          zoneMax: 8,
          barrier: 55,
          yield: 70,
          life: 50
        }
      }
    },

    chickens: {
      name: 'Chickens',
      video: '/videos/animals/chickens/Barred%20Plymouth%20Rock.mp4',
      unit: 'birds',
      blurb: 'Eggs, meat, or both. Lowest barrier if the coop is predator-proof.',
      zoneMin: 3,
      zoneMax: 10,
      coldNote: 'Insulate coop; heated water in deep freezes.',
      heatNote: 'Shade, airflow, and extra water — heat stress cuts laying hard.',
      breeds: {
        'barred-rock': {
          name: 'Barred Plymouth Rock',
          video: '/videos/animals/chickens/Barred%20Plymouth%20Rock.mp4',
          note: 'Dual-purpose classic. Steady layers, calm.',
          landPer: 0.02,
          waterGal: 0.15,
          feedLb: 0.25,
          laborMin: 0.6,
          shelterSqFt: 3,
          uses: 'Eggs, meat',
          zoneMin: 3,
          zoneMax: 9,
          barrier: 18,
          yield: 55,
          life: 30
        },
        rir: {
          name: 'Rhode Island Red',
          video: '/videos/animals/chickens/Rhode%20Island%20Red.mp4',
          note: 'Hardy layer, good forage.',
          landPer: 0.02,
          waterGal: 0.15,
          feedLb: 0.25,
          laborMin: 0.6,
          shelterSqFt: 3,
          uses: 'Eggs, meat',
          zoneMin: 3,
          zoneMax: 10,
          barrier: 18,
          yield: 58,
          life: 28
        },
        leghorn: {
          name: 'Leghorn',
          video: '/videos/animals/chickens/Leghorn.mp4',
          note: 'High egg output, lighter body.',
          landPer: 0.015,
          waterGal: 0.12,
          feedLb: 0.22,
          laborMin: 0.5,
          shelterSqFt: 2.5,
          uses: 'Eggs',
          zoneMin: 5,
          zoneMax: 10,
          barrier: 15,
          yield: 65,
          life: 25
        },
        orpington: {
          name: 'Orpington',
          video: '/videos/animals/chickens/Orpington.mp4',
          note: 'Broody, gentle, dual-purpose. Cold-tolerant.',
          landPer: 0.025,
          waterGal: 0.18,
          feedLb: 0.28,
          laborMin: 0.6,
          shelterSqFt: 3.5,
          uses: 'Eggs, meat',
          zoneMin: 3,
          zoneMax: 8,
          barrier: 20,
          yield: 50,
          life: 35
        },
        cornish: {
          name: 'Cornish Cross',
          video: '/videos/animals/chickens/Cornish%20Cross.mp4',
          note: 'Meat bird — short cycle, high feed.',
          landPer: 0.02,
          waterGal: 0.25,
          feedLb: 0.35,
          laborMin: 0.7,
          shelterSqFt: 2,
          uses: 'Meat',
          zoneMin: 4,
          zoneMax: 10,
          barrier: 25,
          yield: 80,
          life: 12
        }
      }
    },

    goats: {
      name: 'Goats',
      video: '/videos/Goat.mp4',
      unit: 'head',
      blurb: 'Milk, meat, or brush. Escape artists — fencing is half the system.',
      zoneMin: 4,
      zoneMax: 10,
      coldNote: 'Dry draft-free shelter; goats handle cold better than wet.',
      heatNote: 'Shade and browse; dairy breeds need extra water in heat.',
      breeds: {
        boer: {
          name: 'Boer',
          note: 'Meat focus. Strong and fast-growing.',
          landPer: 0.20,
          waterGal: 2.5,
          feedLb: 4.0,
          laborMin: 4,
          shelterSqFt: 15,
          uses: 'Meat, brush',
          zoneMin: 5,
          zoneMax: 10,
          barrier: 40,
          yield: 60,
          life: 55
        },
        nubian: {
          name: 'Nubian',
          note: 'Dairy. Rich milk, vocal.',
          landPer: 0.22,
          waterGal: 3.5,
          feedLb: 4.5,
          laborMin: 15,
          shelterSqFt: 18,
          uses: 'Milk, meat',
          zoneMin: 6,
          zoneMax: 10,
          barrier: 55,
          yield: 70,
          life: 50
        },
        nigerian: {
          name: 'Nigerian Dwarf',
          note: 'Small dairy. Less space, still daily milk work.',
          landPer: 0.10,
          waterGal: 1.5,
          feedLb: 2.5,
          laborMin: 12,
          shelterSqFt: 10,
          uses: 'Milk',
          zoneMin: 5,
          zoneMax: 10,
          barrier: 45,
          yield: 55,
          life: 60
        },
        kiko: {
          name: 'Kiko',
          note: 'Hardy meat / brush. Low-input.',
          landPer: 0.20,
          waterGal: 2.5,
          feedLb: 3.8,
          laborMin: 3,
          shelterSqFt: 15,
          uses: 'Meat, brush',
          zoneMin: 4,
          zoneMax: 9,
          barrier: 35,
          yield: 55,
          life: 60
        }
      }
    },

    cattle: {
      name: 'Cattle',
      video: '/videos/Cow.mp4',
      unit: 'head',
      blurb: 'Beef or dairy. Land and winter feed usually decide whether the plan works.',
      zoneMin: 3,
      zoneMax: 10,
      coldNote: 'Windbreaks and winter feed reserves dominate cold climates.',
      heatNote: 'Shade, water capacity, and heat-tolerant breeds matter.',
      breeds: {
        angus: {
          name: 'Angus',
          note: 'Beef. Common, market-friendly.',
          landPer: 1.5,
          waterGal: 15,
          feedLb: 28,
          laborMin: 10,
          shelterSqFt: 40,
          uses: 'Beef',
          zoneMin: 3,
          zoneMax: 9,
          barrier: 75,
          yield: 70,
          life: 65
        },
        hereford: {
          name: 'Hereford',
          note: 'Beef. Hardy, good mothers.',
          landPer: 1.5,
          waterGal: 15,
          feedLb: 28,
          laborMin: 10,
          shelterSqFt: 40,
          uses: 'Beef',
          zoneMin: 3,
          zoneMax: 9,
          barrier: 72,
          yield: 68,
          life: 65
        },
        jersey: {
          name: 'Jersey',
          note: 'Dairy. High butterfat, daily milking.',
          landPer: 1.2,
          waterGal: 25,
          feedLb: 35,
          laborMin: 50,
          shelterSqFt: 50,
          uses: 'Milk',
          zoneMin: 4,
          zoneMax: 9,
          barrier: 85,
          yield: 80,
          life: 55
        },
        highland: {
          name: 'Highland',
          note: 'Hardy beef, thrives on rough forage. Excellent cold tolerance.',
          landPer: 1.8,
          waterGal: 12,
          feedLb: 25,
          laborMin: 8,
          shelterSqFt: 35,
          uses: 'Beef',
          zoneMin: 2,
          zoneMax: 7,
          barrier: 70,
          yield: 55,
          life: 70
        }
      }
    },

    pigs: {
      name: 'Pigs',
      video: '/videos/Pig.mp4',
      unit: 'head',
      blurb: 'Efficient meat on small acreage. Strong fencing and a finishing plan are essential.',
      zoneMin: 4,
      zoneMax: 10,
      coldNote: 'Dry shelter and deep bedding; piglets need extra warmth.',
      heatNote: 'Wallows or misters — pigs overheat easily without cooling.',
      breeds: {
        berkshire: {
          name: 'Berkshire',
          note: 'Quality meat. Pasture-capable.',
          landPer: 0.15,
          waterGal: 5,
          feedLb: 6,
          laborMin: 5,
          shelterSqFt: 20,
          uses: 'Meat',
          zoneMin: 4,
          zoneMax: 9,
          barrier: 40,
          yield: 70,
          life: 20
        },
        yorkshire: {
          name: 'Yorkshire',
          note: 'Lean, efficient growth.',
          landPer: 0.12,
          waterGal: 5,
          feedLb: 5.5,
          laborMin: 5,
          shelterSqFt: 18,
          uses: 'Meat',
          zoneMin: 4,
          zoneMax: 10,
          barrier: 38,
          yield: 75,
          life: 18
        },
        kunekune: {
          name: 'Kunekune',
          note: 'Smaller, grazing-focused, friendly.',
          landPer: 0.20,
          waterGal: 3.5,
          feedLb: 4,
          laborMin: 4,
          shelterSqFt: 25,
          uses: 'Meat, grazers',
          zoneMin: 5,
          zoneMax: 9,
          barrier: 35,
          yield: 50,
          life: 40
        },
        duroc: {
          name: 'Duroc',
          note: 'Fast growth, good feed conversion.',
          landPer: 0.12,
          waterGal: 5,
          feedLb: 5.5,
          laborMin: 5,
          shelterSqFt: 18,
          uses: 'Meat',
          zoneMin: 4,
          zoneMax: 10,
          barrier: 38,
          yield: 78,
          life: 18
        }
      }
    }
  };

  function calculate(state) {
    const animalKey = state.animal || 'sheep';
    const animal = ANIMALS[animalKey];
    if (!animal) return null;

    const breedKey = state.breed || Object.keys(animal.breeds)[0];
    const breed = animal.breeds[breedKey] || animal.breeds[Object.keys(animal.breeds)[0]];
    const qty = Math.max(1, parseInt(state.quantity, 10) || 1);
    const zone = state.zone || null;
    const zoneNum = zone && window.TractformLocation
      ? window.TractformLocation.zoneNumber(zone)
      : null;

    const landAcres = breed.landPer * qty;
    const waterGal = breed.waterGal * qty;
    const feedLb = breed.feedLb * qty;
    const laborMin = breed.laborMin * qty;
    const shelterSqFt = breed.shelterSqFt * qty;

    const scaleFactor = Math.min(1.25, 0.85 + Math.log10(qty + 1) * 0.2);

    const landIntensity = Math.min(95, Math.round(breed.landPer * 55 * scaleFactor));
    const waterIntensity = Math.min(95, Math.round(breed.waterGal * 6 * scaleFactor));
    const feedIntensity = Math.min(95, Math.round(breed.feedLb * 12 * scaleFactor));
    const shelterIntensity = Math.min(90, Math.round(breed.shelterSqFt * 2.2));
    const laborIntensity = Math.min(95, Math.round(breed.laborMin * 4 * scaleFactor));
    const barrier = breed.barrier;
    const yield = breed.yield;
    const life = breed.life;

    let zoneFit = { status: 'unknown', label: 'Set zone in the header for climate fit.', detail: '' };
    if (zoneNum != null) {
      const zMin = breed.zoneMin || animal.zoneMin;
      const zMax = breed.zoneMax || animal.zoneMax;
      const inRange = zoneNum >= zMin && zoneNum <= zMax;
      if (inRange) {
        zoneFit = {
          status: 'good',
          label: `Good fit for zone ${zone}`,
          detail: `Preferred zones ${zMin}–${zMax}.` +
            (zoneNum <= zMin + 1 ? ' ' + animal.coldNote : '') +
            (zoneNum >= zMax - 1 ? ' ' + animal.heatNote : '')
        };
      } else {
        const colder = zoneNum < zMin;
        zoneFit = {
          status: colder ? 'colder' : 'warmer',
          label: colder
            ? `Zone ${zone} is colder than typical for ${breed.name}`
            : `Zone ${zone} is warmer than typical for ${breed.name}`,
          detail: (colder ? animal.coldNote : animal.heatNote) +
            ` Preferred zones ${zMin}–${zMax}.`
        };
      }
    }

    let landLabel;
    if (animalKey === 'chickens') {
      landLabel = `~${Math.ceil(qty * 3)} sq ft coop + run`;
    } else if (landAcres < 1) {
      landLabel = `~${Math.round(landAcres * 43560)} sq ft`;
    } else {
      landLabel = `~${landAcres.toFixed(1)} acres`;
    }

    const waterLabel = waterGal < 10
      ? `~${waterGal.toFixed(1)} gal/day`
      : `~${Math.round(waterGal)} gal/day`;

    const laborLabel = laborMin < 60
      ? `~${Math.round(laborMin)} min/day`
      : `~${(laborMin / 60).toFixed(1)} hr/day`;

    const video = breed.video || animal.video;

    return {
      animalKey,
      animalName: animal.name,
      video,
      unit: animal.unit,
      blurb: animal.blurb,
      breedKey,
      breedName: breed.name,
      breedNote: breed.note,
      quantity: qty,
      uses: breed.uses,

      landAcres,
      landLabel,
      waterGal,
      waterLabel,
      feedLb,
      laborMin,
      laborLabel,
      shelterSqFt,

      bars: {
        land: { pct: landIntensity, label: landIntensity > 70 ? 'High' : landIntensity > 40 ? 'Moderate' : 'Low' },
        water: { pct: waterIntensity, label: waterIntensity > 70 ? 'High' : waterIntensity > 35 ? 'Moderate' : 'Low' },
        feed: { pct: feedIntensity, label: feedIntensity > 70 ? 'High' : feedIntensity > 40 ? 'Moderate' : 'Low' },
        shelter: { pct: shelterIntensity, label: shelterIntensity > 60 ? 'Critical' : shelterIntensity > 35 ? 'Solid' : 'Light' },
        labor: { pct: laborIntensity, label: laborIntensity > 70 ? 'High' : laborIntensity > 40 ? 'Moderate' : 'Light' },
        barrier: { pct: barrier, label: barrier > 65 ? 'High' : barrier > 35 ? 'Medium' : 'Low' },
        yield: { pct: yield, label: yield > 65 ? 'High' : yield > 40 ? 'Solid' : 'Modest' },
        life: { pct: life, label: life > 55 ? 'Long' : life > 30 ? 'Multi-year' : 'Short cycle' }
      },

      zoneFit
    };
  }

  function listAnimals() {
    return Object.keys(ANIMALS).map(k => ({
      id: k,
      name: ANIMALS[k].name
    }));
  }

  function listBreeds(animalKey) {
    const a = ANIMALS[animalKey];
    if (!a) return [];
    return Object.keys(a.breeds).map(id => ({
      id,
      name: a.breeds[id].name,
      note: a.breeds[id].note
    }));
  }

  window.TractformLivestock = {
    ANIMALS,
    calculate,
    listAnimals,
    listBreeds
  };
})();
