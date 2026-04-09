# 城都宝可梦

> 一款基于 React 的宝可梦养成/战斗网页游戏，涵盖探索、捕捉、进化、副本爬塔等核心玩法。

[![Deploy](https://github.com/ZHL666233/yangchengPoke/actions/workflows/deploy.yml/badge.svg)](https://github.com/ZHL666233/yangchengPoke/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 在线体验

**[点击游玩](https://ZHL666233.github.io/yangchengPoke/)**

支持 PC 浏览器和手机浏览器，数据保存在本地 localStorage。

---

## 游戏截图

> TODO: 添加游戏截图

---

## 功能特性

- **初始选择** — 妙蛙种子 / 小火龙 / 杰尼龟 三选一
- **野外探索** — 8 个地区，由常磐森林到冠军殿堂，难度递增
- **Boss 挑战** — 每个地区首领击败后解锁下一区域，可重复挑战
- **宝可梦捕捉** — 击败野生宝可梦后使用精灵球捕捉（含闪光宝可梦）
- **进化系统** — 等级进化 + 进化石进化，覆盖全部进化链
- **养成屋** — 喂食、玩耍、打工赚金币、训练提升努力值
- **副本爬塔** — 无尽层数，每 10 层难度提升，每 5 层领取奖励
- **幸运转盘** — 6 小时 CD，1% 概率获得闪光 6V 宝可梦
- **商店系统** — 6 大分类，精灵球、进化石、IV 道具等
- **图鉴收集** — 101 种宝可梦等你集齐
- **存档管理** — 支持导出 / 导入 / 重置

---

## 技术栈

| 技术 | 用途 |
|------|------|
| [React 18](https://react.dev/) | UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Vite](https://vitejs.dev/) | 构建工具 |
| [Tailwind CSS](https://tailwindcss.com/) | 样式方案 |
| [shadcn/ui](https://ui.shadcn.com/) | UI 组件库 |
| [Zustand](https://zustand-demo.pmnd.rs/) | 状态管理 |
| [Framer Motion](https://www.framer.com/motion/) | 动画引擎 |
| [React Router](https://reactrouter.com/) | 路由（HashRouter） |

---

## 本地开发

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/ZHL666233/yangchengPoke.git
cd yangchengPoke

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开 http://localhost:5173 即可开始游戏。

### 构建

```bash
npm run build
```

构建产物在 `dist/` 目录，可部署到任意静态服务器。

---

## 项目结构

```
src/
├── components/        # 公共组件（TypeBadges、StatBar 等）
├── pages/
│   ├── Home.tsx       # 新手引导 & 初始宝可梦选择
│   ├── Wild.tsx       # 野外探索 / 战斗 / 捕捉 / Boss 战
│   ├── Play.tsx       # 培育屋 / 宝可梦详情 / 进化
│   ├── Dungeon.tsx    # 副本爬塔
│   ├── Team.tsx       # 队伍管理
│   ├── Box.tsx        # 仓库管理
│   ├── Shop.tsx       # 商店
│   ├── Wheel.tsx      # 幸运转盘
│   ├── Menu.tsx       # 大菜单入口
│   └── Settings.tsx   # 设置（存档导出/导入/重置）
├── store/
│   └── useGameStore.ts  # Zustand 全局状态
├── types.ts           # 核心类型、物种数据、技能库、道具、地图
├── pokemonTypes.ts    # 属性定义 & 属性克制表
└── main.tsx           # 入口文件
```

---

## 游戏数据

| 项目 | 数量 |
|------|------|
| 宝可梦物种 | 101 种 |
| 可探索地图 | 8 个 |
| 进化链 | 30+ 条 |
| 技能 | 30+ 个 |
| 属性种类 | 17 种（含完整的属性克制表） |
| 道具 | 25+ 种 |

---

## 部署

### GitHub Pages（自动）

项目已配置 GitHub Actions，推送到 `main` 分支后自动构建部署：

1. Fork 或克隆本仓库
2. 在仓库 Settings → Pages → Source 选择 **GitHub Actions**
3. 推送代码即可

### 其他平台

`npm run build` 生成的 `dist/` 目录可直接部署到：
- Vercel / Netlify
- 腾讯云 COS / 阿里云 OSS + CDN
- Nginx / Apache 等静态服务器

> 项目使用 HashRouter + 相对路径（`base: './'`），无需服务器端重定向配置。

---

## 贡献指南

欢迎贡献！无论是 Bug 修复、新宝可梦、新功能还是优化建议：

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/xxx`
3. 提交更改：`git commit -m 'Add xxx'`
4. 推送分支：`git push origin feature/xxx`
5. 提交 Pull Request

### 添加新宝可梦

需同步修改以下文件：
1. `src/types.ts` — `SPECIES_INFO`（种族值、特性、进化条件）+ `SPECIES_SKILL_TABLE`（技能学习表）+ `SKILL_LIBRARY`（如有新技能）
2. `src/pokemonTypes.ts` — `SPECIES_TYPES`（属性映射）
3. `public/pokemon/normal/` 和 `public/pokemon/shiny/` — 添加贴图
4. `scripts/download_sprites.mjs` — 更新下载脚本 ID 列表

---

## 许可证

[MIT License](LICENSE) — 自由使用、修改和分发。

---

## 致谢

- [PokeAPI](https://pokeapi.co/) — 宝可梦官方数据 API
- [Pokemon Showdown](https://pokemonshowdown.com/) — 属性克制表参考
- [Game Freak / The Pokemon Company](https://www.pokemon.co.jp/) — 原作 IP

---

> 这是一款基于宝可梦 IP 的同人作品，仅供学习和交流使用。宝可梦及其相关知识产权归任天堂 / Game Freak / The Pokemon Company 所有。
