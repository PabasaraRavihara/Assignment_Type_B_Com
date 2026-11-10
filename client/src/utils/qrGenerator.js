/**
 * Pure JavaScript Zero-Dependency QR Code Generator
 * Generates an SVG or matrix of modules for any text string.
 * Supports standard QR codes with Reed-Solomon Error Correction.
 */

// Galois Field GF(256) log and antilog tables for polynomial division
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(function initGalois() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    LOG_TABLE[val] = i;
    val = (val << 1) ^ (val & 128 ? 0x11d : 0);
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gfMultiply(x, y) {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[x] + LOG_TABLE[y]) % 255];
}

function polyMultiply(p1, p2) {
  const result = new Uint8Array(p1.length + p2.length - 1);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMultiply(p1[i], p2[j]);
    }
  }
  return result;
}

function getGeneratorPolynomial(ecLength) {
  let g = new Uint8Array([1]);
  for (let i = 0; i < ecLength; i++) {
    g = polyMultiply(g, new Uint8Array([1, EXP_TABLE[i]]));
  }
  return g;
}

function calculateErrorCorrection(data, ecLength) {
  const gen = getGeneratorPolynomial(ecLength);
  const msg = new Uint8Array(data.length + ecLength);
  msg.set(data);

  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMultiply(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

// Generate QR Matrix (Version 2: 25x25 or Version 3: 29x29)
export function generateQRMatrix(text) {
  const utf8Bytes = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 128) utf8Bytes.push(code);
    else if (code < 2048) {
      utf8Bytes.push(192 | (code >> 6), 128 | (code & 63));
    } else {
      utf8Bytes.push(224 | (code >> 12), 128 | ((code >> 6) & 63), 128 | (code & 63));
    }
  }

  // Version 2 has 44 total codewords (28 data, 16 EC, level M)
  // Version 3 has 70 total codewords (44 data, 26 EC, level M)
  const isV3 = utf8Bytes.length > 25;
  const version = isV3 ? 3 : 2;
  const size = 17 + version * 4; // V2=25x25, V3=29x29
  const totalDataCodewords = isV3 ? 44 : 28;
  const ecLength = isV3 ? 26 : 16;

  // Mode: Byte (0100)
  const bits = [0, 1, 0, 0];
  // Character count indicator (8 bits for V1-9 in byte mode)
  for (let i = 7; i >= 0; i--) bits.push((utf8Bytes.length >> i) & 1);
  // Data bits
  for (const b of utf8Bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  }
  // Terminator
  for (let i = 0; i < 4 && bits.length < totalDataCodewords * 8; i++) bits.push(0);
  // Byte alignment
  while (bits.length % 8 !== 0) bits.push(0);
  // Pad bytes (0xEC, 0x11)
  const pad = [0xEC, 0x11];
  let padIdx = 0;
  while (bits.length < totalDataCodewords * 8) {
    const p = pad[padIdx % 2];
    for (let i = 7; i >= 0; i--) bits.push((p >> i) & 1);
    padIdx++;
  }

  // Convert bits to data codewords
  const dataCodewords = new Uint8Array(totalDataCodewords);
  for (let i = 0; i < totalDataCodewords; i++) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) byteVal = (byteVal << 1) | bits[i * 8 + j];
    dataCodewords[i] = byteVal;
  }

  const ecCodewords = calculateErrorCorrection(dataCodewords, ecLength);
  const allCodewords = new Uint8Array(totalDataCodewords + ecLength);
  allCodewords.set(dataCodewords);
  allCodewords.set(ecCodewords, totalDataCodewords);

  // Initialize size x size matrix (-1 = unset)
  const matrix = Array(size).fill(0).map(() => Array(size).fill(-1));
  const isReserved = Array(size).fill(0).map(() => Array(size).fill(false));

  function setFinder(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          isReserved[nr][nc] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = (r === 0 || r === 6 || c === 0 || c === 6);
            const isCenter = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
            matrix[nr][nc] = (isBorder || isCenter) ? 1 : 0;
          } else {
            matrix[nr][nc] = 0; // Separator
          }
        }
      }
    }
  }

  // 1. Finder patterns (Top-left, Top-right, Bottom-left)
  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // 2. Alignment pattern for Version 2 (at row 18, col 18) and Version 3 (row 22, col 22)
  const alignPos = isV3 ? 22 : 18;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const nr = alignPos + r;
      const nc = alignPos + c;
      isReserved[nr][nc] = true;
      matrix[nr][nc] = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) ? 1 : 0;
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    isReserved[6][i] = true;
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    isReserved[i][6] = true;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // 4. Dark module
  isReserved[size - 8][8] = true;
  matrix[size - 8][8] = 1;

  // 5. Reserve format info areas around finders
  for (let i = 0; i <= 8; i++) {
    isReserved[8][i] = true;
    isReserved[i][8] = true;
    if (i < 8) isReserved[8][size - 1 - i] = true;
    if (i < 8) isReserved[size - 1 - i][8] = true;
  }

  // 6. Write data bits in two-column zigzag from right to left
  let bitIdx = 0;
  const totalBits = allCodewords.length * 8;
  let upwards = true;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5; // Skip timing column
    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (!isReserved[row][c]) {
          let b = 0;
          if (bitIdx < totalBits) {
            const byteIndex = Math.floor(bitIdx / 8);
            const bitOffset = 7 - (bitIdx % 8);
            b = (allCodewords[byteIndex] >> bitOffset) & 1;
            bitIdx++;
          }
          // Mask pattern 0: (row + col) % 2 === 0
          if ((row + c) % 2 === 0) b ^= 1;
          matrix[row][c] = b;
        }
      }
    }
    upwards = !upwards;
  }

  // 7. Format Information (Mask 0, Level M: 101010000010010)
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  // Around top-left
  const tlCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = tlCoords[i];
    matrix[r][c] = formatBits[i];
  }
  // Bottom-left and Top-right
  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = formatBits[i];
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 8 + i] = formatBits[7 + i];
  }

  return matrix;
}

// Convert matrix to clean SVG string or React element
export function renderQRSVG(text, sizePixels = 160) {
  const matrix = generateQRMatrix(text);
  const n = matrix.length;
  const cellSize = sizePixels / n;

  let pathD = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c] === 1) {
        pathD += `M${c * cellSize},${r * cellSize}h${cellSize}v${cellSize}h-${cellSize}z `;
      }
    }
  }

  return {
    sizePixels,
    matrixSize: n,
    pathD
  };
}
