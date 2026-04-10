# 养宠 poke 游戏系统设计文档
> 设计目标：休闲养成 + 策略战斗 + 离线挂机 + 长期目标

---

## 一、核心系统模块

### 1.1 宝可梦系统

#### 1.1.1 属性与克制
| 属性 | 克 | 被克 |
|------|------|------|
| 普通 | - | 格斗 |
| 火 | 草/冰/虫/钢 | 水/地面/岩 |
| 水 | 火/地面/岩 | 电/草 |
| 电 | 水/飞 | 地面 |
| 草 | 水/地面/岩 | 火/冰/毒/虫/飞 |
| 冰 | 草/地面/飞/龙 | 火/格斗/岩/钢 |
| 格斗 | 普/飞/毒/虫/超/恶 | 飞/超/恶 |
| 毒 | 草 | 地面/超 |
| 地面 | 火/电/毒/岩/钢 | 水/草/冰 |
| 飞 | 草/格斗/虫 | 电/冰/岩 |
| 超能力 | 格斗/毒 | 虫/幽灵 |
| 虫 | 草/超能力/恶 | 火/飞/岩/毒 |
| 岩 | 火/冰/飞/虫 | 水/草/地/钢 |
| 幽灵 | 超能力/幽灵 | 幽灵/恶 |
| 龙 | 龙 | 冰/龙 |
| 恶 | 超能力/幽灵 | 格斗/虫 |
| 钢 | 火/水/电/钢 | 地/火/斗/钢 |
| 妖精 | 格斗/龙/恶 | 火/毒/钢 |

#### 1.1.2 特性系统
```typescript
// 战斗特性（影响战斗）
const BATTLE_ABILITIES = {
  '茂盛': 'HP<1/3时，草系威力×1.5',
  '猛火': 'HP<1/3时，火系威力×1.5',
  '激流': 'HP<1/3时，水系威力×1.5',
  '叶绿素': '晴天时速度×1.5',
  '雨盘': '雨天时每回合回复1/16 HP',
  '静电': '受到接触攻击时30%使对手麻痹',
  '威吓': '出场时对手攻击-1级',
  '隔音': '不受对手的声音技能影响',
  '魔法防守': '不受对手的变化技能影响',
  '毒刺': '对手接触时30%中毒',
  '坚硬脑袋': '可以无视反作用力伤害使用技能',
  '锐利目光': '命中率不会被降低',
  '健壮胸肌': '防御不会被降低',
  '压迫感': '让对手消耗更多PP',
  '自信过度': '击败对手时攻击+1级',
  '连续攻击': '技能的连击次数变为2~5次',
  '悠游自如': '雨天时速度×1.5',
  '拨沙': '沙暴时速度×2',
  '早起': '出场时速度+1级',
  '蹒跚': '对手攻击-1级',
}

// 非战斗特性（影响野外/挂机）
const FIELD_ABILITIES = {
  '捡拾': '战斗结束后有10%概率捡到道具',
  '逃跑': '一定能从野生宝可梦逃走',
  '穿透': '可以穿透对手的壁障进行攻击',
  '储水': '被水系攻击时回复HP',
  '引火': '被火系攻击时攻击+1级',
  '干燥皮肤': '雨天时回复HP，被火系攻击伤害×1.25',
}
```

#### 1.1.3 状态异常系统
| 状态 | 效果 | 触发条件 |
|------|------|----------|
| 灼伤 | 回合结束损失1/16 HP，物攻-50% | 火系技能30%概率 |
| 中毒 | 回合结束损失1/8 HP | 毒系技能30%概率 |
| 剧毒 | 每回合伤害递增(1/16~16/16) | 毒系技能10%概率 |
| 麻痹 | 速度-50%，25%概率不能动 | 电系技能30%概率 |
| 冰冻 | 不能动，每回合有20%概率解除 | 冰系技能30%概率 |
| 睡眠 | 不能动，1~3回合后解除 | 超能力系技能 |
| 混乱 | 50%概率攻击自己，2~3回合后解除 | 高频技能 |

#### 1.1.4 能力变化系统
```typescript
interface StatStage {
  atk: number;    // 攻击 -6~+6
  def: number;     // 防御
  spa: number;     // 特攻
  spd: number;     // 特防
  spe: number;     // 速度
  accuracy: number; // 命中率
  evasion: number;  // 闪避率
}

// 能力变化计算公式
const statMultiplier = (stage: number): number => {
  if (stage >= 0) return (2 + stage) / 2;  // +1=1.5, +2=2.0, +3=2.5, +4=3.0, +5=3.5, +6=4.0
  return 2 / (2 - stage);  // -1=0.666, -2=0.5, -3=0.4, -4=0.333, -5=0.285, -6=0.25
};
```

---

### 1.2 战斗系统

#### 1.2.1 技能分类
```typescript
enum SkillCategory {
  PHYSICAL = '物理',   // 使用攻击和防御
  SPECIAL = '特殊',     // 使用特攻和特防
  STATUS = '变化'       // 不造成伤害
}

// 技能效果类型
enum SkillEffectType {
  DAMAGE = '伤害',
  HEAL = '回复',
  STAT_CHANGE = '能力变化',
  STATUS = '异常状态',
  BUFF_SELF = '强化自身',
  DEBUFF_ENEMY = '弱化敌人',
  FIELD = '场地效果',
  PRIORITY = '优先度变化',
}

// 优先度表
const PRIORITY = {
  '电光一闪': 1,
  '影子分身': 1,
  '优先拳': 1,
  '必定后手': -1,
  '王牌': -1,
};
```

#### 1.2.2 伤害计算公式
```typescript
const calculateDamage = (params: {
  power: number;           // 技能威力
  level: number;            // 使用者等级
  attack: number;           // 攻击方攻击力
  defense: number;         // 防御方防御力
  stab: number;            // 属性一致加成(1.5或1)
  typeEffectiveness: number; // 属性倍率(0~4)
  critRate: number;        // 暴击率
  burnPenalty: number;     // 灼伤惩罚(0.5或1)
  otherMultipliers: number; // 其他倍率
}) => {
  const base = ((2 * params.level / 5 + 2) * params.power * (params.attack / params.defense)) / 50 + 2;
  const modifiers = params.stab * params.typeEffectiveness * params.critRate * params.burnPenalty * params.otherMultipliers;
  return Math.floor(base * modifiers * (0.85 + Math.random() * 0.15));
};

// 暴击伤害 ×1.5，暴击率 = 等级/512 ≈ 1/16
// 随机数 0.85~1.0
```

#### 1.2.3 战斗流程
```
┌─────────────────────────────────────────────┐
│                 战斗开始                      │
├─────────────────────────────────────────────┤
│ 1. 出场特性触发 (威吓、降速等)               │
│ 2. 天气/场地检查                            │
├─────────────────────────────────────────────┤
│              回合循环                        │
│  ┌─────────────────────────────────────┐   │
│  │ ① 技能选择 / 更换宝可梦 / 道具使用    │   │
│  │ ② 优先度判定                          │   │
│  │ ③ 速度判定 (决定行动顺序)              │   │
│  │ ④ 技能执行                            │   │
│  │   - 命中判定                          │   │
│  │   - 伤害计算                          │   │
│  │   - 追加效果(状态/能力变化)            │   │
│  │ ⑤ 状态结算 (灼伤/中毒伤害)             │   │
│  │ ⑥ 胜负判定                            │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│              战斗结束                        │
│ - 经验值计算                                │
│ - 努力值获得                                │
│ - 道具掉落                                  │
└─────────────────────────────────────────────┘
```

---

### 1.3 挂机系统

#### 1.3.1 自动战斗挂机
```typescript
interface AutoBattleConfig {
  enabled: boolean;           // 是否启用
  targetMap: string;          // 目标地图
  useItems: boolean;          // 是否使用道具回复
  hpThreshold: number;        // HP低于此值使用伤药(默认50%)
  hungerThreshold: number;    // 饱食度低于此值喂食(默认30%)
  stopOnShiny: boolean;       // 遇到闪光是否通知
  stopConditions: {
    coins?: number;           // 收集金币数量
    time?: number;            // 运行时间(分钟)
    exp?: number;             // 获得经验值
    levels?: number;          // 提升等级数
  };
}

// 离线战斗收益计算
const calculateOfflineEarnings = (offlineMinutes: number, config: AutoBattleConfig) => {
  const battlesPerMinute = 2; // 约2分钟/场战斗
  const totalBattles = Math.floor(offlineMinutes / 2);
  
  return {
    exp: totalBattles * 50,      // 基础经验
    coins: totalBattles * 30,    // 基础金币
    catchChance: 0.1,            // 10%概率捕捉成功
    shinyChance: 1/8192,         // 闪光概率
  };
};
```

#### 1.3.2 打工挂机
| 打工类型 | 时间 | 基础收益 | 附加收益 |
|----------|------|----------|----------|
| 轻松打工 | 1分钟 | 50金币 | - |
| 日常兼职 | 5分钟 | 300金币 | 10%道具 |
| 认真工作 | 15分钟 | 1000金币 | 30%道具 |
| 极限挑战 | 60分钟 | 5000金币 | 必定1道具+稀有 |

#### 1.3.3 培育屋托管
```typescript
interface BreedingConfig {
  autoFeed: boolean;    // 饱食度<30%自动喂食(消耗道具)
  autoPlay: boolean;     // 心情<30%自动玩耍
  autoWork: boolean;     // 满状态自动打工
  autoHeal: boolean;    // HP<50%自动使用伤药
  useRareItems: boolean; // 是否使用稀有道具
}
```

---

### 1.4 目标系统

#### 1.4.1 每日任务
```typescript
const DAILY_TASKS = [
  { id: 'catch_1', desc: '捕捉1只宝可梦', reward: { coins: 100, exp: 50 } },
  { id: 'catch_5', desc: '捕捉5只宝可梦', reward: { coins: 500, item: 'pokeball', count: 5 } },
  { id: 'win_battle_3', desc: '赢得3场战斗', reward: { coins: 300, exp: 200 } },
  { id: 'explore_10', desc: '探索10次', reward: { coins: 200, item: 'berry', count: 3 } },
  { id: 'work_1', desc: '完成1次打工', reward: { coins: 150, exp: 100 } },
  { id: 'dungeon_5', desc: '通关5层副本', reward: { coins: 500, item: 'greatball', count: 2 } },
  { id: 'evolve_1', desc: '进化1只宝可梦', reward: { coins: 300, item: 'rare_candy', count: 1 } },
  { id: 'shiny_find', desc: '发现1只闪光', reward: { coins: 1000, item: 'ultraball', count: 3 } },
];

// 重置时间: 每天00:00
```

#### 1.4.2 成就系统
```typescript
const ACHIEVEMENTS = [
  // 收集成就
  { id: 'first_pokemon', name: '初出茅庐', desc: '捕捉第一只宝可梦', reward: 100 },
  { id: 'catch_10', name: '小有所成', desc: '累计捕捉10只', reward: 200 },
  { id: 'catch_100', name: '捕虫少年', desc: '累计捕捉100只', reward: 1000 },
  { id: 'catch_all_1', name: '关东图鉴', desc: '收集齐第1图鉴(25种)', reward: 5000 },
  
  // 战斗成就
  { id: 'first_boss', name: '地区首领', desc: '击败第一个首领', reward: 500 },
  { id: 'boss_all', name: '冠军之路', desc: '击败所有首领', reward: 10000 },
  { id: 'dungeon_10', name: '副本新星', desc: '达到副本10层', reward: 500 },
  { id: 'dungeon_50', name: '副本大师', desc: '达到副本50层', reward: 5000 },
  { id: 'dungeon_100', name: '传说训练师', desc: '达到副本100层', reward: 20000 },
  
  // 养成成就
  { id: 'first_evolve', name: '初次进化', desc: '第一次进化', reward: 200 },
  { id: 'shiny_first', name: '闪光时刻', desc: '遇到第一只闪光', reward: 500 },
  { id: 'perfect_iv', name: '完美基因', desc: '获得一只6V宝可梦', reward: 1000 },
  
  // 收集稀有成就
  { id: 'legendary_1', name: '传说相遇', desc: '捕捉传说宝可梦', reward: 3000 },
  { id: 'shiny_10', name: '闪光收藏家', desc: '收集10只闪光', reward: 5000 },
];

// 成就奖励: 成就点(AP) + 一次性金币奖励
```

#### 1.4.3 排行榜
```typescript
const LEADERBOARDS = [
  { id: 'dungeon_best', name: '副本排行榜', metric: 'dungeonBest', unit: '层' },
  { id: 'total_catch', name: '捕捉排行榜', metric: 'totalCaught', unit: '只' },
  { id: 'shiny_count', name: '闪光排行榜', metric: 'shinyCount', unit: '只' },
  { id: 'total_battles', name: '战绩排行榜', metric: 'totalWins', unit: '胜' },
];
```

#### 1.4.4 赛季系统
```typescript
const SEASON = {
  duration: 30 * 24 * 60 * 60 * 1000, // 30天
  rewards: {
    // 排行榜前10名奖励
    1: { coins: 10000, item: 'masterball', count: 3, badge: '赛季冠军' },
    2: { coins: 5000, item: 'masterball', count: 1, badge: '赛季亚军' },
    3: { coins: 3000, item: 'ultraball', count: 5, badge: '赛季季军' },
    '4-10': { coins: 1000, item: 'greatball', count: 10 },
    // 参与奖励
    'participate': { coins: 500 },
  },
};
```

---

### 1.5 休闲系统

#### 1.5.1 宝可梦展示柜
- 3D旋转展示收集的宝可梦
- 闪光柜单独展示闪光
- 动画播放技能特效
- 背景切换(森林/洞穴/海边等)

#### 1.5.2 图鉴系统
- 地区图鉴分类(关东/成都/芳缘...)
- 捕捉状态追踪
- 稀有度标识
- 地区分布信息

#### 1.5.3 回忆相册
- 战斗精彩瞬间截图
- 捕捉闪光时刻
- 成就达成记录

---

## 二、数据结构设计

### 2.1 宝可梦数据结构
```typescript
interface Pokemon {
  id: string;
  speciesId: number;
  name: string;
  level: number;
  exp: number;
  
  // 状态值
  hp: number;
  maxHp: number;
  
  // 属性
  ivs: BaseStats;      // 个体值 0-31
  evs: BaseStats;      // 努力值 0-252
  nature: NatureType;   // 性格
  
  // 战斗相关
  skills: Skill[];           // 技能(最多4个)
  learnableSkills: Skill[];  // 可学习技能
  ability: string;            // 当前特性
  isHiddenAbility: boolean;
  
  // 状态异常
  status: StatusType | null; // 灼伤/中毒/麻痹/睡眠/冰冻
  statusTurns: number;        // 状态持续回合
  
  // 能力变化
  statStages: StatStage;     // 能力等级 -6~+6
  
  // 外观
  isShiny: boolean;
  
  // 托管状态
  work?: WorkState;
  train?: TrainState;
  
  // 交互
  hunger: number;            // 饱食度 0-100
  happiness: number;          // 心情 0-100
  lastInteraction: number;   // 上次交互时间
}

interface Skill {
  id: string;
  name: string;
  power: number;             // 威力(0=变化技能)
  type: string;              // 属性
  category: SkillCategory;   // 物理/特殊/变化
  maxPp: number;
  pp: number;
  accuracy: number;          // 命中率 0-100
  priority: number;          // 优先度
  effects: SkillEffect[];    // 追加效果
}

interface SkillEffect {
  type: 'status' | 'stat_change' | 'heal' | 'field';
  target: 'enemy' | 'self';
  status?: StatusType;
  stat?: keyof StatStage;
  change?: number;           // 变化等级
  chance?: number;            // 触发概率
  healRate?: number;         // 回复比例
}
```

### 2.2 玩家数据结构
```typescript
interface PlayerData {
  // 基本信息
  id: string;
  name: string;
  createdAt: number;
  
  // 资源
  coins: number;
  inventory: Inventory;
  
  // 宝可梦
  party: Pokemon[];          // 队伍(最多6只)
  box: Pokemon[];            // 仓库(无限)
  battleTeam: string[];     // 出战ID列表
  
  // 进度
  unlockedRooms: number;     // 已解锁培育屋房间
  unlockedMaps: string[];   // 已解锁地图
  defeatedBosses: string[];  // 已击败首领
  dungeonFloor: number;      // 当前副本层数
  dungeonBest: number;       // 最高副本层数
  
  // 统计
  stats: {
    totalCaught: number;
    totalBattles: number;
    totalWins: number;
    totalShinyFound: number;
    totalEvolution: number;
  };
  
  // 目标进度
  dailyTasks: Record<string, number>;  // 每日任务完成进度
  achievements: string[];              // 已达成成就ID
  leaderboardScores: Record<string, number>;
  
  // 挂机配置
  autoBattleConfig: AutoBattleConfig;
  breedingConfig: BreedingConfig;
  
  // 设置
  settings: GameSettings;
}
```

---

## 三、页面结构设计

### 3.1 主页/大菜单
```
┌─────────────────────────────────────────┐
│  🏠 首页                    💰 99999金币 │
├─────────────────────────────────────────┤
│                                         │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐│
│    │ 🌲野外  │  │ 🏰副本  │  │ 🎯任务  ││
│    │  探索   │  │  爬塔   │  │  中心   ││
│    └─────────┘  └─────────┘  └─────────┘│
│                                         │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐│
│    │ 🏠培育  │  │ 📦仓库  │  │ 🎒商店  ││
│    │  培育   │  │  管理   │  │  购物   ││
│    └─────────┘  └─────────┘  └─────────┘│
│                                         │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐│
│    │ 🎰转盘 │  │ 📖图鉴  │  │ ⚙️设置  ││
│    │  抽奖   │  │  百科   │  │  配置   ││
│    └─────────┘  └─────────┘  └─────────┘│
│                                         │
│    ┌─────────┐  ┌─────────┐             │
│    │ 🤖挂机 │  │ 🏆排行 │             │
│    │  自动  │  │  成就   │             │
│    └─────────┘  └─────────┘             │
│                                         │
└─────────────────────────────────────────┘
```

### 3.2 野外探索页面
```
┌─────────────────────────────────────────┐
│  🌲 野外探索                    💰 金币 │
├─────────────────────────────────────────┤
│  📍 常磐森林          [更换地图 ▼]       │
│  "绿色森林..."                           │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐ │
│  │ 🐱 Lv.5 皮卡丘  HP ████████░░ 80% │ │
│  │ 饱食: ████████░░  心情: ██████░░ │ │
│  └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│                                         │
│     [  🔄 探索四周  ]                   │
│                                         │
├─────────────────────────────────────────┤
│  事件显示区:                            │
│  ┌─────────────────────────────────────┐ │
│  │ 💰 发现了50金币！                   │ │
│  └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  👑 首领挑战(需捕捉全部种类解锁)          │
│  ┌───┬───┬───┬───┬───┐                 │
│  │ 🐦│ 🐀│ 🌿│ 🐸│ 🐛│                 │
│  │已 │已 │未 │未 │已 │                 │
│  └───┴───┴───┴───┴───┘                 │
│                                         │
│  [  🎯 挑战首领: 大比鸟  ]              │
└─────────────────────────────────────────┘
```

### 3.3 战斗页面
```
┌─────────────────────────────────────────┐
│  ⚔️ 战斗                    🏆 野外战斗 │
├─────────────────────────────────────────┤
│                    ┌──────────────────┐ │
│                    │ 🦅 Lv.25 大比鸟  │ │
│                    │ HP ████████░░    │ │
│                    │ [特性: 锐利目光] │ │
│                    └──────────────────┘ │
│                          🐦             │
│                                         │
│  ┌──────────────────┐                  │
│  │ ⚡ Lv.20 皮卡丘   │                  │
│  │ HP ██████████    │                  │
│  │ 麻痹: 速度-50%     │                  │
│  │ [特性: 静电]      │                  │
│  └──────────────────┘                  │
│                    ⚡                   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐ │
│  │ ⚡ 电击 Lv.8 威力40 命中率100%       │ │
│  │ 10%使对手麻痹                       │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ 💨 电光一闪 Lv.5 威力40 优先+1      │ │
│  │ 必定先手攻击                         │ │
│  └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  [🔄 换宠] [🎒 背包] [🏃 逃跑]         │
└─────────────────────────────────────────┘
```

### 3.4 挂机页面
```
┌─────────────────────────────────────────┐
│  🤖 自动挂机                  ⚙️ 设置   │
├─────────────────────────────────────────┤
│  状态: ⏸️ 已暂停    [▶️ 开始挂机]       │
│  运行时长: 2小时34分                    │
├─────────────────────────────────────────┤
│  📍 挂机地图: 常磐森林                   │
│  ⚔️ 战绩: 胜 156 / 负 12 (92.8%胜率)    │
│  💰 收益: 4680金币 / 7800经验           │
│  🎯 捕捉: 23只(含1只闪光✨)             │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐ │
│  │ 📊 离线收益预估                     │ │
│  │ 预计离线8小时可获得:                 │ │
│  │ • 💰 约 20000 金币                 │ │
│  │ • ✨ 约 35000 经验值               │ │
│  │ • 🎮 约 80 场战斗                  │ │
│  │ • 📦 约 15% 概率捕捉成功           │ │
│  └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  ⚙️ 自动战斗设置:                        │
│  ┌─────────────────────────────────────┐ │
│  │ ☑️ HP<50%时使用伤药                │ │
│  │ ☑️ 饱食<30%时使用树果              │ │
│  │ ☑️ 遇到闪光时暂停并通知            │ │
│  │ ⚠️ HP<10%时暂停并提示              │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 3.5 任务中心页面
```
┌─────────────────────────────────────────┐
│  🎯 任务中心                 🔄 重置:12h │
├─────────────────────────────────────────┤
│  📅 每日任务                            │
│  ┌─────────────────────────────────────┐ │
│  │ ✅ 捕捉1只宝可梦      +100💰 +50✨  │ │
│  │ 🔄 捕捉5只宝可梦      2/5            │ │
│  │ ⬜ 赢得3场战斗        0/3            │ │
│  │ ⬜ 探索10次           7/10           │ │
│  │ ⬜ 完成1次打工        0/1            │ │
│  └─────────────────────────────────────┘ │
│  今日进度: ████████░░ 80% (4/5)        │
├─────────────────────────────────────────┤
│  🏆 成就进度                            │
│  ┌─────────────────────────────────────┐ │
│  │ 🔓 已解锁: 12/30                     │ │
│  │ 📊 成就点数: 2,350 AP                │ │
│  └─────────────────────────────────────┘ │
│  • 初出茅庐 ✅                          │
│  • 小有所成 ✅                          │
│  • 初次进化 ✅                          │
│  • 捕虫少年 🔒 (已捕捉 85/100)         │
│  • 闪光时刻 🔒 (已发现 0/1)             │
├─────────────────────────────────────────┤
│  📋 进行中目标                          │
│  • 🎯 击败常磐森林首领: 4/8             │
│  • 📈 副本最高层: 35层                  │
│  • ⭐ 收集闪光: 1/10                    │
└─────────────────────────────────────────┘
```

---

## 四、实现优先级

### 第一阶段 (MVP) - 核心循环
1. ✅ 保留现有野外探索与战斗
2. ✅ 完善战斗系统(加入状态异常、能力变化)
3. ✅ 完善挂机系统(离线收益、自动战斗)
4. ✅ 每日任务系统

### 第二阶段 (扩展) - 内容丰富
1. 成就系统与排行榜
2. 赛季系统与奖励
3. 宝可梦展示柜
4. 图鉴系统增强

### 第三阶段 (深度) - 策略深度
1. PVP训练家对战
2. 更多技能与特性
3. 天气与场地效果
4. 道具装备系统

---

## 五、技术实现建议

### 状态管理
```typescript
// 使用Zustand管理全局状态
const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // ... 现有状态
      
      // 新增: 战斗状态
      battle: {
        inBattle: false,
        currentTurn: 0,
        weather: null,
        field: null,
      },
      
      // 新增: 挂机状态
      autoBattle: {
        enabled: false,
        config: defaultAutoConfig,
        sessionStats: {
          startTime: 0,
          battles: 0,
          wins: 0,
          coins: 0,
          exp: 0,
        },
      },
      
      // 新增: 任务状态
      dailyTasks: {},
      achievements: [],
    }),
    { name: 'pokemon-storage' }
  )
);
```

### 离线计算
```typescript
// App启动时计算离线收益
const calculateOfflineProgress = () => {
  const lastSave = localStorage.getItem('lastSaveTime');
  const offlineMs = Date.now() - lastSave;
  const offlineMinutes = offlineMs / 60000;
  
  if (offlineMinutes < 5) return; // 少于5分钟不计算
  
  // 根据挂机配置计算收益
  const { autoBattleConfig, party } = get();
  if (!autoBattleConfig.enabled) return;
  
  const earnings = calculateOfflineEarnings(offlineMinutes, autoBattleConfig);
  
  // 应用收益
  set(state => ({
    coins: state.coins + earnings.coins,
    stats: {
      ...state.stats,
      totalBattles: state.stats.totalBattles + earnings.battles,
    },
  }));
  
  // 更新离线挂机记录
  localStorage.setItem('offlineEarnings', JSON.stringify(earnings));
};
```

---

## 六、附录: 新增道具列表

### 战斗道具
| 道具 | 效果 | 价格 |
|------|------|------|
| 伤药 | 回复30HP | 200 |
| 好伤药 | 回复60HP | 500 |
| 超级伤药 | 回复120HP | 1500 |
| 全复药 | 完全回复HP | 3000 |
| 复活草 | 复活濒死宝可梦 | 2500 |
| 万灵药 | 回复异常状态 | 200 |
| pp单项小补剂 | 单技能PP+10 | 500 |
| pp全补剂 | 恢复所有PP | 1500 |

### 培育道具
| 道具 | 效果 | 价格 |
|------|------|------|
| 树果 | 饱食度+20 | 15 |
| 苹果 | 饱食度+35，心情+5 | 25 |
| 三明治 | 饱食度+60，心情+10 | 60 |
| 玩具 | 心情+20 | 20 |
| 飞盘 | 心情+30 | 40 |

### 进化道具
| 道具 | 可进化宝可梦 | 价格 |
|------|------------|------|
| 火之石 | 六尾、小火马、卡蒂狗 | 2100 |
| 水之石 | 蚊香君、呆呆兽 | 2100 |
| 雷之石 | 皮卡丘 | 2100 |
| 叶之石 | 臭臭花、口呆花 | 2100 |
| 月之石 | 尼多娜、尼多力诺、皮皮 | 2500 |
| 光之石 | - | 3000 |
| 暗之石 | - | 3000 |
| 日之石 | - | 3000 |
| 月之石 | - | 2500 |

### 稀有道具
| 道具 | 效果 | 获取方式 |
|------|------|---------|
| 稀有糖果 | 直接升1级 | 商店/转盘/任务 |
| 金色王冠 | 某项个体值变为31 | 成就奖励 |
| 王者之证 | 击败首领概率翻倍 | Boss掉落 |
| 护符金币 | 金币收益+20% | 商店购买 |
| 计时器 | 逃跑成功率+30% | 商店购买 |
