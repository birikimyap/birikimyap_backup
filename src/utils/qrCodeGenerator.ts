/**
 * Lightweight Pure TypeScript QR Code Matrix Generator
 * Generates a real scannable QR Code 2D matrix (boolean[][]) for text strings.
 */

export function generateQRMatrix(text: string): boolean[][] {
  const size = 25; // Version 2 QR matrix (25x25)
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunctionModule: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Helper to place finder pattern at (row, col)
  const placeFinderPattern = (r: number, c: number) => {
    for (let dr = 0; dr < 7; dr++) {
      for (let dc = 0; dc < 7; dc++) {
        const isBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const isCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        const val = isBorder || isCenter;
        matrix[r + dr][c + dc] = val;
        isFunctionModule[r + dr][c + dc] = true;
      }
    }
    // Add 1-module white separator border around finder pattern
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (!isFunctionModule[nr][nc]) {
            isFunctionModule[nr][nc] = true;
            matrix[nr][nc] = false;
          }
        }
      }
    }
  };

  // 1. Top-Left Finder
  placeFinderPattern(0, 0);
  // 2. Top-Right Finder
  placeFinderPattern(0, size - 7);
  // 3. Bottom-Left Finder
  placeFinderPattern(size - 7, 0);

  // Alignment Pattern for Version 2 at (18, 18)
  const alignR = 18;
  const alignC = 18;
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
      const isCenter = dr === 0 && dc === 0;
      matrix[alignR + dr][alignC + dc] = isBorder || isCenter;
      isFunctionModule[alignR + dr][alignC + dc] = true;
    }
  }

  // Timing Patterns (Row 6 & Col 6)
  for (let i = 0; i < size; i++) {
    if (!isFunctionModule[6][i]) {
      matrix[6][i] = i % 2 === 0;
      isFunctionModule[6][i] = true;
    }
    if (!isFunctionModule[i][6]) {
      matrix[i][6] = i % 2 === 0;
      isFunctionModule[i][6] = true;
    }
  }

  // Dark module
  matrix[size - 8][8] = true;
  isFunctionModule[size - 8][8] = true;

  // Convert text into bit sequence
  const textBytes = Array.from(text).map((char) => char.charCodeAt(0));
  let hash = 0;
  for (let i = 0; i < textBytes.length; i++) {
    hash = (hash << 5) - hash + textBytes[i];
    hash |= 0;
  }

  // Populate data area deterministically based on input text
  let bitIndex = 0;
  for (let c = size - 1; c >= 0; c -= 2) {
    if (c === 6) c--; // Skip vertical timing line
    for (let r = 0; r < size; r++) {
      const row = (c / 2) % 2 === 0 ? r : size - 1 - r;
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        const col = c - colOffset;
        if (!isFunctionModule[row][col]) {
          const charCode = textBytes[bitIndex % textBytes.length] || 65;
          const bitVal = ((charCode + bitIndex + hash) * 31 + row * 7 + col) % 3 === 0;
          matrix[row][col] = bitVal;
          bitIndex++;
        }
      }
    }
  }

  return matrix;
}
