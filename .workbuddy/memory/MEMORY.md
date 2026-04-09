# 项目长期记忆

## 项目架构
- React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Zustand 状态管理，localStorage 持久化
- HashRouter 路由（支持直接打开 dist/index.html）
- Framer Motion 动画

## 关键文件
- `src/types.ts` - 核心类型定义、宝可梦数据（SPECIES_INFO）、技能库（SKILL_LIBRARY）、道具（ITEMS）、地图（WILD_MAPS）
- `src/store/useGameStore.ts` - 全局状态管理
- `src/pages/Wild.tsx` - 野外探索/战斗/捕捉/Boss战
- `src/pages/Play.tsx` - 培育屋/宝可梦详情/进化
- `src/pages/Dungeon.tsx` - 副本爬塔
- `src/pages/Team.tsx` - 队伍管理
- `src/pages/Box.tsx` - 仓库管理
- `src/pages/Shop.tsx` - 商店
- `src/pages/Wheel.tsx` - 幸运转盘
- `src/pages/Menu.tsx` - 大菜单（商店/转盘/图鉴/设置入口）
- `src/pages/Home.tsx` - 新手引导+初始宝可梦选择
- `src/pages/Settings.tsx` - 设置（导出/读取/重置存档）

## 已知踩坑点
- useEffect 中修改 Zustand state 可能导致无限循环 → 用 useRef 标记
- CSS absolute 定位元素会覆盖非定位按钮 → 需要 pointer-events-none
- 战斗中按钮区域需要 shrink-0 + pointer-events-auto 确保始终可点击

## 道具系统
- ItemId 是联合类型，添加新道具需同时修改：types.ts（ItemId/ITEMS/emptyInventory）、store（useIvItem等消费方法）、Shop（分类列表）
- IV道具：hp_up/protein/iron/calcium/zinc/carbos，每个提升对应个体值+5（上限31），价格3000金
- 进化石：fire_stone/water_stone/thunder_stone/leaf_stone/moon_stone，价格2100-2500金
- 培育屋背包（bagMode='all'）显示进化石+IV道具，不显示喂食/玩耍道具

## 地图系统
- 8个地图：常磐森林→月见山→红莲岛→紫苑镇→冠军之路→双子岛→华蓝洞窟→冠军殿堂
- bossLevelBonus：map1=15, map2=20, map3=25, map4=30, map5=40, map6=45, map7=50, map8=55
- 每个地图有对应 levelRange 限制野外宝可梦等级
- **野外/Boss等级固定**：不随玩家等级变化。普通野怪 = levelRange 随机，Boss = levelRange[1] + bossLevelBonus

## 物种系统
- 共101个物种（原98个 + 绿毛虫10/铁甲蛹11/巴大蝶12）
- 绿毛虫进化链：10(绿毛虫 Lv.7)→11(铁甲蛹 Lv.10)→12(巴大蝶)
- 虫系技能：bug_bite(虫咬 60power)、string_shot(吐丝)、harden(变硬)、psybeam(幻象光线 65power)

## 贴图系统
- 贴图路径：`public/pokemon/normal/{id}.png` 和 `public/pokemon/shiny/{id}.png`
- 下载脚本：`scripts/download_sprites.mjs`（ESM + fetch API，jsdelivr CDN源，包含全部98个物种）
- 全部98个物种贴图已下载完成（normal + shiny）

## 存档系统
- Zustand persist 存储到 localStorage，key: `pokemon-storage`
- Settings.tsx 支持导出为 .js 文件（`window.__POKEMON_SAVE_DATA__ = {...}`）
- 导出使用 Blob + `<a download>` 直接下载到本地
- 读取使用 `<input type="file">` 用户上传文件，支持纯JSON和JS赋值两种格式
- 重置存档需二次确认

## 移动端适配
- viewport 禁止缩放（maximum-scale=1.0, user-scalable=no）
- overscroll-behavior: none 防 iOS 橡皮筋滚动
- touch-action: manipulation 消除 300ms 点击延迟
- -webkit-tap-highlight-color: transparent 去除 iOS 点击高亮
- env(safe-area-inset-*) 适配刘海屏
- body 禁止文字选择，输入框允许选择

## HP复活Bug
- 多个函数中 `hp: Math.min(pokemon.hp + (newStats.hp - pokemon.maxHp), newStats.hp)` 会在hp=0时错误恢复
- 修复为 `hp: Math.min(Math.max(pokemon.hp, 0) + (newStats.hp - pokemon.maxHp), newStats.hp)`
- 涉及函数：applyExp, gainRandomEv, finishTrain, evolvePokemon, toggleShiny

## 副本系统
- 每层随机生成敌人，等级公式：3 + floor * 1.5（不随玩家等级变化）
- **每层怪物固定**：使用确定性种子随机数（seededRandom(floor * 73856093)），同层始终同物种
- 每5层可领取配置奖励（DUNGEON_FLOOR_REWARDS），store 中 dungeonClaimedFloors 记录已领取
- 战胜后直接进入下一层，无捕捉环节
- 难度曲线 getDungeonDifficulty：每10层一段（普通→困难→精英→大师→传说），增加IV奖励/EV奖励/等级倍率
- 一键治愈：复用 healTeam，费用 = 战斗队伍人数 × 30 金币
- 敌方预览：previewEnemy 函数，层数界面显示下一层敌人图标+类型+能力值柱状图
- 敌方信息面板：与 Wild.tsx 对齐，暗色面板(bg-slate-800) + 我方技能属性克制 + 敌方弱点/抗性

## 6V标签系统
- types.ts 新增 `isPerfectIv(ivs)` 函数，判断6项IV是否全部=31
- 样式：`text-[Npx] font-black text-amber-600 bg-amber-100 px-1 py-px rounded border border-amber-200`
- 已同步到：Team.tsx（队伍列表+详情）、Box.tsx（列表+详情）、Play.tsx（4处）、Dungeon.tsx（出战卡片）、Wild.tsx（战斗+捕捉+队伍列表）

## 幸运转盘
- 6小时CD，10个扇区
- 奖品：100/200/500/1000/2000金币、稀有糖果×3、伤药×10、糖果×20、500/1000经验
- 1%概率获得随机闪光6V宝可梦（1级，自动加入仓库）
- createShiny6VPokemon 函数在 Wheel.tsx 内定义

## Boss系统
- 8个地图各有Boss，bossLevelBonus递增
- Boss IV=25（原随机0-31），EV=80/项，大幅增加难度
- 首次击败给500金币+解锁下一地图，可重复挑战
