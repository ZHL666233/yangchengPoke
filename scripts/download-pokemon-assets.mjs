import fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';

const projectRoot = process.cwd();
const typesPath = path.join(projectRoot, 'src', 'types.ts');
const typesText = await fs.readFile(typesPath, 'utf8');

const ids = new Set();

for (const m of typesText.matchAll(/^\s*(\d+):\s*\{/gm)) {
  ids.add(Number(m[1]));
}

const idList = Array.from(ids).filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);

const outNormal = path.join(projectRoot, 'public', 'pokemon', 'normal');
const outShiny = path.join(projectRoot, 'public', 'pokemon', 'shiny');

await fs.mkdir(outNormal, { recursive: true });
await fs.mkdir(outShiny, { recursive: true });

const fetchToFile = (url, filePath) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', async () => {
          await fs.writeFile(filePath, Buffer.concat(chunks));
          resolve();
        });
      })
      .on('error', reject);
  });

const sources = {
  normal: (id) => [
    `https://unpkg.com/pokeapi-sprites@2.0.4/sprites/pokemon/other/official-artwork/${id}.png`,
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
  ],
  shiny: (id) => [
    `https://unpkg.com/pokeapi-sprites@2.0.4/sprites/pokemon/other/official-artwork/shiny/${id}.png`,
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`,
  ],
};

const downloadOne = async (id) => {
  const normalPath = path.join(outNormal, `${id}.png`);
  const shinyPath = path.join(outShiny, `${id}.png`);

  const exists = async (p) =>
    fs
      .access(p)
      .then(() => true)
      .catch(() => false);

  if (!(await exists(normalPath))) {
    let ok = false;
    for (const url of sources.normal(id)) {
      try {
        await fetchToFile(url, normalPath);
        ok = true;
        break;
      } catch {}
    }
    if (!ok) console.warn(`normal missing: ${id}`);
  }

  if (!(await exists(shinyPath))) {
    let ok = false;
    for (const url of sources.shiny(id)) {
      try {
        await fetchToFile(url, shinyPath);
        ok = true;
        break;
      } catch {}
    }
    if (!ok) console.warn(`shiny missing: ${id}`);
  }
};

console.log(`Downloading ${idList.length} species into public/pokemon/...`);

for (const id of idList) {
  await downloadOne(id);
}

console.log('Done');

