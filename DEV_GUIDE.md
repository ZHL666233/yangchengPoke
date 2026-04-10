# 养成宝可梦 — 开发文档

> 一个基于 React + TypeScript + Vite 的宝可梦养成类 Web 游戏，移动端优先，支持 PC 浏览器访问。

---

## 目录

- [技术栈](#技术栈)
- [项目结构总览](#项目结构总览)
- [根目录文件说明](#根目录文件说明)
- [src/ 源码目录详解](#src-源码目录详解)
  - [入口文件](#入口文件)
  - [类型与数据层](#类型与数据层)
  - [状态管理](#状态管理)
  - [页面组件](#页面组件)
  - [公共组件](#公共组件)
  - [Hooks 与工具](#hooks-与工具)
- [静态资源](#静态资源)
- [路由系统](#路由系统)
- [构建与部署](#构建与部署)
- [常用开发命令](#常用开发命令)
- [编码规范与踩坑点](#编码规范与踩坑点)

---

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 18.3 |
| 语言 | TypeScript | 5.8 |
| 构建 | Vite | 6.3 |
| 样式 | Tailwind CSS | 3.4 |
| 状态管理 | Zustand | 5.0 |
| 路由 | React Router | 7.3 |
| 动画 | Framer Motion | 11.x |
| 图标 | Lucide React | 0.511 |
| CSS 工具 | clsx + tailwind-merge | 2.x / 3.x |

---

## 项目结构总览

```
yangchengPoke/
├── index.html                 # HTML 入口（含 PC 端适配 CSS）
├── package.json               # 项目配置与依赖
├── vite.config.ts             # Vite 构建配置
├── tsconfig.json              # TypeScript 配置（@/* 路径别名）
├── tailwind.config.js         # Tailwind CSS 配置
├── postcss.config.js          # PostCSS 配置
├── eslint.config.js           # ESLint 配置
├── .github/workflows/deploy.yml  # GitHub Pages 自动部署
│
├── public/                    # 静态资源（不经过构建处理）
│   ├── favicon.svg            # 网站图标
│   ├── items/                 # 道具图标（38 个 SVG）
│   └── pokemon/               # 宝可梦贴图
│       ├── normal/            # 普通形态 PNG（按图鉴编号命名）
│       └── shiny/             # 异色/闪光形态 PNG
│
├── scripts/                   # 辅助脚本
│   ├── download_sprites.mjs           # 下载宝可梦精灵图脚本
│   ├── download-pokemon-images.cjs    # 下载宝可梦图片脚本
│   ├── download-pokemon-assets.mjs    # 下载道具等素材脚本
│   └── dev.mjs                      # 开发辅助脚本
│
└── src/                       # 源代码
    ├── main.tsx               # React 入口
    ├── App.tsx                # 根组件（路由 + BottomNav）
    ├── index.css              # 全局样式
    ├── types.ts               # 核心类型定义 + 游戏数据（79 KB）
    ├── pokemonTypes.ts        # 属性系统数据（属性克制表）
    ├── vite-env.d.ts          # Vite 类型声明
    │
    ├── components/            # 可复用 UI 组件
    ├── pages/                 # 12 个页面组件
    ├── store/                 # Zustand 状态管理
    ├── hooks/                 # 自定义 Hooks
    └── lib/                   # 工具函数
```

---

## 根目录文件说明

### `index.html`
HTML 入口文件。除了标准的 meta 标签外，包含两个重要部分：

1. **安全区域工具类**：`.pt-safe` 和 `.pb-safe`，使用 `env(safe-area-inset-*)` 适配刘海屏
2. **PC 端适配 CSS**：`@media (min-width: 640px)` 下对 `.app-container` 内的字号、间距、圆角等做适度缩小，`max-width: 440px` + `max-height: min(860px, 94vh)` 模拟手机尺寸
3. **viewport 设置**：`maximum-scale=1.0, user-scalable=no` 禁止缩放
4. **Vite 热更新错误处理**：内联 script 监听 HMR 错误

### `vite.config.ts`
- `base: './'` — 构建产物使用相对路径，支持直接打开 `dist/index.html`
- `sourcemap: 'hidden'` — 隐藏 sourcemap（生产环境）
- 插件：`@vitejs/plugin-react` + `vite-tsconfig-paths`（支持 `@/*` 路径别名）

### `tsconfig.json`
- 目标：ES2020
- JSX：`react-jsx`（React 17+ 新 JSX Transform）
- 路径别名：`@/*` → `./src/*`
- `strict: false`（未开启严格模式）

### `tailwind.config.js`
- `darkMode: "class"` — 暗色模式通过 class 切换
- `content`：扫描 `index.html` 和 `src/**/*.{js,ts,jsx,tsx}`

### `.github/workflows/deploy.yml`
GitHub Actions 自动部署到 GitHub Pages 的配置文件。

---

## src/ 源码目录详解

### 入口文件

#### `main.tsx`
React 应用的挂载点。导入全局样式，用 `StrictMode` 包裹 `<App />`，挂载到 `#root` DOM 节点。

#### `App.tsx`
根组件，包含三个核心职责：

1. **路由配置**：使用 `HashRouter`（支持直接打开 dist/index.html），定义 12 条路由
2. **加载画面**：首次访问显示 `LoadingScreen`（资源预加载），完成后缓存到 `sessionStorage`
3. **BottomNav 管理**：根据路由白名单 `['/map', '/play', '/team', '/box', '/menu']` 决定是否显示底部导航栏

```
路由表：
/          → Home.tsx（新手引导/初始宝可梦选择）
/play      → Play.tsx（培育屋）
/map       → Map.tsx（地图导航）
/shop      → Shop.tsx（商店）
/wild      → Wild.tsx（野生遭遇战）
/dungeon   → Dungeon.tsx（副本爬塔）
/wheel     → Wheel.tsx（幸运转盘）
/pokedex   → Pokedex.tsx（图鉴）
/box       → Box.tsx（仓库）
/menu      → Menu.tsx（大菜单）
/team      → Team.tsx（队伍管理）
/settings  → Settings.tsx（设置）
```

#### `index.css`
全局样式文件，包含：
- 隐藏滚动条（`scrollbar-width: none` + `::-webkit-scrollbar`）
- 移动端触摸优化（`overscroll-behavior`、`-webkit-tap-highlight-color`、`touch-action`）
- iOS 安全区域适配（`body` 的 `env(safe-area-inset-*)` padding）
- 禁止文字选择（游戏场景需要）
- 输入框允许选择
- blob 动画关键帧
- 全局字体栈

---

### 类型与数据层

#### `types.ts` — 核心数据定义（79 KB，项目最大的文件）

这是整个游戏的数据核心，包含**类型定义 + 所有游戏静态数据**。

**类型定义：**

| 类型 | 说明 |
|------|------|
| `Skill` | 技能（id、name、power、type、maxPp、pp、description、learnLevel） |
| `Pokemon` | 宝可梦实例（speciesId、level、exp、hp、skills、ivs、evs、nature、ability 等） |
| `BaseStats` | 六项基础能力值（hp、atk、def、spa、spd、spe） |
| `NatureType` | 性格类型（25 种） |
| `ItemId` | 道具 ID 联合类型（28 种道具） |
| `Inventory` | 背包（`Record<ItemId, number>`） |
| `PokedexData` | 图鉴数据（`Record<number, { seen, caught }>`） |
| `GameMap` | 地图配置（name、boss、levelRange、bossLevelBonus 等） |
| `WildPokemon` | 野生宝可梦生成参数 |
| `StarterPokemon` | 御三家配置 |

**常量数据：**

| 常量 | 说明 |
|------|------|
| `STARTERS` | 御三家：妙蛙种子(1)、小火龙(4)、杰尼龟(7) |
| `NATURES` | 25 种性格对应的能力值增减表 |
| `ABILITY_INFO` | 特性说明字典 |
| `SPECIES_INFO` | 物种信息（101 个物种：name、type、evolution、baseStats、skills、abilities） |
| `SKILL_LIBRARY` | 技能库（所有技能的静态数据） |
| `SPECIES_SKILL_TABLE` | 物种-技能学习表（什么等级学什么技能） |
| `ITEMS` | 道具配置字典（名称、描述、价格、效果、分类） |
| `WILD_MAPS` | 8 个地图配置（常磐森林 → 冠军殿堂） |
| `emptyInventory()` | 初始空背包 |

**计算函数：**

| 函数 | 说明 |
|------|------|
| `calculateStats(base, ivs, evs, nature, level, isShiny)` | 根据种族值/个体值/努力值/性格/等级计算最终能力值 |
| `generateRandomIvs()` | 随机生成个体值（0-31） |
| `generateRandomNature()` | 随机生成性格 |
| `generateAbility(speciesId)` | 随机生成特性（普通/隐藏） |
| `getBaseStats(speciesId)` | 获取物种种族值 |
| `canEvolve(speciesId, level)` | 判断是否满足进化条件 |
| `getInitialSkills(speciesId)` | 获取初始技能（等级 1 可学的技能） |
| `checkNewSkills(speciesId, level, currentSkills)` | 升级时检查可学新技能 |
| `getAllLearnedSkills(speciesId, level, currentSkills)` | 获取所有已学会的技能 |
| `getPokemonImageUrl(speciesId)` | 获取宝可梦贴图 URL |
| `isPerfectIv(ivs)` | 判断是否 6V（所有个体值 = 31） |

> **修改注意**：添加新物种需修改 `SPECIES_INFO`；添加新道具需修改 `ItemId`、`ITEMS`、`emptyInventory()`；添加新技能需修改 `SKILL_LIBRARY` 和 `SPECIES_SKILL_TABLE`。

#### `pokemonTypes.ts` — 属性系统（4.5 KB）

独立的属性相关数据文件：

| 导出 | 说明 |
|------|------|
| `SPECIES_TYPES` | 每个物种的属性组合（如 25: ['电']，6: ['火', '飞行']） |
| `getPokemonTypes(speciesId)` | 获取物种属性 |
| `TYPE_CHART` | 18 种属性间的完整克制倍率表 |
| `getTypeEffectiveness(attackType, defenseTypes)` | 计算攻击属性对防御属性组合的总倍率（返回倍率 + 文字标签） |
| `getDefensiveTypeChart(defenseTypes)` | 获取某个防御属性面对所有攻击属性的克制关系 |

---

### 状态管理

#### `store/useGameStore.ts` — Zustand 全局状态（36 KB）

使用 `zustand/persist` 将状态持久化到 `localStorage`，key 为 `pokemon-storage`。

**状态字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `party` | `Pokemon[]` | 队伍中的宝可梦（最多 6 只） |
| `box` | `Pokemon[]` | 仓库中的宝可梦 |
| `battleTeam` | `string[]` | 战斗队伍 ID 列表 |
| `coins` | `number` | 金币 |
| `inventory` | `Inventory` | 道具背包 |
| `pokedex` | `PokedexData` | 图鉴 |
| `unlockedRooms` | `number` | 已解锁培育屋房间数 |
| `unlockedMaps` | `string[]` | 已解锁地图 ID |
| `currentMapId` | `string` | 当前选中地图 |
| `defeatedBosses` | `string[]` | 已击败的 Boss |
| `dungeonFloor` | `number` | 当前副本层数 |
| `dungeonBest` | `number` | 副本最高层数 |
| `dungeonClaimedFloors` | `number[]` | 已领取奖励的副本层 |
| `lastSpinAt` | `number \| null` | 上次转盘时间 |
| `gameStarted` | `boolean` | 是否已开始游戏 |

**核心方法（按分类）：**

- **宝可梦管理**：`adoptPokemon`、`catchPokemon`、`releasePokemon`、`switchPokemon`、`evolvePokemon`、`toggleShiny`
- **队伍管理**：`toggleTeamMember`、`moveTeamMemberUp`、`setSkills`、`autoFillSkills`
- **养成互动**：`feed`、`play`、`work`、`finishWork`、`train`、`finishTrain`
- **战斗相关**：`healTeam`、`restorePp`、`consumeSkillPp`、`restoreTeamHunger`、`restoreTeamHappiness`、`addCoins`、`spendCoins`、`gainExp`
- **道具系统**：`addItem`、`consumeItem`、`useIvItem`
- **图鉴**：`markSeen`
- **地图/副本**：`setCurrentMap`、`unlockMap`、`defeatBoss`、`setDungeonFloor`、`setDungeonBest`、`claimDungeonFloorReward`
- **转盘**：`setLastSpinAt`
- **房间**：`unlockRoom`
- **测试模式**：`test_addLevel`、`test_addCoins`、`test_healAll`、`test_addAllItems` 等

> **修改注意**：添加新道具需要同时在 `types.ts` 和 `useGameStore.ts` 中添加消费逻辑。

---

### 页面组件

#### `pages/Home.tsx` — 新手引导/首页（10 KB）

- 新游戏开始时的欢迎界面
- 选择初始宝可梦（御三家：妙蛙种子、小火龙、杰尼龟）
- 选择昵称后正式开始游戏
- 已开始游戏时直接跳转到地图页

#### `pages/Play.tsx` — 培育屋/养成主玩法（75 KB，最大的页面）

核心养成玩法页面，包含多个视图：

1. **房间列表视图**：展示培育屋中的宝可梦（最多 3 个房间）
   - 每个房间显示宝可梦头像、名字、等级、饱食度、心情
   - 支持放入/取出宝可梦

2. **宝可梦详情视图**：选中房间后进入
   - 喂食（消耗 berry/apple/sandwich 恢复饱食度）
   - 玩耍（消耗 toy/ball/kite/frisbee/yarn 提升心情）
   - 工作（选择打工类型赚取金币，有超时机制）
   - 训练（选择训练强度提升努力值 EV，有超时机制）
   - 使用道具（背包中的道具对宝可梦使用）
   - 进化检查（满足条件时显示进化按钮）
   - 查看详细属性面板（六维能力值、IV、EV、性格、特性）

3. **底部操作面板**：紧贴 BottomNav 上方

#### `pages/Wild.tsx` — 野生遭遇战（79 KB，与 Play 并列最大）

野外探索 + 战斗 + 捕捉 + Boss 战：

1. **探索阶段**：选择地图后遭遇野生宝可梦
2. **战斗系统**：
   - 回合制战斗，选择技能攻击
   - 属性克制计算（使用 `TYPE_CHART`）
   - 暴击、闪避等机制
3. **捕捉系统**：
   - 使用精灵球/超级球/高级球/大师球等
   - 捕捉概率根据 HP 比例和球的类型计算
4. **Boss 战**：
   - 每个地图有 Boss（IV=25，EV=80，大幅加成）
   - 首次击败奖励 500 金币 + 解锁下一地图
5. **队伍切换**：战斗中可以切换宝可梦

#### `pages/Map.tsx` — 地图导航（3.3 KB）

- 展示 8 个地图卡片（常磐森林 → 冠军殿堂）
- 未解锁的地图显示锁定状态
- 点击已解锁地图进入野外探索（跳转 `/wild`）
- 显示副本最高层数

#### `pages/Team.tsx` — 队伍管理（30 KB）

- 队伍列表（最多 6 只宝可梦）
- 宝可梦详情面板（属性、技能、IV、EV）
- 战斗队伍设置（勾选出战宝可梦）
- 交换队伍/仓库位置
- 一键治愈、恢复饱食度/心情
- 使用 IV 道具、进化石
- 切换闪光形态

#### `pages/Box.tsx` — 宝可梦仓库（38 KB）

- 仓库中所有宝可梦的列表
- 宝可梦详情面板（与 Team 类似）
- 操作按钮（释放、放入队伍、一键治愈等）
- 底部固定操作栏（紧贴 BottomNav）

#### `pages/Dungeon.tsx` — 副本爬塔（34 KB）

- 爬塔式副本（每层一个敌人）
- 敌方预览（下一层敌人图标 + 类型 + 能力值柱状图）
- 回合制战斗（与 Wild 类似但无捕捉）
- 每 5 层可领取奖励
- 难度递增（每 10 段提升：普通→困难→精英→大师→传说）
- 确定性种子随机数（同层始终同物种）
- 一键治愈功能

#### `pages/Shop.tsx` — 商店（6.1 KB）

- 道具分类展示（食物、玩具、球类、药品、进化石、IV 道具）
- 购买道具（消耗金币）
- 显示当前金币余额

#### `pages/Wheel.tsx` — 幸运转盘（14 KB）

- 6 小时冷却
- 10 个扇区（金币、道具、经验等奖品）
- 1% 概率获得随机闪光 6V 宝可梦
- `createShiny6VPokemon` 函数

#### `pages/Menu.tsx` — 大菜单（10 KB）

- 功能入口菜单（2 列网格布局）
- 包含：商店、转盘、图鉴、设置等入口
- 显示金币余额

#### `pages/Pokedex.tsx` — 图鉴（4 KB）

- 展示已发现/已捕获的宝可梦
- 按编号排列
- 未发现的位置显示问号

#### `pages/Settings.tsx` — 设置（13 KB）

- 导出存档（生成 .js 文件，`window.__POKEMON_SAVE_DATA__ = {...}`）
- 读取存档（上传文件，支持纯 JSON 和 JS 赋值两种格式）
- 重置存档（二次确认）

---

### 公共组件

| 组件 | 文件 | 说明 |
|------|------|------|
| `BottomNav` | `BottomNav.tsx` | 底部导航栏，5 个 Tab（冒险/培育屋/队伍/仓库/大菜单），`absolute` 定位，`z-50` |
| `PageHeader` | `PageHeader.tsx` | 通用页面头部（标题 + 可选返回按钮 + 右侧插槽），使用 `pt-safe` 适配安全区域 |
| `BaseStatsChart` | `BaseStatsChart.tsx` | 六维能力值柱状图（HP/攻击/防御/特攻/特防/速度，彩色进度条） |
| `PokemonImage` | `PokemonImage.tsx` | 宝可梦图片组件（支持普通/闪光形态切换，显示闪光星星标记） |
| `TypeBadges` | `TypeBadges.tsx` | 属性徽章组件（彩色标签显示宝可梦属性） |
| `ItemImage` | `ItemImage.tsx` | 道具图标组件（根据道具 ID 显示对应 SVG 图标） |
| `Empty` | `Empty.tsx` | 空状态占位组件 |
| `LoadingScreen` | `LoadingScreen.tsx` | 启动加载画面（预加载关键贴图 + 显示游戏 Logo/版本/QQ 群号） |

---

### Hooks 与工具

#### `hooks/useTheme.ts`
主题切换 Hook（当前未深度使用）。

#### `lib/utils.ts`
通用工具函数（`cn` — 合并 Tailwind class 的工具函数，基于 clsx + tailwind-merge）。

---

## 静态资源

### 道具图标 — `public/items/`
38 个 SVG 图标，按道具 ID 命名（如 `berry.svg`、`pokeball.svg`、`fire_stone.svg`）。

### 宝可梦贴图 — `public/pokemon/`
- `normal/` — 普通形态 PNG，按全国图鉴编号命名（`1.png` ~ `151.png` 等）
- `shiny/` — 异色/闪光形态 PNG，同名对应

贴图来源：jsdelivr CDN，通过 `scripts/download_sprites.mjs` 脚本批量下载。

### 下载脚本 — `scripts/`
| 脚本 | 说明 |
|------|------|
| `download_sprites.mjs` | 下载宝可梦精灵图（ESM + fetch API，jsdelivr CDN 源） |
| `download-pokemon-images.cjs` | 下载宝可梦图片（CJS 格式） |
| `download-pokemon-assets.mjs` | 下载道具等素材 |
| `dev.mjs` | 开发辅助脚本 |

---

## 路由系统

使用 React Router v7 的 `HashRouter`，12 条路由：

| 路径 | 页面 | 有 BottomNav |
|------|------|:---:|
| `/` | Home（新手引导） | ✗ |
| `/map` | Map（地图导航） | ✓ |
| `/play` | Play（培育屋） | ✓ |
| `/team` | Team（队伍管理） | ✓ |
| `/box` | Box（仓库） | ✓ |
| `/menu` | Menu（大菜单） | ✓ |
| `/shop` | Shop（商店） | ✗ |
| `/wild` | Wild（野生战斗） | ✗ |
| `/dungeon` | Dungeon（副本） | ✗ |
| `/wheel` | Wheel（转盘） | ✗ |
| `/pokedex` | Pokedex（图鉴） | ✗ |
| `/settings` | Settings（设置） | ✗ |

使用 HashRouter 的原因：构建产物可以直接通过 `dist/index.html` 打开，不依赖服务器路由配置。

---

## 构建与部署

### 构建产物
- `base: './'` — 所有资源使用相对路径
- `sourcemap: 'hidden'` — 生产环境隐藏 sourcemap
- 输出目录：`dist/`

### 部署方式
- **GitHub Pages**：通过 `.github/workflows/deploy.yml` 自动部署
- **本地打开**：直接双击 `dist/index.html` 即可运行
- **局域网访问**：`npx vite --host 0.0.0.0` 然后用 `http://<局域网IP>:5173/` 访问

---

## 常用开发命令

```bash
# 启动开发服务器
npm run dev

# 局域网访问（手机调试）
npx vite --host 0.0.0.0

# 构建生产版本
npm run build

# 预览构建产物
npm run preview

# TypeScript 类型检查（不输出文件）
npm run check

# ESLint 检查
npm run lint

# 下载宝可梦贴图
npm run assets:download
```

---

## 编码规范与踩坑点

### 关键架构约定

1. **状态管理**：所有游戏状态集中在 `useGameStore.ts`，使用 Zustand persist 持久化到 localStorage
2. **数据定义**：所有游戏静态数据（物种、技能、道具、地图）集中在 `types.ts`
3. **移动端优先**：默认样式面向移动端，PC 端通过 `index.html` 的 `sm:` 媒体查询适配
4. **底部导航**：统一在 `App.tsx` 管理，页面不需要自行引入 BottomNav

### 已知踩坑点

1. **useEffect 中修改 Zustand state 可能导致无限循环** → 用 `useRef` 标记避免
2. **CSS absolute 定位元素会覆盖非定位按钮** → 需要 `pointer-events-none`
3. **战斗中按钮区域需要 `shrink-0` + `pointer-events-auto`** 确保始终可点击
4. **HP 复活 Bug**：`hp: Math.min(pokemon.hp + (newStats.hp - pokemon.maxHp), newStats.hp)` 在 hp=0 时会错误恢复 → 需要用 `Math.max(pokemon.hp, 0)` 保护
5. **添加新道具**需要同时修改 `types.ts`（ItemId / ITEMS / emptyInventory）、`useGameStore.ts`（消费方法）、`Shop.tsx`（分类列表）

### 页面布局约定

- 页面容器：`h-[100dvh] overflow-hidden relative`（固定视口高度，内部滚动）
- 顶部安全区域：使用 `pt-safe` class（`max(env(safe-area-inset-top), 10px)`）
- 底部安全区域：使用 `pb-safe` class（`env(safe-area-inset-bottom)`）
- 有 BottomNav 的页面需要在内容区预留 `pb-16`（≈64px）以上的底部空间
- 固定底部元素需要 `shrink-0` 防止被压缩
