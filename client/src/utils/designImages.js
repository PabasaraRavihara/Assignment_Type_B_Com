// Curated high-resolution jewellery photography & luxury vector fallbacks

// High-resolution photography links for Ashadi workshop designs
export const DEFAULT_DESIGN_PHOTOS = {
  'RNG-SMP-01': 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=80', // Classic Smooth 22K Gold Band
  'RNG-DET-02': 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=700&q=80', // Intricate Filigree Gold Ring
  'BRC-DET-01': 'https://images.unsplash.com/photo-1611591475871-332e92c2aa91?auto=format&fit=crop&w=700&q=80', // Hand-Carved Gold Bracelet Bangle
  'NCK-GLD-01': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=80', // Traditional Bridal Gold Necklace
  'RNG-SOL-03': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=80', // 22K Solitaire Prong Ring
  'SLV-RNG-01': 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=700&q=80', // 925 Silver Signet Ring
  'SLV-BRC-02': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=80', // Silver Filigree Cuff Bangle
  'SLV-CHN-03': 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=700&q=80', // 925 Silver Solid Rope Chain
  'PLT-RNG-01': 'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?auto=format&fit=crop&w=700&q=80', // Platinum 950 Precision Band
  'PLT-SOL-02': 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=700&q=80', // Platinum Master Solitaire Ring
  'COIN-SOV-01': 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=700&q=80'  // 22K Sovereign Gold Bullion Coin
};

// Generates an ultra-luxurious, self-contained SVG illustration as fallback data URI
export const getLuxuryJewellerySvg = (category = 'Ring', metalType = 'Gold 22K') => {
  const isPlatinum = metalType?.includes('Platinum') || metalType?.includes('950');
  const isSilver = metalType?.includes('Silver') || metalType?.includes('925');

  // Metal Color Schemes
  let primaryCol = '#f59e0b'; // Gold
  let secondaryCol = '#fef08a';
  let accentCol = '#b45309';
  let bgGradient1 = '#1c1503';
  let bgGradient2 = '#080501';

  if (isPlatinum) {
    primaryCol = '#06b6d4';
    secondaryCol = '#a5f3fc';
    accentCol = '#0891b2';
    bgGradient1 = '#031c24';
    bgGradient2 = '#02090d';
  } else if (isSilver) {
    primaryCol = '#cbd5e1';
    secondaryCol = '#f8fafc';
    accentCol = '#64748b';
    bgGradient1 = '#131a26';
    bgGradient2 = '#05080f';
  }

  const catLower = (category || '').toLowerCase();

  let iconGraphic = '';
  if (catLower.includes('necklace') || catLower.includes('chain')) {
    iconGraphic = `
      <ellipse cx="150" cy="115" rx="85" ry="50" fill="none" stroke="url(#metalG)" stroke-width="8" stroke-dasharray="1 1" />
      <path d="M 65 115 C 65 175, 235 175, 235 115" fill="none" stroke="url(#metalG)" stroke-width="12" stroke-linecap="round" />
      <circle cx="150" cy="180" r="14" fill="url(#metalG)" stroke="${secondaryCol}" stroke-width="2" />
      <polygon points="150,172 154,180 150,188 146,180" fill="#ffffff" />
    `;
  } else if (catLower.includes('bracelet') || catLower.includes('bangle')) {
    iconGraphic = `
      <circle cx="150" cy="120" r="65" fill="none" stroke="url(#metalG)" stroke-width="14" />
      <ellipse cx="150" cy="120" rx="55" ry="55" fill="none" stroke="${bgGradient1}" stroke-width="3" opacity="0.6" />
      <circle cx="150" cy="55" r="9" fill="${secondaryCol}" />
      <path d="M 110 80 Q 150 65 190 80" fill="none" stroke="${secondaryCol}" stroke-width="3" stroke-linecap="round" />
      <path d="M 110 160 Q 150 175 190 160" fill="none" stroke="${secondaryCol}" stroke-width="3" stroke-linecap="round" />
    `;
  } else if (catLower.includes('coin')) {
    iconGraphic = `
      <circle cx="150" cy="120" r="68" fill="url(#metalG)" stroke="${secondaryCol}" stroke-width="4" />
      <circle cx="150" cy="120" r="58" fill="none" stroke="${accentCol}" stroke-width="2" stroke-dasharray="4 3" />
      <circle cx="150" cy="120" r="46" fill="${bgGradient1}" opacity="0.3" />
      <path d="M 150 90 L 157 110 L 178 110 L 161 122 L 167 142 L 150 130 L 133 142 L 139 122 L 122 110 L 143 110 Z" fill="${secondaryCol}" />
    `;
  } else {
    // Default Ring
    iconGraphic = `
      <ellipse cx="150" cy="140" rx="60" ry="32" fill="none" stroke="url(#metalG)" stroke-width="15" />
      <ellipse cx="150" cy="138" rx="48" ry="24" fill="none" stroke="${bgGradient1}" stroke-width="3" opacity="0.6" />
      <!-- Sparkling Gem Crown -->
      <path d="M 132 88 L 168 88 L 178 100 L 150 132 L 122 100 Z" fill="url(#gemG)" stroke="${secondaryCol}" stroke-width="2" />
      <polygon points="132,88 168,88 150,100" fill="#ffffff" opacity="0.7" />
      <polygon points="122,100 132,88 150,100" fill="#a5f3fc" opacity="0.5" />
      <polygon points="178,100 168,88 150,100" fill="#a5f3fc" opacity="0.5" />
      <!-- Sparkle rays -->
      <line x1="150" y1="65" x2="150" y2="78" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
      <line x1="125" y1="74" x2="135" y2="82" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
      <line x1="175" y1="74" x2="165" y2="82" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 220" width="100%" height="100%">
      <defs>
        <radialGradient id="bgG" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="${bgGradient1}" />
          <stop offset="100%" stop-color="${bgGradient2}" />
        </radialGradient>
        <linearGradient id="metalG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${secondaryCol}" />
          <stop offset="40%" stop-color="${primaryCol}" />
          <stop offset="70%" stop-color="${accentCol}" />
          <stop offset="100%" stop-color="${secondaryCol}" />
        </linearGradient>
        <linearGradient id="gemG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="50%" stop-color="#bae6fd" />
          <stop offset="100%" stop-color="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="300" height="220" fill="url(#bgG)" />
      <!-- Subtle luxury grid lines -->
      <circle cx="150" cy="120" r="95" fill="none" stroke="${primaryCol}" stroke-width="1" opacity="0.08" stroke-dasharray="2 4" />
      <circle cx="150" cy="120" r="105" fill="none" stroke="${secondaryCol}" stroke-width="0.5" opacity="0.05" />
      ${iconGraphic}
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
};

// Gets the active display image URL for a design
export const getDesignDisplayImage = (design) => {
  if (!design) return getLuxuryJewellerySvg('Ring', 'Gold 22K');
  if (design.imageUrl && design.imageUrl.trim() !== '') {
    return design.imageUrl;
  }
  if (DEFAULT_DESIGN_PHOTOS[design.code]) {
    return DEFAULT_DESIGN_PHOTOS[design.code];
  }
  return getLuxuryJewellerySvg(design.category || 'Ring', design.metalType || design.goldKarat || 'Gold 22K');
};

// Client-side image compressor for uploaded image files (PNG/JPEG/WEBP)
// Compresses to max 640x480 webp/jpeg to keep payloads lightweight (~30-50KB) and instant
export const processImageFile = (file, maxWidth = 640, maxHeight = 480, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (!file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (JPG, PNG, WEBP).'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        } catch (err) {
          // If canvas fails, fallback to raw data URL
          resolve(e.target.result);
        }
      };
      img.onerror = () => reject(new Error('Could not load image data.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
};
