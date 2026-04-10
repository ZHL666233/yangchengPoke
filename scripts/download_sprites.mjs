// Script to download missing Pokemon sprites using fetch API
// Usage: node scripts/download_sprites.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use jsdelivr CDN (accessible in China)
const BASE_URL = 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork';
const SHINY_BASE_URL = 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/shiny';

const normalDir = path.join(__dirname, '..', 'public', 'pokemon', 'normal');
const shinyDir = path.join(__dirname, '..', 'public', 'pokemon', 'shiny');

// All species IDs that exist in SPECIES_INFO
const allSpeciesIds = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 11, 12,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
  27, 28, 29, 30, 31, 32, 33, 34,
  37, 38, 39, 40, 41, 42, 43, 44, 45,
  46, 47, 48, 49, 50, 51,
  52, 53, 54, 55, 56, 57, 58, 59,
  60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73,
  74, 75, 76, 77, 78, 79, 80, 81, 82,
  86, 87, 90, 92, 93, 94, 95,
  104, 105,
  129, 130, 131,
  133, 134, 135, 136, 137,
  142, 143, 147, 148, 149, 150, 151,
];

async function downloadFile(url, dest) {
  if (fs.existsSync(dest)) {
    return 'skip';
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return `fail (${response.status})`;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(dest, buffer);
    return 'ok';
  } catch (err) {
    return `error: ${err.message}`;
  }
}

async function main() {
  console.log(`Checking ${allSpeciesIds.length} Pokemon sprites (using jsdelivr CDN)...\n`);

  fs.mkdirSync(normalDir, { recursive: true });
  fs.mkdirSync(shinyDir, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const id of allSpeciesIds) {
    const normalUrl = `${BASE_URL}/${id}.png`;
    const shinyUrl = `${SHINY_BASE_URL}/${id}.png`;
    const normalDest = path.join(normalDir, `${id}.png`);
    const shinyDest = path.join(shinyDir, `${id}.png`);

    const r1 = await downloadFile(normalUrl, normalDest);
    const r2 = await downloadFile(shinyUrl, shinyDest);

    if (r1 === 'skip' && r2 === 'skip') {
      skipped++;
    } else {
      if (r1 === 'ok' || r2 === 'ok') downloaded++;
      if (r1 !== 'skip' && r1 !== 'ok') { console.log(`  #${id} normal: ${r1}`); failed++; }
      if (r2 !== 'skip' && r2 !== 'ok') { console.log(`  #${id} shiny: ${r2}`); }
    }
  }

  console.log(`\nDone! Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}`);
}

main();
