// Manufacturing routes & crafting methods for Ashadi Jewellers
// 1. Fully Handmade (Traditional bench goldsmithing)
// 2. Casting -> Bench (Wax tree investment casting -> craftsman bench cleanup & assembly)
// 3. CNC / Laser -> Bench (Laser 3D metal printing / CNC milled -> craftsman precision finishing)

export const CRAFTING_METHODS = [
  {
    id: 'HANDMADE',
    label: '🔨 Fully Handmade',
    shortLabel: 'Handmade',
    icon: '🔨',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.45)',
    lossCeiling: '3.5% – 4.0%',
    typicalSMT: '120 – 245 min',
    desc: '100% Traditional bench fabrication (Ingot melting, wire rolling mill, hand piercing, flame soldering, claw setting)'
  },
  {
    id: 'CASTING',
    label: '🔥 Casting ➔ Bench',
    shortLabel: 'Casting ➔ Bench',
    icon: '🔥',
    color: '#fb923c',
    bg: 'rgba(251, 146, 60, 0.15)',
    border: 'rgba(251, 146, 60, 0.45)',
    lossCeiling: '2.8% – 3.2%',
    typicalSMT: '60 – 110 min',
    desc: 'Wax tree vacuum induction casting ➔ tree cutoff ➔ craftsman bench cleanup, sprue grinding & stone setting'
  },
  {
    id: 'CNC_LASER',
    label: '⚡ CNC / Laser ➔ Bench',
    shortLabel: 'CNC/Laser ➔ Bench',
    icon: '⚡',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.45)',
    lossCeiling: '1.5% – 2.2%',
    typicalSMT: '25 – 50 min',
    desc: 'Laser 3D metal printing / CNC 5-axis milled ➔ craftsman precision micro-finishing, laser welding check & polish'
  }
];

export const getCraftingMethodInfo = (method) => {
  const m = (method || '').toUpperCase();
  if (m === 'CASTING' || m.includes('CAST')) return CRAFTING_METHODS[1];
  if (m === 'CNC_LASER' || m.includes('CNC') || m.includes('LASER')) return CRAFTING_METHODS[2];
  return CRAFTING_METHODS[0]; // default HANDMADE
};
