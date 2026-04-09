/**
 * 下载所有宝可梦图片到本地 public/pokemon/ 目录
 * 普通：public/pokemon/normal/{id}.png
 * 闪光：public/pokemon/shiny/{id}.png
 * 
 * 图片源：PokeAPI sprites (GitHub Raw)
 * 普通用 official-artwork，闪光用 shiny official-artwork
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 游戏中所有宝可梦的 speciesId
const SPECIES_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  16, 17, 18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
  37, 38, 39, 40, 41, 42, 43, 44, 45,
  52, 53, 54, 55, 56, 57, 58, 59,
  74, 75, 76, 77, 78, 79, 80, 81, 82,
  92, 93, 94
];

// 图片URL模板
const NORMAL_URL = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const SHINY_URL = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;

// 备选URL
const NORMAL_FALLBACK = (id) => `https://unpkg.com/pokeapi-sprites@2.0.4/sprites/pokemon/other/official-artwork/${id}.png`;
const SHINY_FALLBACK = (id) => `https://unpkg.com/pokeapi-sprites@2.0.4/sprites/pokemon/other/official-artwork/shiny/${id}.png`;

const BASE_DIR = path.join(__dirname, '..', 'public', 'pokemon');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    const request = (urlStr) => {
      const client = urlStr.startsWith('https') ? https : http;
      client.get(urlStr, { 
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 15000
      }, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.close();
          fs.unlinkSync(dest);
          request(response.headers.location);
          return;
        }
        
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          reject(new Error(`HTTP ${response.statusCode} for ${urlStr}`));
          return;
        }
        
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      }).on('error', (err) => {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(err);
      }).on('timeout', () => {
        request.destroy();
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(new Error(`Timeout for ${urlStr}`));
      });
    };
    
    request(url);
  });
}

async function downloadWithFallback(url, fallbackUrl, dest) {
  try {
    await downloadFile(url, dest);
    return url;
  } catch {
    try {
      await downloadFile(fallbackUrl, dest);
      return fallbackUrl;
    } catch (err2) {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      throw err2;
    }
  }
}

async function main() {
  // 确保目录存在
  fs.mkdirSync(path.join(BASE_DIR, 'normal'), { recursive: true });
  fs.mkdirSync(path.join(BASE_DIR, 'shiny'), { recursive: true });
  
  console.log(`开始下载 ${SPECIES_IDS.length} 个宝可梦的图片 (普通 + 闪光)...`);
  
  let success = 0;
  let failed = 0;
  
  // 并发控制：最多同时 5 个
  const CONCURRENCY = 5;
  const queue = [];
  
  for (const id of SPECIES_IDS) {
    queue.push(id);
  }
  
  async function processQueue() {
    while (queue.length > 0) {
      const id = queue.shift();
      const normalDest = path.join(BASE_DIR, 'normal', `${id}.png`);
      const shinyDest = path.join(BASE_DIR, 'shiny', `${id}.png`);
      
      // 下载普通形态
      if (!fs.existsSync(normalDest)) {
        try {
          await downloadWithFallback(NORMAL_URL(id), NORMAL_FALLBACK(id), normalDest);
          console.log(`  ✅ ${id} 普通`);
        } catch {
          console.log(`  ❌ ${id} 普通 - 失败`);
          failed++;
        }
      } else {
        console.log(`  ⏭️  ${id} 普通 - 已存在`);
      }
      
      // 下载闪光形态
      if (!fs.existsSync(shinyDest)) {
        try {
          await downloadWithFallback(SHINY_URL(id), SHINY_FALLBACK(id), shinyDest);
          console.log(`  ✅ ${id} 闪光`);
        } catch {
          console.log(`  ❌ ${id} 闪光 - 失败`);
          failed++;
        }
      } else {
        console.log(`  ⏭️  ${id} 闪光 - 已存在`);
      }
      
      success++;
    }
  }
  
  // 启动并发worker
  const workers = Array.from({ length: CONCURRENCY }, () => processQueue());
  await Promise.all(workers);
  
  console.log(`\n完成！成功: ${success * 2 - failed} / ${SPECIES_IDS.length * 2}，失败: ${failed}`);
}

main().catch(console.error);
