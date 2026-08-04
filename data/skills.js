/* Tractform — Household skills data
   Glanceable how-to cards for common homestead skills.
   Used by family.html
*/
(function () {
  const SKILLS = [
    {
      id: 'water-glass-eggs',
      title: 'Water Glassing Eggs',
      category: 'preserve',
      tags: ['eggs', 'chickens', 'storage', 'no-fridge', 'lime'],
      summary: 'Store clean, unwashed farm eggs 8–18 months without refrigeration.',
      materials: [
        'Food-grade pickling lime (calcium hydroxide)',
        'Filtered or distilled water (no chlorine)',
        'Clean glass jar or food-grade bucket with lid'
      ],
      ratio: '1 oz pickling lime per 1 quart water',
      steps: [
        'Select only clean, unwashed eggs with intact bloom. Discard any with cracks.',
        'Place eggs pointy-end down in the clean container.',
        'Mix lime into water until cloudy (some settling is normal).',
        'Pour solution over eggs until fully submerged with ~2 in headspace.',
        'Seal and store in a cool, dark place.',
        'Rinse eggs well under water before using.'
      ],
      yield: 'Half-gallon jar ≈ 15–18 eggs. One pound of lime handles many dozens.',
      time: '15–20 minutes',
      safety: 'Store-bought washed eggs will not work — the bloom must be intact. Do not use cracked eggs.',
      related: ['chickens']
    },
    {
      id: 'pressure-can-meat',
      title: 'Pressure Canning Meat (Raw Pack)',
      category: 'preserve',
      tags: ['meat', 'canning', 'pressure', 'pantry', 'beef', 'pork'],
      summary: 'Safe long-term storage of meat for the pantry. Low-acid foods require a pressure canner.',
      materials: [
        'Pressure canner (dial or weighted gauge)',
        'Canning jars, lids, and rings',
        'Fresh meat, trimmed of excess fat',
        'Salt (optional, for flavor only)'
      ],
      ratio: null,
      steps: [
        'Trim meat of gristle, bruised spots, and excess fat. Cut into strips, cubes, or chunks.',
        'Pack raw meat loosely into clean jars. Leave 1¼ in headspace. Do not add liquid.',
        'Add 1 tsp salt per quart if desired (optional).',
        'Wipe rims, apply lids and rings fingertip-tight.',
        'Process in a pressure canner: pints 75 min, quarts 90 min.',
        'Use correct pressure for your elevation and gauge type (typically 10–15 psi).',
        'Let canner depressurize naturally. Check seals after cooling.'
      ],
      yield: 'Varies by jar size. One quart holds roughly 2–3 lb meat.',
      time: 'Prep 30–60 min + processing time + cool-down',
      safety: 'Meat is low-acid. Never use a boiling-water canner for meat. Always follow tested pressure and time for your altitude. Boil home-canned meat 10 min before tasting if seal is uncertain.',
      related: ['pigs', 'cattle']
    },
    {
      id: 'crisp-pickles',
      title: 'Crisp Water-Bath Pickles',
      category: 'preserve',
      tags: ['pickles', 'cucumbers', 'canning', 'water-bath', 'high-acid'],
      summary: 'Classic high-acid pickles that stay crunchy when processed correctly.',
      materials: [
        'Fresh pickling cucumbers',
        'Vinegar (5% acidity)',
        'Water, salt, spices (dill, garlic, mustard seed, etc.)',
        'Canning jars, lids, rings',
        'Boiling-water canner'
      ],
      ratio: 'Typical brine: equal parts vinegar + water + salt to taste (follow a tested recipe for exact amounts)',
      steps: [
        'Wash cucumbers. Trim blossom ends (helps keep them crisp).',
        'Pack jars with cucumbers, garlic, dill, and spices.',
        'Bring brine to a boil. Pour over cucumbers, leaving ½ in headspace.',
        'Remove air bubbles, wipe rims, apply lids and rings.',
        'Process in a boiling-water canner for the time specified in a tested recipe (usually 10–15 min for pints).',
        'Cool upright. Check seals. Store in a cool, dark place.'
      ],
      yield: 'Depends on cucumber size and jar pack.',
      time: '45–90 minutes for a small batch',
      safety: 'Use only tested recipes with proper vinegar acidity. Do not reduce vinegar or alter ratios. Low-acid additions require pressure canning instead.',
      related: ['garden']
    },
    {
      id: 'render-lard',
      title: 'Rendering Lard',
      category: 'dairy',
      tags: ['lard', 'fat', 'pigs', 'cooking', 'storage'],
      summary: 'Turn pork fat into clean, shelf-stable cooking fat.',
      materials: [
        'Fresh pork fat (leaf or back fat preferred)',
        'Heavy pot or slow cooker',
        'Fine mesh strainer or cheesecloth',
        'Clean jars or containers for storage'
      ],
      ratio: null,
      steps: [
        'Cut fat into small, uniform pieces (½ in or smaller). Remove any meat scraps.',
        'Place in a heavy pot or slow cooker with a splash of water to prevent scorching at the start.',
        'Cook low and slow, stirring occasionally, until fat melts and cracklings turn golden.',
        'Strain through cheesecloth or a fine mesh into clean jars.',
        'Cool, then store in a cool place or refrigerator. For long-term, freeze or can.'
      ],
      yield: 'Roughly 70–80% of the starting fat weight as finished lard.',
      time: '2–4 hours depending on quantity and method',
      safety: 'Keep heat moderate to avoid burning. Strain thoroughly. Store properly to prevent rancidity.',
      related: ['pigs']
    },
    {
      id: 'herbal-salve',
      title: 'Basic Herbal Healing Salve',
      category: 'herbal',
      tags: ['salve', 'herbs', 'skin', 'remedy', 'diy'],
      summary: 'Simple infused-oil salve for minor cuts, scrapes, and dry skin.',
      materials: [
        'Dried or fresh herbs (calendula, plantain, comfrey, or similar)',
        'Carrier oil (olive, coconut, or sweet almond)',
        'Beeswax',
        'Clean jars or tins',
        'Double boiler or heat-safe bowl over water'
      ],
      ratio: 'Typical: 1 oz beeswax per 1 cup infused oil (adjust for firmer or softer set)',
      steps: [
        'Infuse herbs in oil: gentle heat for several hours or solar infusion for days. Strain.',
        'Gently warm the infused oil with beeswax until the wax melts completely.',
        'Pour into clean jars or tins. Let cool and solidify.',
        'Label with contents and date.'
      ],
      yield: 'One cup of oil makes several small tins.',
      time: 'Infusion hours to days + 20–30 min to finish',
      safety: 'This is for minor external use only. Not a substitute for medical care on serious wounds or infections. Patch-test new herbs if skin is sensitive.',
      related: []
    },
    {
      id: 'homemade-butter',
      title: 'Homemade Butter',
      category: 'dairy',
      tags: ['butter', 'cream', 'dairy', 'kitchen'],
      summary: 'Turn heavy cream into fresh butter with a jar or mixer.',
      materials: [
        'Heavy cream (preferably not ultra-pasteurized)',
        'Clean jar with tight lid, or stand mixer / food processor',
        'Cold water for washing',
        'Salt (optional)'
      ],
      ratio: null,
      steps: [
        'Pour cream into a jar (half full) or mixer bowl. Let it warm slightly if very cold.',
        'Shake the jar vigorously or whip on medium-high until the cream separates into butter and buttermilk.',
        'Pour off the buttermilk (save it for baking if desired).',
        'Wash the butter by kneading or stirring with cold water until the water runs clear.',
        'Press out remaining liquid. Salt to taste if desired. Shape and store.'
      ],
      yield: '1 pint heavy cream ≈ 6–8 oz butter + buttermilk',
      time: '10–20 minutes',
      safety: 'Use clean equipment. Keep finished butter cold. Fresh butter has a shorter shelf life than commercial.',
      related: ['goats', 'cattle']
    },
    {
      id: 'tomato-options',
      title: 'Tomato Preservation Options',
      category: 'preserve',
      tags: ['tomatoes', 'canning', 'garden', 'sauce', 'freezer'],
      summary: 'Quick ways to put tomatoes away when the harvest hits.',
      materials: [
        'Ripe tomatoes',
        'Canning equipment or freezer containers',
        'Lemon juice or citric acid (for water-bath canning)'
      ],
      ratio: null,
      steps: [
        'Decide method: water-bath canning (whole, crushed, or sauce), freezing, or dehydrating.',
        'For water-bath: follow a tested recipe. Add bottled lemon juice or citric acid for safety (tomatoes are borderline acid).',
        'For freezing: core, blanch or roast if desired, pack into containers leaving headspace.',
        'For sauce: cook down, then can or freeze.',
        'Label everything with date and contents.'
      ],
      yield: 'Varies widely by method and starting volume.',
      time: 'Depends on volume and method — plan a focused session',
      safety: 'Always use tested recipes and acidification for water-bath canned tomatoes. Do not invent ratios.',
      related: ['garden']
    },
    {
      id: 'bone-broth',
      title: 'Simple Bone Broth',
      category: 'kitchen',
      tags: ['broth', 'bones', 'stock', 'kitchen', 'nutrient'],
      summary: 'Long-simmered broth from bones for cooking and sipping.',
      materials: [
        'Bones (chicken, beef, or mixed) — roasted optional',
        'Water to cover',
        'Optional: onion, carrot, celery, vinegar, salt, herbs'
      ],
      ratio: null,
      steps: [
        'Place bones in a large pot or slow cooker. Cover with water by 1–2 inches.',
        'Add a splash of vinegar (helps extract minerals). Optional vegetables and herbs.',
        'Bring to a gentle simmer. Skim foam if desired.',
        'Cook low and slow: chicken 8–12 hr, beef 12–24 hr.',
        'Strain, cool, and refrigerate or freeze. Fat will rise and can be skimmed or kept.'
      ],
      yield: 'Depends on pot size; typically several quarts.',
      time: 'Mostly hands-off simmer time',
      safety: 'Cool and refrigerate promptly. Use clean equipment. Reheat thoroughly.',
      related: ['chickens', 'cattle']
    }
  ];

  const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'preserve', label: 'Preserve' },
    { id: 'dairy', label: 'Dairy & Fats' },
    { id: 'herbal', label: 'Herbal' },
    { id: 'kitchen', label: 'Kitchen' }
  ];

  function search(skills, query, category) {
    const q = (query || '').trim().toLowerCase();
    return skills.filter(s => {
      if (category && category !== 'all' && s.category !== category) return false;
      if (!q) return true;
      const hay = [s.title, s.summary, ...(s.tags || [])].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  window.TractformSkills = {
    SKILLS,
    CATEGORIES,
    search
  };
})();
