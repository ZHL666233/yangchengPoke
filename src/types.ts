export interface Skill {
  id: string;
  name: string;
  power: number; // 基础威力
  type: string;  // 属性 (如: 普通, 火, 水, 草)
  maxPp: number; // 最大使用次数
  pp: number;    // 当前使用次数
  description: string;
  learnLevel?: number; // 学会此技能的等级
}

export type NatureType = '勤奋' | '怕寂寞' | '固执' | '顽皮' | '勇敢' | '大胆' | '坦率' | '淘气' | '乐天' | '悠闲' | '内敛' | '慢吞吞' | '腼腆' | '马虎' | '冷静' | '温和' | '温顺' | '慎重' | '浮躁' | '自大' | '胆小' | '急躁' | '爽朗' | '天真' | '认真';

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface Pokemon {
  id: string;
  speciesId: number;
  name: string;
  level: number;
  exp: number;
  hunger: number;
  happiness: number;
  hp: number;
  maxHp: number;
  skills: Skill[];           // 装备中的技能（最多4个）
  learnableSkills?: Skill[];  // 所有已学会的技能（包含未装备的）
  nature: NatureType;
  ivs: BaseStats;      // 个体值 (0-31)
  evs: BaseStats;      // 努力值 (0-252, total <= 510)
  ability: string;     // 当前特性
  isHiddenAbility: boolean;
  baseStats: BaseStats; // 种族值
  stats: BaseStats;    // 实际属性面板
  lastInteraction: number;
  isShiny?: boolean;
  work?: {
    jobName: string;
    endTime: number;
    reward: number;
    itemChance?: number;
  };
  train?: {
    intensityName: string;
    endTime: number;
    evTotal: number;
  };
}

export const ABILITY_INFO: Record<string, string> = {
  '茂盛': 'HP不满1/3时，草属性招式威力×1.5。',
  '叶绿素': '晴朗天气时，速度会提高。',
  '猛火': 'HP不满1/3时，火属性招式威力×1.5。',
  '太阳之力': '晴朗天气时，特攻会提高，但每回合会损失HP。',
  '激流': 'HP不满1/3时，水属性招式威力×1.5。',
  '雨盘': '下雨天气时，每回合会回复HP。',
  '虫之预感': 'HP不满1/3时，虫属性招式威力×1.5。',
  '狙击手': '击中要害时，伤害倍率进一步提升（暴击伤害×1.5）。',
  '锐利目光': '命中率不会被降低。',
  '健壮胸肌': '防御不会被降低。',
  '逃跑': '一定能从野生宝可梦那儿逃走。',
  '穿透': '可以穿透对手的壁障或替身进行攻击。',
  '威吓': '让对手退缩，降低其攻击。',
  '紧张感': '让对手紧张，使其无法食用树果。',
  '静电': '受到接触类攻击时，有30%概率让对手麻痹。',
  '避雷针': '受到电属性的招式攻击时，不会受到伤害，而是会提高特攻。',
  '压迫感': '让对手感到压迫，使其消耗更多的PP。'
};

export type PokedexData = Record<number, { seen: boolean; caught: boolean }>;

export type ItemId =
  | 'berry'
  | 'apple'
  | 'sandwich'
  | 'toy'
  | 'ball'
  | 'kite'
  | 'candy'
  | 'pokeball'
  | 'greatball'
  | 'ultraball'
  | 'masterball'
  | 'potion'
  | 'rare_candy'
  | 'pokeblock'
  | 'poffin'
  | 'vitamin'
  | 'energy_powder'
  | 'frisbee'
  | 'yarn'
  | 'premium_ball'
  | 'dive_ball'
  | 'timer_ball'
  | 'repeat_ball'
  // IV提升道具
  | 'hp_up'
  | 'protein'
  | 'iron'
  | 'calcium'
  | 'zinc'
  | 'carbos'
  // 进化石道具
  | 'fire_stone'
  | 'water_stone'
  | 'thunder_stone'
  | 'leaf_stone'
  | 'moon_stone';

export type Inventory = Record<ItemId, number>;

export interface StarterPokemon {
  speciesId: number;
  name: string;
  description: string;
  color: string;
}

export const STARTERS: StarterPokemon[] = [
  {
    speciesId: 1,
    name: '妙蛙种子',
    description: '出生后一段时间，背上的种子会吸收养分逐渐长大。',
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  {
    speciesId: 4,
    name: '小火龙',
    description: '尾巴上的火焰代表着它的生命力。如果它精神饱满，火焰就会熊熊燃烧。',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  {
    speciesId: 7,
    name: '杰尼龟',
    description: '出生后需要一段时间才会变硬的龟壳，十分富有弹性。',
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  }
];

export const MAX_HUNGER = 100;
export const MAX_HAPPINESS = 100;
export const EXP_TO_NEXT_LEVEL = (level: number) => level * 50;

export const NATURES: Record<NatureType, { up: keyof BaseStats | null; down: keyof BaseStats | null }> = {
  // Let's use standard Chinese translations:
  // Hardy 勤奋, Lonely 怕寂寞, Brave 勇敢, Adamant 固执, Naughty 顽皮
  // Bold 大胆, Docile 坦率, Relaxed 悠闲, Impish 淘气, Lax 乐天
  // Timid 胆小, Hasty 急躁, Serious 认真, Jolly 爽朗, Naive 天真
  // Modest 内敛, Mild 慢吞吞, Quiet 冷静, Bashful 腼腆, Rash 马虎
  // Calm 温和, Gentle 温顺, Sassy 自大, Careful 慎重, Quirky 浮躁
  '勤奋': { up: null, down: null },
  '怕寂寞': { up: 'atk', down: 'def' },
  '固执': { up: 'atk', down: 'spa' },
  '顽皮': { up: 'atk', down: 'spd' },
  '勇敢': { up: 'atk', down: 'spe' },
  '大胆': { up: 'def', down: 'atk' },
  '坦率': { up: null, down: null },
  '淘气': { up: 'def', down: 'spa' },
  '乐天': { up: 'def', down: 'spd' },
  '悠闲': { up: 'def', down: 'spe' },
  '内敛': { up: 'spa', down: 'atk' },
  '慢吞吞': { up: 'spa', down: 'def' },
  '腼腆': { up: null, down: null }, // Bashful is neutral
  '马虎': { up: 'spa', down: 'spd' },
  '冷静': { up: 'spa', down: 'spe' },
  '温和': { up: 'spd', down: 'atk' },
  '温顺': { up: 'spd', down: 'def' },
  '慎重': { up: 'spd', down: 'spa' },
  '浮躁': { up: null, down: null }, // Quirky is neutral
  '自大': { up: 'spd', down: 'spe' },
  '胆小': { up: 'spe', down: 'atk' },
  '急躁': { up: 'spe', down: 'def' },
  '爽朗': { up: 'spe', down: 'spa' },
  '天真': { up: 'spe', down: 'spd' },
  '认真': { up: null, down: null },
};

export const STAT_NAMES: Record<keyof BaseStats, string> = {
  hp: 'HP',
  atk: '攻击',
  def: '防御',
  spa: '特攻',
  spd: '特防',
  spe: '速度',
};

export const getNatureText = (nature: NatureType): string => {
  const n = NATURES[nature];
  if (!n) return `${nature}`;
  if (!n.up || !n.down) return `${nature} (无影响)`;
  return `${nature} (+${STAT_NAMES[n.up]} -${STAT_NAMES[n.down]})`;
};

export const SPECIES_INFO: Record<number, { 
  name: string; 
  baseStats: BaseStats; 
  abilities: string[]; 
  hiddenAbility: string; 
  evoLevel?: number; 
  evoTo?: number;
  evoCondition?: string;
}> = {
  1: { name: '妙蛙种子', baseStats: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 }, abilities: ['茂盛'], hiddenAbility: '叶绿素', evoLevel: 16, evoTo: 2, evoCondition: '等级 16' },
  2: { name: '妙蛙草', baseStats: { hp: 60, atk: 62, def: 63, spa: 80, spd: 80, spe: 60 }, abilities: ['茂盛'], hiddenAbility: '叶绿素', evoLevel: 32, evoTo: 3, evoCondition: '等级 32' },
  3: { name: '妙蛙花', baseStats: { hp: 80, atk: 82, def: 83, spa: 100, spd: 100, spe: 80 }, abilities: ['茂盛'], hiddenAbility: '叶绿素' },
  4: { name: '小火龙', baseStats: { hp: 39, atk: 52, def: 43, spa: 60, spd: 50, spe: 65 }, abilities: ['猛火'], hiddenAbility: '太阳之力', evoLevel: 16, evoTo: 5, evoCondition: '等级 16' },
  5: { name: '火恐龙', baseStats: { hp: 58, atk: 64, def: 58, spa: 80, spd: 65, spe: 80 }, abilities: ['猛火'], hiddenAbility: '太阳之力', evoLevel: 36, evoTo: 6, evoCondition: '等级 36' },
  6: { name: '喷火龙', baseStats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 }, abilities: ['猛火'], hiddenAbility: '太阳之力' },
  7: { name: '杰尼龟', baseStats: { hp: 44, atk: 48, def: 65, spa: 50, spd: 64, spe: 43 }, abilities: ['激流'], hiddenAbility: '雨盘', evoLevel: 16, evoTo: 8, evoCondition: '等级 16' },
  8: { name: '卡咪龟', baseStats: { hp: 59, atk: 63, def: 80, spa: 65, spd: 80, spe: 58 }, abilities: ['激流'], hiddenAbility: '雨盘', evoLevel: 36, evoTo: 9, evoCondition: '等级 36' },
  9: { name: '水箭龟', baseStats: { hp: 79, atk: 83, def: 100, spa: 85, spd: 105, spe: 78 }, abilities: ['激流'], hiddenAbility: '雨盘' },
  10: { name: '绿毛虫', baseStats: { hp: 45, atk: 30, def: 35, spa: 20, spd: 20, spe: 45 }, abilities: ['虫之预感'], hiddenAbility: '逃跑', evoLevel: 7, evoTo: 11, evoCondition: '等级 7' },
  11: { name: '铁甲蛹', baseStats: { hp: 50, atk: 20, def: 55, spa: 25, spd: 25, spe: 30 }, abilities: ['蜕皮'], hiddenAbility: '脱皮', evoLevel: 10, evoTo: 12, evoCondition: '等级 10' },
  12: { name: '巴大蝶', baseStats: { hp: 60, atk: 45, def: 50, spa: 90, spd: 80, spe: 70 }, abilities: ['虫之预感'], hiddenAbility: '有色眼镜' },
  16: { name: '波波', baseStats: { hp: 40, atk: 45, def: 40, spa: 35, spd: 35, spe: 56 }, abilities: ['锐利目光', '蹒跚'], hiddenAbility: '健壮胸肌', evoLevel: 18, evoTo: 17, evoCondition: '等级 18' },
  17: { name: '比比鸟', baseStats: { hp: 63, atk: 60, def: 55, spa: 50, spd: 50, spe: 71 }, abilities: ['锐利目光', '蹒跚'], hiddenAbility: '健壮胸肌', evoLevel: 36, evoTo: 18, evoCondition: '等级 36' },
  18: { name: '大比鸟', baseStats: { hp: 83, atk: 80, def: 75, spa: 70, spd: 70, spe: 101 }, abilities: ['锐利目光', '蹒跚'], hiddenAbility: '健壮胸肌' },
  19: { name: '小拉达', baseStats: { hp: 30, atk: 56, def: 35, spa: 25, spd: 35, spe: 72 }, abilities: ['逃跑', '毅力'], hiddenAbility: '活力', evoLevel: 20, evoTo: 20, evoCondition: '等级 20' },
  20: { name: '拉达', baseStats: { hp: 55, atk: 81, def: 60, spa: 50, spd: 70, spe: 97 }, abilities: ['逃跑', '毅力'], hiddenAbility: '活力' },
  21: { name: '烈雀', baseStats: { hp: 40, atk: 60, def: 30, spa: 31, spd: 31, spe: 70 }, abilities: ['锐利目光'], hiddenAbility: '狙击手', evoLevel: 20, evoTo: 22, evoCondition: '等级 20' },
  22: { name: '大嘴雀', baseStats: { hp: 65, atk: 90, def: 65, spa: 61, spd: 61, spe: 100 }, abilities: ['锐利目光'], hiddenAbility: '狙击手' },
  23: { name: '阿柏蛇', baseStats: { hp: 35, atk: 60, def: 44, spa: 40, spd: 54, spe: 55 }, abilities: ['威吓', '蜕皮'], hiddenAbility: '紧张感', evoLevel: 22, evoTo: 24, evoCondition: '等级 22' },
  24: { name: '阿柏怪', baseStats: { hp: 60, atk: 95, def: 69, spa: 65, spd: 79, spe: 80 }, abilities: ['威吓', '蜕皮'], hiddenAbility: '紧张感' },
  25: { name: '皮卡丘', baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ['静电'], hiddenAbility: '避雷针', evoLevel: 50, evoTo: 26, evoCondition: '雷之石' },
  26: { name: '雷丘', baseStats: { hp: 60, atk: 90, def: 55, spa: 90, spd: 80, spe: 110 }, abilities: ['静电'], hiddenAbility: '避雷针' },
  27: { name: '穿山鼠', baseStats: { hp: 50, atk: 75, def: 85, spa: 20, spd: 30, spe: 40 }, abilities: ['沙隐'], hiddenAbility: '拨沙', evoLevel: 22, evoTo: 28, evoCondition: '等级 22' },
  28: { name: '穿山王', baseStats: { hp: 75, atk: 100, def: 110, spa: 45, spd: 55, spe: 65 }, abilities: ['沙隐'], hiddenAbility: '拨沙' },
  29: { name: '尼多兰', baseStats: { hp: 55, atk: 47, def: 52, spa: 40, spd: 40, spe: 41 }, abilities: ['毒刺', '斗争心'], hiddenAbility: '活力', evoLevel: 16, evoTo: 30, evoCondition: '等级 16' },
  30: { name: '尼多娜', baseStats: { hp: 70, atk: 62, def: 67, spa: 55, spd: 55, spe: 56 }, abilities: ['毒刺', '斗争心'], hiddenAbility: '活力', evoLevel: 100, evoTo: 31, evoCondition: '月之石' },
  31: { name: '尼多后', baseStats: { hp: 90, atk: 92, def: 87, spa: 75, spd: 85, spe: 76 }, abilities: ['毒刺', '斗争心'], hiddenAbility: '强行' },
  32: { name: '尼多朗', baseStats: { hp: 46, atk: 57, def: 40, spa: 40, spd: 40, spe: 50 }, abilities: ['毒刺', '斗争心'], hiddenAbility: '活力', evoLevel: 16, evoTo: 33, evoCondition: '等级 16' },
  33: { name: '尼多力诺', baseStats: { hp: 61, atk: 72, def: 57, spa: 55, spd: 55, spe: 65 }, abilities: ['毒刺', '斗争心'], hiddenAbility: '活力', evoLevel: 100, evoTo: 34, evoCondition: '月之石' },
  34: { name: '尼多王', baseStats: { hp: 81, atk: 102, def: 77, spa: 85, spd: 75, spe: 85 }, abilities: ['毒刺', '斗争心'], hiddenAbility: '强行' },
  37: { name: '六尾', baseStats: { hp: 38, atk: 41, def: 40, spa: 50, spd: 65, spe: 65 }, abilities: ['引火'], hiddenAbility: '日照', evoLevel: 100, evoTo: 38, evoCondition: '火之石' },
  38: { name: '九尾', baseStats: { hp: 73, atk: 76, def: 75, spa: 81, spd: 100, spe: 100 }, abilities: ['引火'], hiddenAbility: '日照' },
  41: { name: '超音蝠', baseStats: { hp: 40, atk: 45, def: 35, spa: 30, spd: 40, spe: 55 }, abilities: ['精神力'], hiddenAbility: '穿透', evoLevel: 22, evoTo: 42, evoCondition: '等级 22' },
  42: { name: '大嘴蝠', baseStats: { hp: 75, atk: 80, def: 70, spa: 65, spd: 75, spe: 90 }, abilities: ['精神力'], hiddenAbility: '穿透' },
  43: { name: '走路草', baseStats: { hp: 45, atk: 50, def: 55, spa: 75, spd: 65, spe: 30 }, abilities: ['叶绿素'], hiddenAbility: '逃跑', evoLevel: 21, evoTo: 44, evoCondition: '等级 21' },
  44: { name: '臭臭花', baseStats: { hp: 60, atk: 65, def: 70, spa: 85, spd: 75, spe: 40 }, abilities: ['叶绿素'], hiddenAbility: '恶臭', evoLevel: 100, evoTo: 45, evoCondition: '叶之石' },
  45: { name: '霸王花', baseStats: { hp: 75, atk: 80, def: 85, spa: 111, spd: 90, spe: 50 }, abilities: ['叶绿素'], hiddenAbility: '孢子' },
  52: { name: '喵喵', baseStats: { hp: 40, atk: 45, def: 35, spa: 40, spd: 40, spe: 90 }, abilities: ['捡拾', '技术高手'], hiddenAbility: '紧张感', evoLevel: 28, evoTo: 53, evoCondition: '等级 28' },
  53: { name: '猫老大', baseStats: { hp: 65, atk: 70, def: 60, spa: 65, spd: 65, spe: 115 }, abilities: ['柔软', '技术高手'], hiddenAbility: '紧张感' },
  54: { name: '可达鸭', baseStats: { hp: 50, atk: 52, def: 48, spa: 65, spd: 50, spe: 55 }, abilities: ['湿气', '无关天气'], hiddenAbility: '悠游自如', evoLevel: 33, evoTo: 55, evoCondition: '等级 33' },
  55: { name: '哥达鸭', baseStats: { hp: 80, atk: 82, def: 78, spa: 95, spd: 80, spe: 85 }, abilities: ['湿气', '无关天气'], hiddenAbility: '悠游自如' },
  56: { name: '猴怪', baseStats: { hp: 40, atk: 80, def: 35, spa: 35, spd: 45, spe: 70 }, abilities: ['干劲', '愤怒穴甲'], hiddenAbility: '不服输', evoLevel: 28, evoTo: 57, evoCondition: '等级 28' },
  57: { name: '火暴猴', baseStats: { hp: 65, atk: 105, def: 60, spa: 60, spd: 70, spe: 95 }, abilities: ['干劲', '愤怒穴甲'], hiddenAbility: '不服输' },
  58: { name: '卡蒂狗', baseStats: { hp: 55, atk: 70, def: 45, spa: 70, spd: 50, spe: 60 }, abilities: ['威吓', '引火'], hiddenAbility: '正义之心', evoLevel: 100, evoTo: 59, evoCondition: '火之石' },
  59: { name: '风速狗', baseStats: { hp: 90, atk: 110, def: 80, spa: 100, spd: 80, spe: 95 }, abilities: ['威吓', '引火'], hiddenAbility: '正义之心' },
  74: { name: '小拳石', baseStats: { hp: 40, atk: 80, def: 100, spa: 30, spd: 30, spe: 20 }, abilities: ['坚硬脑袋', '结实'], hiddenAbility: '沙隐', evoLevel: 25, evoTo: 75, evoCondition: '等级 25' },
  75: { name: '隆隆石', baseStats: { hp: 55, atk: 95, def: 115, spa: 45, spd: 45, spe: 35 }, abilities: ['坚硬脑袋', '结实'], hiddenAbility: '沙隐', evoLevel: 100, evoTo: 76, evoCondition: '通讯交换' },
  76: { name: '隆隆岩', baseStats: { hp: 80, atk: 120, def: 130, spa: 55, spd: 65, spe: 45 }, abilities: ['坚硬脑袋', '结实'], hiddenAbility: '沙隐' },
  77: { name: '小火马', baseStats: { hp: 50, atk: 85, def: 55, spa: 65, spd: 65, spe: 90 }, abilities: ['逃跑', '引火'], hiddenAbility: '火焰之躯', evoLevel: 40, evoTo: 78, evoCondition: '等级 40' },
  78: { name: '烈焰马', baseStats: { hp: 65, atk: 100, def: 70, spa: 80, spd: 80, spe: 105 }, abilities: ['逃跑', '引火'], hiddenAbility: '火焰之躯' },
  81: { name: '小磁怪', baseStats: { hp: 25, atk: 35, def: 70, spa: 95, spd: 55, spe: 45 }, abilities: ['磁力', '结实'], hiddenAbility: '分析', evoLevel: 30, evoTo: 82, evoCondition: '等级 30' },
  82: { name: '三合一磁怪', baseStats: { hp: 50, atk: 60, def: 95, spa: 120, spd: 70, spe: 70 }, abilities: ['磁力', '结实'], hiddenAbility: '分析' },
  92: { name: '鬼斯', baseStats: { hp: 30, atk: 35, def: 30, spa: 100, spd: 35, spe: 80 }, abilities: ['漂浮'], hiddenAbility: '漂浮', evoLevel: 25, evoTo: 93, evoCondition: '等级 25' },
  93: { name: '鬼斯通', baseStats: { hp: 45, atk: 50, def: 45, spa: 115, spd: 55, spe: 95 }, abilities: ['漂浮'], hiddenAbility: '漂浮', evoLevel: 100, evoTo: 94, evoCondition: '通讯交换' },
  94: { name: '耿鬼', baseStats: { hp: 60, atk: 65, def: 60, spa: 130, spd: 75, spe: 110 }, abilities: ['诅咒之躯'], hiddenAbility: '诅咒之躯' },
  // --- 新增宝可梦 ---
  46: { name: '派拉斯', baseStats: { hp: 35, atk: 70, def: 55, spa: 45, spd: 55, spe: 25 }, abilities: ['孢子'], hiddenAbility: '干燥皮肤', evoLevel: 24, evoTo: 47, evoCondition: '等级 24' },
  47: { name: '派拉斯特', baseStats: { hp: 60, atk: 95, def: 80, spa: 60, spd: 80, spe: 30 }, abilities: ['孢子'], hiddenAbility: '干燥皮肤' },
  48: { name: '毛球', baseStats: { hp: 60, atk: 55, def: 50, spa: 40, spd: 55, spe: 45 }, abilities: ['虫之预感', '复眼'], hiddenAbility: '逃跑', evoLevel: 31, evoTo: 49, evoCondition: '等级 31' },
  49: { name: '摩鲁蛾', baseStats: { hp: 70, atk: 65, def: 60, spa: 90, spd: 75, spe: 90 }, abilities: ['虫之预感', '复眼'], hiddenAbility: '有色眼镜' },
  50: { name: '地鼠', baseStats: { hp: 10, atk: 55, def: 25, spa: 35, spd: 45, spe: 95 }, abilities: ['沙隐', '沙穴'], hiddenAbility: '沙之力', evoLevel: 26, evoTo: 51, evoCondition: '等级 26' },
  51: { name: '三地鼠', baseStats: { hp: 35, atk: 80, def: 50, spa: 50, spd: 70, spe: 120 }, abilities: ['沙隐', '沙穴'], hiddenAbility: '沙之力' },
  60: { name: '蚊香蝌蚪', baseStats: { hp: 40, atk: 50, def: 40, spa: 40, spd: 40, spe: 90 }, abilities: ['储水', '悠游自如'], hiddenAbility: '雨盘', evoLevel: 25, evoTo: 61, evoCondition: '等级 25' },
  61: { name: '蚊香君', baseStats: { hp: 65, atk: 65, def: 65, spa: 50, spd: 50, spe: 90 }, abilities: ['储水', '悠游自如'], hiddenAbility: '雨盘', evoLevel: 36, evoTo: 62, evoCondition: '水之石' },
  62: { name: '蚊香泳士', baseStats: { hp: 90, atk: 85, def: 95, spa: 70, spd: 90, spe: 70 }, abilities: ['储水', '悠游自如'], hiddenAbility: '雨盘' },
  63: { name: '凯西', baseStats: { hp: 25, atk: 20, def: 15, spa: 105, spd: 55, spe: 90 }, abilities: ['同步', '精神力'], hiddenAbility: '魔法防守', evoLevel: 16, evoTo: 64, evoCondition: '等级 16' },
  64: { name: '勇基拉', baseStats: { hp: 40, atk: 35, def: 30, spa: 120, spd: 70, spe: 105 }, abilities: ['同步', '精神力'], hiddenAbility: '魔法防守', evoLevel: 36, evoTo: 65, evoCondition: '等级 36' },
  65: { name: '胡地', baseStats: { hp: 55, atk: 50, def: 45, spa: 135, spd: 95, spe: 120 }, abilities: ['同步', '精神力'], hiddenAbility: '魔法防守' },
  66: { name: '腕力', baseStats: { hp: 70, atk: 80, def: 50, spa: 35, spd: 35, spe: 35 }, abilities: ['怪力'], hiddenAbility: '毅力', evoLevel: 28, evoTo: 67, evoCondition: '等级 28' },
  67: { name: '豪力', baseStats: { hp: 80, atk: 100, def: 70, spa: 50, spd: 60, spe: 45 }, abilities: ['怪力'], hiddenAbility: '毅力', evoLevel: 100, evoTo: 68, evoCondition: '通讯交换' },
  68: { name: '怪力', baseStats: { hp: 90, atk: 130, def: 80, spa: 65, spd: 85, spe: 55 }, abilities: ['怪力'], hiddenAbility: '毅力' },
  69: { name: '喇叭芽', baseStats: { hp: 50, atk: 75, def: 35, spa: 70, spd: 30, spe: 40 }, abilities: ['叶绿素'], hiddenAbility: '食草', evoLevel: 21, evoTo: 70, evoCondition: '等级 21' },
  70: { name: '口呆花', baseStats: { hp: 65, atk: 90, def: 50, spa: 85, spd: 45, spe: 55 }, abilities: ['叶绿素'], hiddenAbility: '食草', evoLevel: 100, evoTo: 71, evoCondition: '叶之石' },
  71: { name: '大食花', baseStats: { hp: 75, atk: 105, def: 65, spa: 100, spd: 70, spe: 70 }, abilities: ['叶绿素'], hiddenAbility: '食草' },
  72: { name: '玛瑙水母', baseStats: { hp: 40, atk: 40, def: 35, spa: 50, spd: 100, spe: 70 }, abilities: ['清澈身躯'], hiddenAbility: '雨盘', evoLevel: 30, evoTo: 73, evoCondition: '等级 30' },
  73: { name: '毒刺水母', baseStats: { hp: 80, atk: 70, def: 65, spa: 80, spd: 120, spe: 100 }, abilities: ['清澈身躯'], hiddenAbility: '雨盘' },
  79: { name: '呆呆兽', baseStats: { hp: 90, atk: 65, def: 65, spa: 40, spd: 40, spe: 15 }, abilities: ['迟钝', '我行我素'], hiddenAbility: '再生力', evoLevel: 37, evoTo: 80, evoCondition: '等级 37' },
  80: { name: '呆壳兽', baseStats: { hp: 95, atk: 75, def: 110, spa: 100, spd: 80, spe: 30 }, abilities: ['迟钝', '我行我素'], hiddenAbility: '再生力' },
  95: { name: '大岩蛇', baseStats: { hp: 35, atk: 45, def: 160, spa: 30, spd: 45, spe: 70 }, abilities: ['坚硬脑袋', '结实'], hiddenAbility: '沙隐', evoLevel: 25, evoTo: 76, evoCondition: '等级 25' },
  104: { name: '卡拉卡拉', baseStats: { hp: 50, atk: 50, def: 95, spa: 40, spd: 50, spe: 35 }, abilities: ['摇滚头', '战斗盔甲'], hiddenAbility: '潮湿之声', evoLevel: 28, evoTo: 105, evoCondition: '等级 28' },
  105: { name: '嘎啦嘎啦', baseStats: { hp: 60, atk: 80, def: 110, spa: 50, spd: 80, spe: 45 }, abilities: ['摇滚头', '战斗盔甲'], hiddenAbility: '潮湿之声' },
  129: { name: '鲤鱼王', baseStats: { hp: 20, atk: 10, def: 55, spa: 15, spd: 20, spe: 80 }, abilities: ['悠游自如'], hiddenAbility: '胆怯', evoLevel: 20, evoTo: 130, evoCondition: '等级 20' },
  130: { name: '暴鲤龙', baseStats: { hp: 95, atk: 125, def: 79, spa: 60, spd: 100, spe: 81 }, abilities: ['威吓', '自信过度'], hiddenAbility: '破格' },
  133: { name: '伊布', baseStats: { hp: 55, atk: 55, def: 50, spa: 45, spd: 65, spe: 55 }, abilities: ['逃跑', '适应力'], hiddenAbility: '危险预知', evoLevel: 100, evoTo: 134, evoCondition: '雷之石' },
  134: { name: '雷精灵', baseStats: { hp: 65, atk: 65, def: 60, spa: 110, spd: 95, spe: 130 }, abilities: ['蓄电'], hiddenAbility: '静电' },
  135: { name: '水精灵', baseStats: { hp: 130, atk: 65, def: 60, spa: 85, spd: 65, spe: 65 }, abilities: ['储水'], hiddenAbility: '治愈之心' },
  136: { name: '火精灵', baseStats: { hp: 65, atk: 130, def: 60, spa: 95, spd: 110, spe: 65 }, abilities: ['猛火'], hiddenAbility: '日照' },
  137: { name: '多边兽', baseStats: { hp: 65, atk: 60, def: 70, spa: 85, spd: 75, spe: 40 }, abilities: ['下载', '纹身'], hiddenAbility: '神奇守护' },
  147: { name: '迷你龙', baseStats: { hp: 41, atk: 64, def: 45, spa: 50, spd: 50, spe: 50 }, abilities: ['蜕皮'], hiddenAbility: '恒净之躯', evoLevel: 30, evoTo: 148, evoCondition: '等级 30' },
  148: { name: '哈克龙', baseStats: { hp: 61, atk: 84, def: 65, spa: 70, spd: 70, spe: 70 }, abilities: ['蜕皮'], hiddenAbility: '恒净之躯', evoLevel: 55, evoTo: 149, evoCondition: '等级 55' },
  149: { name: '快龙', baseStats: { hp: 91, atk: 134, def: 95, spa: 100, spd: 100, spe: 80 }, abilities: ['多鳞'], hiddenAbility: '恒净之躯' },
  143: { name: '卡比兽', baseStats: { hp: 160, atk: 110, def: 65, spa: 65, spd: 110, spe: 30 }, abilities: ['免疫', '厚脂肪'], hiddenAbility: '贪吃鬼' },
  131: { name: '拉普拉斯', baseStats: { hp: 130, atk: 85, def: 80, spa: 85, spd: 95, spe: 60 }, abilities: ['储水', '壳甲'], hiddenAbility: '湿润之躯' },
  142: { name: '化石翼龙', baseStats: { hp: 80, atk: 105, def: 65, spa: 60, spd: 75, spe: 130 }, abilities: ['摇滚头', '压迫感'], hiddenAbility: '坚硬脑袋' },
  150: { name: '超梦', baseStats: { hp: 106, atk: 110, def: 90, spa: 154, spd: 90, spe: 130 }, abilities: ['压迫感'], hiddenAbility: '紧张感' },
  151: { name: '梦幻', baseStats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 }, abilities: ['同步'], hiddenAbility: '治愈之心' },
};

export const SPECIES_BASE_STATS: Record<number, BaseStats> = {}; // Removed, handled by SPECIES_INFO

export const getBaseStats = (speciesId: number): BaseStats => {
  return SPECIES_INFO[speciesId]?.baseStats || { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50 };
};

export const generateAbility = (speciesId: number): { ability: string, isHidden: boolean } => {
  const info = SPECIES_INFO[speciesId];
  if (!info) return { ability: '无', isHidden: false };
  // 10% chance for Hidden Ability
  if (Math.random() < 0.1 && info.hiddenAbility) {
    return { ability: info.hiddenAbility, isHidden: true };
  }
  const normalAbilities = info.abilities;
  const selected = normalAbilities[Math.floor(Math.random() * normalAbilities.length)];
  return { ability: selected, isHidden: false };
};

export interface GameMap {
  id: string;
  name: string;
  description: string;
  wildPool: number[]; // Species IDs
  bossId?: number; // Species ID of the boss
  bossLevelBonus: number; // Boss level = player level + this bonus
  unlocksMap?: string; // Map ID unlocked after defeating boss
  levelRange: [number, number]; // Fixed wild Pokemon level range
  background?: string; // CSS class for map background
}

export const WILD_MAPS: Record<string, GameMap> = {
  map1: {
    id: 'map1',
    name: '常磐森林',
    description: '充满着虫属性和草属性宝可梦的茂密森林。',
    wildPool: [16, 19, 43, 1, 46, 48, 21, 10], // Pidgey, Rattata, Oddish, Bulbasaur, Paras, Venonat, Spearow, Caterpie
    bossId: 18, // Pidgeot
    bossLevelBonus: 15,
    unlocksMap: 'map2',
    levelRange: [3, 7],
    background: 'bg-gradient-to-b from-green-100 via-emerald-50 to-white',
  },
  map2: {
    id: 'map2',
    name: '月见山',
    description: '漆黑的洞穴，有很多岩石和毒属性宝可梦。',
    wildPool: [23, 27, 41, 74, 4, 46, 95, 50], // Ekans, Sandshrew, Zubat, Geodude, Charmander, Paras, Onix, Diglett
    bossId: 94, // Gengar
    bossLevelBonus: 20,
    unlocksMap: 'map3',
    levelRange: [8, 14],
    background: 'bg-gradient-to-b from-slate-200 via-slate-100 to-white',
  },
  map3: {
    id: 'map3',
    name: '红莲岛',
    description: '四周被海水环绕的火山岛，火和水属性宝可梦栖息于此。',
    wildPool: [7, 37, 54, 58, 77, 81, 60, 72, 129, 63], // Squirtle, Vulpix, Psyduck, Growlithe, Ponyta, Magnemite, Poliwag, Tentacool, Magikarp, Abra
    bossId: 6, // Charizard
    bossLevelBonus: 25,
    unlocksMap: 'map4',
    levelRange: [15, 22],
    background: 'bg-gradient-to-b from-orange-100 via-amber-50 to-white',
  },
  map4: {
    id: 'map4',
    name: '紫苑镇',
    description: '神秘的城镇，据说有幽灵出没。超能力和幽灵属性宝可梦较多。',
    wildPool: [92, 93, 25, 52, 56, 21, 63, 69, 79, 104], // Gastly, Haunter, Pikachu, Meowth, Mankey, Spearow, Abra, Bellsprout, Slowpoke, Cubone
    bossId: 26, // Raichu
    bossLevelBonus: 30,
    unlocksMap: 'map5',
    levelRange: [20, 28],
    background: 'bg-gradient-to-b from-violet-100 via-purple-50 to-white',
  },
  map5: {
    id: 'map5',
    name: '冠军之路',
    description: '通往冠军殿堂的最后考验，只有最强的训练家才能抵达。',
    wildPool: [78, 57, 76, 53, 82, 59, 68, 73, 66, 47], // Rapidash, Primeape, Golem, Persian, Magneton, Arcanine, Machamp, Tentacruel, Machop, Parasect
    bossId: 9, // Blastoise
    bossLevelBonus: 40,
    unlocksMap: 'map6',
    levelRange: [28, 38],
    background: 'bg-gradient-to-b from-red-50 via-rose-50 to-white',
  },
  map6: {
    id: 'map6',
    name: '双子岛',
    description: '终年积雪的极北孤岛，水属性和冰属性宝可梦栖息于此。',
    wildPool: [7, 60, 72, 95, 47, 48, 131, 54, 129, 25], // Squirtle, Poliwag, Tentacool, Onix, Parasect, Venonat, Lapras, Psyduck, Magikarp, Pikachu
    bossId: 131, // Lapras
    bossLevelBonus: 45,
    unlocksMap: 'map7',
    levelRange: [32, 42],
    background: 'bg-gradient-to-b from-cyan-100 via-sky-50 to-white',
  },
  map7: {
    id: 'map7',
    name: '华蓝洞窟',
    description: '深不见底的巨大洞窟，水属性和格斗属性宝可梦出没。',
    wildPool: [60, 61, 66, 67, 50, 51, 72, 73, 147], // Poliwag, Poliwhirl, Machop, Machoke, Diglett, Dugtrio, Tentacool, Tentacruel, Dratini
    bossId: 149, // Dragonite
    bossLevelBonus: 50,
    unlocksMap: 'map8',
    levelRange: [36, 46],
    background: 'bg-gradient-to-b from-blue-100 via-indigo-50 to-white',
  },
  map8: {
    id: 'map8',
    name: '冠军殿堂',
    description: '传说中的训练家圣地，只有击败所有地区首领的人才能进入。',
    wildPool: [130, 149, 143, 134, 136, 150, 67, 68, 47], // Gyarados, Dragonite, Snorlax, Jolteon, Flareon, Mewtwo, Machoke, Machamp, Parasect
    bossId: 150, // Mewtwo
    bossLevelBonus: 55,
    levelRange: [42, 55],
    background: 'bg-gradient-to-b from-amber-100 via-yellow-50 to-white',
  },
};

export const canEvolve = (speciesId: number, level: number): number | null => {
  const info = SPECIES_INFO[speciesId];
  if (!info || !info.evoTo || !info.evoCondition) return null;
  
  const levelMatch = info.evoCondition.match(/等级 (\d+)/);
  if (levelMatch) {
    const requiredLevel = parseInt(levelMatch[1], 10);
    if (level >= requiredLevel) return info.evoTo;
  }
  
  return null;
};

export const emptyEvs = (): BaseStats => ({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });

export const calculateStats = (base: BaseStats, ivs: BaseStats, evs: BaseStats, nature: NatureType, level: number, isShiny: boolean = false): BaseStats => {
  evs = evs || emptyEvs();
  ivs = ivs || emptyEvs();

  // Apply 10% bonus to base stats if shiny
  const actualBase = isShiny ? {
    hp: Math.floor(base.hp * 1.1),
    atk: Math.floor(base.atk * 1.1),
    def: Math.floor(base.def * 1.1),
    spa: Math.floor(base.spa * 1.1),
    spd: Math.floor(base.spd * 1.1),
    spe: Math.floor(base.spe * 1.1),
  } : base;

  const hp = Math.floor(((2 * actualBase.hp + ivs.hp + Math.floor(evs.hp / 4)) * level) / 100) + level + 10;
  
  const calcStat = (stat: keyof BaseStats) => {
    let val = Math.floor(((2 * actualBase[stat] + ivs[stat] + Math.floor(evs[stat] / 4)) * level) / 100) + 5;
    
    // Apply nature modifier
    const natureInfo = NATURES[nature];
    if (natureInfo && natureInfo.up === stat) {
      val = Math.floor(val * 1.1);
    } else if (natureInfo && natureInfo.down === stat) {
      val = Math.floor(val * 0.9);
    }
    
    return val;
  };

  return {
    hp,
    atk: calcStat('atk'),
    def: calcStat('def'),
    spa: calcStat('spa'),
    spd: calcStat('spd'),
    spe: calcStat('spe'),
  };
};

export const generateRandomIvs = (): BaseStats => {
  const rand = () => Math.floor(Math.random() * 32);
  return { hp: rand(), atk: rand(), def: rand(), spa: rand(), spd: rand(), spe: rand() };
};

export const generateRandomNature = (): NatureType => {
  const natures = Object.keys(NATURES) as NatureType[];
  return natures[Math.floor(Math.random() * natures.length)];
};

export const SKILL_LIBRARY: Record<string, Omit<Skill, 'pp'>> = {
  tackle: { id: 'tackle', name: '撞击', power: 40, type: '普通', maxPp: 35, description: '用整个身体撞向对手进行攻击。', learnLevel: 1 },
  scratch: { id: 'scratch', name: '抓', power: 40, type: '普通', maxPp: 35, description: '用坚硬且无比锋利的爪子抓对手进行攻击。', learnLevel: 1 },
  ember: { id: 'ember', name: '火花', power: 40, type: '火', maxPp: 25, description: '向对手发射小型火焰进行攻击。10%概率使对手灼伤。', learnLevel: 4 },
  water_gun: { id: 'water_gun', name: '水枪', power: 40, type: '水', maxPp: 25, description: '向对手猛烈地喷射水流进行攻击。', learnLevel: 4 },
  vine_whip: { id: 'vine_whip', name: '藤鞭', power: 45, type: '草', maxPp: 25, description: '用如同鞭子般细长的藤蔓摔打对手进行攻击。', learnLevel: 4 },
  razor_leaf: { id: 'razor_leaf', name: '飞叶快刀', power: 55, type: '草', maxPp: 25, description: '飞出叶片，切裂对手进行攻击。容易击中要害。', learnLevel: 13 },
  flamethrower: { id: 'flamethrower', name: '喷射火焰', power: 90, type: '火', maxPp: 15, description: '向对手发射烈焰进行攻击。10%概率使对手灼伤。', learnLevel: 20 },
  hydro_pump: { id: 'hydro_pump', name: '水炮', power: 110, type: '水', maxPp: 5, description: '向对手猛烈地喷射大量水流进行攻击。', learnLevel: 25 },
  solar_beam: { id: 'solar_beam', name: '日光束', power: 120, type: '草', maxPp: 10, description: '第1回合收集满满的日光，第2回合发射光束进行攻击。', learnLevel: 28 },
  hyper_beam: { id: 'hyper_beam', name: '破坏光线', power: 150, type: '普通', maxPp: 5, description: '向对手发射强烈的光线进行攻击。下一回合自己将无法动弹。', learnLevel: 36 },
  thunder_shock: { id: 'thunder_shock', name: '电击', power: 40, type: '电', maxPp: 30, description: '发出电流刺激对手进行攻击。10%概率使对手麻痹。', learnLevel: 1 },
  thunderbolt: { id: 'thunderbolt', name: '十万伏特', power: 90, type: '电', maxPp: 15, description: '向对手发出强力电击进行攻击。10%概率使对手麻痹。', learnLevel: 15 },
  take_down: { id: 'take_down', name: '猛撞', power: 90, type: '普通', maxPp: 20, description: '以惊人的气势撞向对手进行攻击。自己也会受到少许伤害。', learnLevel: 10 },
  // --- 新增技能 ---
  quick_attack: { id: 'quick_attack', name: '电光一闪', power: 40, type: '普通', maxPp: 30, description: '以迅雷不及掩耳之势扑向对手。必定先手攻击。', learnLevel: 5 },
  poison_sting: { id: 'poison_sting', name: '毒针', power: 15, type: '毒', maxPp: 35, description: '向对手射出有毒的细针进行攻击。30%概率使对手中毒。', learnLevel: 1 },
  bite: { id: 'bite', name: '咬住', power: 60, type: '恶', maxPp: 25, description: '用锋利的牙齿咬住对手进行攻击。30%概率使对手畏缩。', learnLevel: 8 },
  wing_attack: { id: 'wing_attack', name: '翅膀攻击', power: 60, type: '飞行', maxPp: 35, description: '用大大的翅膀拍打对手进行攻击。', learnLevel: 7 },
  peck: { id: 'peck', name: '啄', power: 35, type: '飞行', maxPp: 35, description: '用尖锐的喙啄对手进行攻击。', learnLevel: 1 },
  sand_attack: { id: 'sand_attack', name: '泼沙', power: 0, type: '地面', maxPp: 15, description: '向对手脸部泼沙子，降低命中率。', learnLevel: 5 },
  fury_swipes: { id: 'fury_swipes', name: '乱抓', power: 18, type: '普通', maxPp: 15, description: '用爪子疯狂抓对手进行2~5次攻击。', learnLevel: 10 },
  confusion: { id: 'confusion', name: '念力', power: 50, type: '超能力', maxPp: 25, description: '向对手发送微弱的念力进行攻击。10%概率使对手混乱。', learnLevel: 8 },
  ghost_attack: { id: 'ghost_attack', name: '舌舔', power: 30, type: '幽灵', maxPp: 30, description: '用长长的舌头舔对手进行攻击。30%概率使对手麻痹。', learnLevel: 5 },
  shadow_ball: { id: 'shadow_ball', name: '暗影球', power: 80, type: '幽灵', maxPp: 15, description: '投掷一团黑影进行攻击。20%概率降低对手特防。', learnLevel: 22 },
  rock_throw: { id: 'rock_throw', name: '落石', power: 50, type: '岩石', maxPp: 15, description: '向对手投掷大块岩石进行攻击。', learnLevel: 6 },
  fire_spin: { id: 'fire_spin', name: '火焰旋涡', power: 35, type: '火', maxPp: 15, description: '将对手困在火焰旋涡中4~5回合进行攻击。', learnLevel: 12 },
  water_pulse: { id: 'water_pulse', name: '水之波动', power: 60, type: '水', maxPp: 20, description: '向对手发出水的振动进行攻击。20%概率使对手混乱。', learnLevel: 10 },
  sludge: { id: 'sludge', name: '污泥攻击', power: 65, type: '毒', maxPp: 20, description: '向对手投掷不干净的污泥进行攻击。30%概率使对手中毒。', learnLevel: 12 },
  mega_drain: { id: 'mega_drain', name: '吸取', power: 40, type: '草', maxPp: 15, description: '吸取对手的养分。给对手伤害的一半回复自己的HP。', learnLevel: 10 },
  spark: { id: 'spark', name: '电光', power: 65, type: '电', maxPp: 20, description: '让电流覆盖全身后撞向对手进行攻击。30%概率使对手麻痹。', learnLevel: 10 },
  karate_chop: { id: 'karate_chop', name: '空手劈', power: 50, type: '格斗', maxPp: 25, description: '用锋利的手刀劈向对手进行攻击。容易击中要害。', learnLevel: 6 },
  seismic_toss: { id: 'seismic_toss', name: '地球上投', power: 0, type: '格斗', maxPp: 20, description: '投掷对手。给予对手和自己等级相同的固定伤害。', learnLevel: 15 },
  fire_blast: { id: 'fire_blast', name: '大字爆炎', power: 110, type: '火', maxPp: 5, description: '向对手发射大字形的火焰进行攻击。10%概率使对手灼伤。', learnLevel: 30 },
  surf: { id: 'surf', name: '冲浪', power: 90, type: '水', maxPp: 15, description: '掀起大浪冲向对手进行攻击。', learnLevel: 22 },
  thunder: { id: 'thunder', name: '打雷', power: 110, type: '电', maxPp: 10, description: '向对手劈下暴雷进行攻击。30%概率使对手麻痹。', learnLevel: 26 },
  psychic: { id: 'psychic', name: '精神强念', power: 90, type: '超能力', maxPp: 10, description: '向对手发送强大的念力进行攻击。10%概率降低对手特防。', learnLevel: 18 },
  strength: { id: 'strength', name: '怪力', power: 80, type: '普通', maxPp: 15, description: '使出全身力气攻击对手。', learnLevel: 15 },
  dig: { id: 'dig', name: '挖洞', power: 80, type: '地面', maxPp: 10, description: '第1回合钻入地中，第2回合钻出攻击对手。', learnLevel: 18 },
  magnitude: { id: 'magnitude', name: '震级', power: 0, type: '地面', maxPp: 30, description: '引发地震攻击对手自己以外的全部宝可梦。', learnLevel: 14 },
  slash: { id: 'slash', name: '劈开', power: 70, type: '普通', maxPp: 20, description: '用利爪或镰刀等劈开对手进行攻击。容易击中要害。', learnLevel: 12 },
  night_shade: { id: 'night_shade', name: '影子球', power: 60, type: '幽灵', maxPp: 15, description: '在对手面前投下诡异的影子进行攻击。', learnLevel: 8 },
  thunder_wave: { id: 'thunder_wave', name: '电磁波', power: 0, type: '电', maxPp: 20, description: '向对手发出微弱的电击，使对手麻痹。', learnLevel: 6 },
  skull_bash: { id: 'skull_bash', name: '火箭头锤', power: 130, type: '普通', maxPp: 10, description: '第1回合低下头防御，第2回合用头锤撞向对手。', learnLevel: 24 },
  flame_wheel: { id: 'flame_wheel', name: '火焰轮', power: 60, type: '火', maxPp: 25, description: '将自己裹在火焰中攻击对手。10%概率使对手灼伤。', learnLevel: 15 },
  body_slam: { id: 'body_slam', name: '泰山压顶', power: 85, type: '普通', maxPp: 15, description: '用整个身体压向对手进行攻击。30%概率使对手麻痹。', learnLevel: 16 },
  double_edge: { id: 'double_edge', name: '百万吨重拳', power: 120, type: '普通', maxPp: 15, description: '使出浑身力量撞向对手。自己也会受到大量伤害。', learnLevel: 20 },
  rage: { id: 'rage', name: '愤怒', power: 20, type: '普通', maxPp: 20, description: '在愤怒中攻击对手。每次受到攻击时攻击力会提升。', learnLevel: 8 },
  earthquake: { id: 'earthquake', name: '地震', power: 100, type: '地面', maxPp: 10, description: '引发大地震动攻击对手自己以外的全部宝可梦。', learnLevel: 26 },
  stone_edge: { id: 'stone_edge', name: '尖石攻击', power: 100, type: '岩石', maxPp: 5, description: '用尖尖的岩石刺入对手进行攻击。容易击中要害。', learnLevel: 22 },
  pursuit: { id: 'pursuit', name: '追打', power: 40, type: '恶', maxPp: 20, description: '追逐并攻击逃跑的对手。', learnLevel: 6 },
  petal_dance: { id: 'petal_dance', name: '花瓣舞', power: 120, type: '草', maxPp: 10, description: '散落花瓣攻击对手2~3回合。自己会陷入混乱。', learnLevel: 24 },
  iron_tail: { id: 'iron_tail', name: '铁尾', power: 100, type: '钢', maxPp: 15, description: '用坚硬的尾巴摔打对手进行攻击。30%概率降低对手防御。', learnLevel: 18 },
  dragon_rage: { id: 'dragon_rage', name: '龙之怒', power: 0, type: '龙', maxPp: 10, description: '释放不可思议的力量进行攻击。给予对手40点的固定伤害。', learnLevel: 12 },
  bug_bite: { id: 'bug_bite', name: '虫咬', power: 60, type: '虫', maxPp: 20, description: '用锋利的牙齿或颚啃咬对手进行攻击。会吃掉对手携带的果实。', learnLevel: 1 },
  string_shot: { id: 'string_shot', name: '吐丝', power: 0, type: '虫', maxPp: 40, description: '向对手吐出丝线进行攻击，大幅降低对手的速度。', learnLevel: 1 },
  harden: { id: 'harden', name: '变硬', power: 0, type: '普通', maxPp: 30, description: '使全身变硬，提升自己的防御。', learnLevel: 1 },
  psybeam: { id: 'psybeam', name: '幻象光线', power: 65, type: '超能力', maxPp: 20, description: '向对手发射神秘的光线进行攻击。10%概率使对手混乱。', learnLevel: 10 },
};

// 技能学习表：每个 speciesId -> 按等级排列的技能 ID 列表
export const SPECIES_SKILL_TABLE: Record<number, { level: number; skillId: string }[]> = {
  // 草系御三家
  1:  [ { level: 1, skillId: 'tackle' }, { level: 4, skillId: 'vine_whip' }, { level: 7, skillId: 'poison_sting' }, { level: 10, skillId: 'mega_drain' }, { level: 13, skillId: 'razor_leaf' }, { level: 16, skillId: 'petal_dance' }, { level: 22, skillId: 'sludge' }, { level: 28, skillId: 'solar_beam' } ],
  2:  [ { level: 1, skillId: 'tackle' }, { level: 4, skillId: 'vine_whip' }, { level: 7, skillId: 'poison_sting' }, { level: 10, skillId: 'mega_drain' }, { level: 13, skillId: 'razor_leaf' }, { level: 16, skillId: 'petal_dance' }, { level: 22, skillId: 'sludge' }, { level: 28, skillId: 'solar_beam' }, { level: 32, skillId: 'solar_beam' } ],
  3:  [ { level: 1, skillId: 'tackle' }, { level: 4, skillId: 'vine_whip' }, { level: 7, skillId: 'poison_sting' }, { level: 10, skillId: 'mega_drain' }, { level: 13, skillId: 'razor_leaf' }, { level: 16, skillId: 'petal_dance' }, { level: 22, skillId: 'sludge' }, { level: 28, skillId: 'solar_beam' } ],
  // 火系御三家
  4:  [ { level: 1, skillId: 'scratch' }, { level: 4, skillId: 'ember' }, { level: 7, skillId: 'smoke' in SKILL_LIBRARY ? 'smoke' : 'sand_attack' }, { level: 10, skillId: 'fire_spin' }, { level: 13, skillId: 'bite' }, { level: 16, skillId: 'flame_wheel' }, { level: 20, skillId: 'flamethrower' }, { level: 28, skillId: 'slash' }, { level: 36, skillId: 'fire_blast' } ],
  5:  [ { level: 1, skillId: 'scratch' }, { level: 4, skillId: 'ember' }, { level: 7, skillId: 'rage' }, { level: 10, skillId: 'fire_spin' }, { level: 13, skillId: 'bite' }, { level: 16, skillId: 'flame_wheel' }, { level: 20, skillId: 'flamethrower' }, { level: 28, skillId: 'slash' }, { level: 36, skillId: 'fire_blast' } ],
  6:  [ { level: 1, skillId: 'scratch' }, { level: 4, skillId: 'ember' }, { level: 7, skillId: 'rage' }, { level: 10, skillId: 'fire_spin' }, { level: 13, skillId: 'bite' }, { level: 16, skillId: 'flame_wheel' }, { level: 20, skillId: 'flamethrower' }, { level: 28, skillId: 'slash' }, { level: 36, skillId: 'fire_blast' } ],
  // 水系御三家
  7:  [ { level: 1, skillId: 'tackle' }, { level: 4, skillId: 'water_gun' }, { level: 7, skillId: 'bite' }, { level: 10, skillId: 'water_pulse' }, { level: 13, skillId: 'strength' }, { level: 16, skillId: 'dig' }, { level: 22, skillId: 'surf' }, { level: 28, skillId: 'skull_bash' }, { level: 36, skillId: 'hydro_pump' } ],
  8:  [ { level: 1, skillId: 'tackle' }, { level: 4, skillId: 'water_gun' }, { level: 7, skillId: 'bite' }, { level: 10, skillId: 'water_pulse' }, { level: 13, skillId: 'strength' }, { level: 16, skillId: 'dig' }, { level: 22, skillId: 'surf' }, { level: 28, skillId: 'skull_bash' }, { level: 36, skillId: 'hydro_pump' } ],
  9:  [ { level: 1, skillId: 'tackle' }, { level: 4, skillId: 'water_gun' }, { level: 7, skillId: 'bite' }, { level: 10, skillId: 'water_pulse' }, { level: 13, skillId: 'strength' }, { level: 16, skillId: 'dig' }, { level: 22, skillId: 'surf' }, { level: 28, skillId: 'skull_bash' }, { level: 36, skillId: 'hydro_pump' } ],
  // 绿毛虫系
  10: [ { level: 1, skillId: 'tackle' }, { level: 1, skillId: 'string_shot' }, { level: 5, skillId: 'bug_bite' } ],
  11: [ { level: 1, skillId: 'tackle' }, { level: 1, skillId: 'harden' }, { level: 5, skillId: 'bug_bite' } ],
  12: [ { level: 1, skillId: 'tackle' }, { level: 1, skillId: 'harden' }, { level: 5, skillId: 'bug_bite' }, { level: 10, skillId: 'psybeam' }, { level: 12, skillId: 'poison_sting' }, { level: 15, skillId: 'confusion' }, { level: 20, skillId: 'psychic' } ],
  // 波波系
  16: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'sand_attack' }, { level: 9, skillId: 'quick_attack' }, { level: 13, skillId: 'wing_attack' }, { level: 18, skillId: 'slash' }, { level: 25, skillId: 'body_slam' }, { level: 32, skillId: 'sky_attack' in SKILL_LIBRARY ? 'sky_attack' : 'take_down' } ],
  17: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'sand_attack' }, { level: 9, skillId: 'quick_attack' }, { level: 13, skillId: 'wing_attack' }, { level: 18, skillId: 'slash' }, { level: 25, skillId: 'body_slam' }, { level: 36, skillId: 'double_edge' } ],
  18: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'sand_attack' }, { level: 9, skillId: 'quick_attack' }, { level: 13, skillId: 'wing_attack' }, { level: 18, skillId: 'slash' }, { level: 25, skillId: 'body_slam' }, { level: 36, skillId: 'double_edge' } ],
  // 小拉达系
  19: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'quick_attack' }, { level: 7, skillId: 'bite' }, { level: 10, skillId: 'fury_swipes' }, { level: 14, skillId: 'pursuit' }, { level: 18, skillId: 'hyper_beam' } ],
  20: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'quick_attack' }, { level: 7, skillId: 'bite' }, { level: 10, skillId: 'fury_swipes' }, { level: 14, skillId: 'pursuit' }, { level: 18, skillId: 'hyper_beam' } ],
  // 烈雀系
  21: [ { level: 1, skillId: 'peck' }, { level: 5, skillId: 'quick_attack' }, { level: 9, skillId: 'sand_attack' }, { level: 13, skillId: 'wing_attack' }, { level: 17, skillId: 'fury_swipes' }, { level: 20, skillId: 'slash' } ],
  22: [ { level: 1, skillId: 'peck' }, { level: 5, skillId: 'quick_attack' }, { level: 9, skillId: 'sand_attack' }, { level: 13, skillId: 'wing_attack' }, { level: 17, skillId: 'fury_swipes' }, { level: 20, skillId: 'slash' } ],
  // 阿柏蛇系
  23: [ { level: 1, skillId: 'tackle' }, { level: 4, skillId: 'poison_sting' }, { level: 9, skillId: 'bite' }, { level: 12, skillId: 'sludge' }, { level: 17, skillId: 'dig' }, { level: 22, skillId: 'earthquake' } ],
  24: [ { level: 1, skillId: 'tackle' }, { level: 4, skillId: 'poison_sting' }, { level: 9, skillId: 'bite' }, { level: 12, skillId: 'sludge' }, { level: 17, skillId: 'dig' }, { level: 22, skillId: 'earthquake' } ],
  // 皮卡丘系
  25: [ { level: 1, skillId: 'thunder_shock' }, { level: 5, skillId: 'quick_attack' }, { level: 8, skillId: 'spark' }, { level: 10, skillId: 'bite' }, { level: 15, skillId: 'thunderbolt' }, { level: 20, skillId: 'iron_tail' }, { level: 26, skillId: 'thunder' } ],
  26: [ { level: 1, skillId: 'thunder_shock' }, { level: 5, skillId: 'quick_attack' }, { level: 8, skillId: 'spark' }, { level: 10, skillId: 'bite' }, { level: 15, skillId: 'thunderbolt' }, { level: 20, skillId: 'iron_tail' }, { level: 26, skillId: 'thunder' } ],
  // 穿山鼠系
  27: [ { level: 1, skillId: 'scratch' }, { level: 5, skillId: 'sand_attack' }, { level: 8, skillId: 'rock_throw' }, { level: 12, skillId: 'dig' }, { level: 17, skillId: 'slash' }, { level: 22, skillId: 'earthquake' } ],
  28: [ { level: 1, skillId: 'scratch' }, { level: 5, skillId: 'sand_attack' }, { level: 8, skillId: 'rock_throw' }, { level: 12, skillId: 'dig' }, { level: 17, skillId: 'slash' }, { level: 22, skillId: 'earthquake' } ],
  // 尼多兰/尼多朗/尼多后/尼多王
  29: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'poison_sting' }, { level: 8, skillId: 'bite' }, { level: 12, skillId: 'sludge' }, { level: 16, skillId: 'body_slam' }, { level: 22, skillId: 'earthquake' }, { level: 28, skillId: 'double_edge' } ],
  30: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'poison_sting' }, { level: 8, skillId: 'bite' }, { level: 12, skillId: 'sludge' }, { level: 16, skillId: 'body_slam' }, { level: 22, skillId: 'earthquake' }, { level: 28, skillId: 'double_edge' } ],
  31: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'poison_sting' }, { level: 8, skillId: 'bite' }, { level: 12, skillId: 'sludge' }, { level: 16, skillId: 'body_slam' }, { level: 22, skillId: 'earthquake' }, { level: 28, skillId: 'double_edge' } ],
  32: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'poison_sting' }, { level: 8, skillId: 'bite' }, { level: 12, skillId: 'sludge' }, { level: 16, skillId: 'body_slam' }, { level: 22, skillId: 'earthquake' }, { level: 28, skillId: 'double_edge' } ],
  33: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'poison_sting' }, { level: 8, skillId: 'bite' }, { level: 12, skillId: 'sludge' }, { level: 16, skillId: 'body_slam' }, { level: 22, skillId: 'earthquake' }, { level: 28, skillId: 'double_edge' } ],
  34: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'poison_sting' }, { level: 8, skillId: 'bite' }, { level: 12, skillId: 'sludge' }, { level: 16, skillId: 'body_slam' }, { level: 22, skillId: 'earthquake' }, { level: 28, skillId: 'double_edge' } ],
  // 六尾/九尾
  37: [ { level: 1, skillId: 'ember' }, { level: 5, skillId: 'quick_attack' }, { level: 8, skillId: 'bite' }, { level: 12, skillId: 'fire_spin' }, { level: 16, skillId: 'flame_wheel' }, { level: 22, skillId: 'flamethrower' }, { level: 28, skillId: 'solar_beam' } ],
  38: [ { level: 1, skillId: 'ember' }, { level: 5, skillId: 'quick_attack' }, { level: 8, skillId: 'bite' }, { level: 12, skillId: 'fire_spin' }, { level: 16, skillId: 'flame_wheel' }, { level: 22, skillId: 'flamethrower' }, { level: 28, skillId: 'solar_beam' } ],
  // 超音蝠/大嘴蝠
  41: [ { level: 1, skillId: 'bite' }, { level: 5, skillId: 'ghost_attack' }, { level: 8, skillId: 'wing_attack' }, { level: 12, skillId: 'confusion' }, { level: 16, skillId: 'night_shade' }, { level: 22, skillId: 'psychic' }, { level: 28, skillId: 'shadow_ball' } ],
  42: [ { level: 1, skillId: 'bite' }, { level: 5, skillId: 'ghost_attack' }, { level: 8, skillId: 'wing_attack' }, { level: 12, skillId: 'confusion' }, { level: 16, skillId: 'night_shade' }, { level: 22, skillId: 'psychic' }, { level: 28, skillId: 'shadow_ball' } ],
  // 走路草/臭臭花/霸王花
  43: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'poison_sting' }, { level: 8, skillId: 'mega_drain' }, { level: 12, skillId: 'acid' in SKILL_LIBRARY ? 'acid' : 'sludge' }, { level: 15, skillId: 'petal_dance' }, { level: 21, skillId: 'solar_beam' }, { level: 28, skillId: 'sludge' } ],
  44: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'poison_sting' }, { level: 8, skillId: 'mega_drain' }, { level: 12, skillId: 'sludge' }, { level: 15, skillId: 'petal_dance' }, { level: 21, skillId: 'solar_beam' }, { level: 28, skillId: 'sludge' } ],
  45: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'poison_sting' }, { level: 8, skillId: 'mega_drain' }, { level: 12, skillId: 'sludge' }, { level: 15, skillId: 'petal_dance' }, { level: 21, skillId: 'solar_beam' }, { level: 28, skillId: 'sludge' } ],
  // 喵喵/猫老大
  52: [ { level: 1, skillId: 'scratch' }, { level: 5, skillId: 'bite' }, { level: 8, skillId: 'quick_attack' }, { level: 12, skillId: 'fury_swipes' }, { level: 16, skillId: 'pursuit' }, { level: 20, skillId: 'slash' }, { level: 28, skillId: 'body_slam' } ],
  53: [ { level: 1, skillId: 'scratch' }, { level: 5, skillId: 'bite' }, { level: 8, skillId: 'quick_attack' }, { level: 12, skillId: 'fury_swipes' }, { level: 16, skillId: 'pursuit' }, { level: 20, skillId: 'slash' }, { level: 28, skillId: 'body_slam' } ],
  // 可达鸭/哥达鸭
  54: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'water_gun' }, { level: 8, skillId: 'confusion' }, { level: 12, skillId: 'bite' }, { level: 16, skillId: 'water_pulse' }, { level: 22, skillId: 'psychic' }, { level: 33, skillId: 'surf' } ],
  55: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'water_gun' }, { level: 8, skillId: 'confusion' }, { level: 12, skillId: 'bite' }, { level: 16, skillId: 'water_pulse' }, { level: 22, skillId: 'psychic' }, { level: 33, skillId: 'surf' } ],
  // 猴怪/火暴猴
  56: [ { level: 1, skillId: 'scratch' }, { level: 5, skillId: 'karate_chop' }, { level: 8, skillId: 'fury_swipes' }, { level: 12, skillId: 'bite' }, { level: 16, skillId: 'rage' }, { level: 20, skillId: 'seismic_toss' }, { level: 28, skillId: 'body_slam' }, { level: 36, skillId: 'earthquake' } ],
  57: [ { level: 1, skillId: 'scratch' }, { level: 5, skillId: 'karate_chop' }, { level: 8, skillId: 'fury_swipes' }, { level: 12, skillId: 'bite' }, { level: 16, skillId: 'rage' }, { level: 20, skillId: 'seismic_toss' }, { level: 28, skillId: 'body_slam' }, { level: 36, skillId: 'earthquake' } ],
  // 卡蒂狗/风速狗
  58: [ { level: 1, skillId: 'bite' }, { level: 5, skillId: 'ember' }, { level: 8, skillId: 'quick_attack' }, { level: 12, skillId: 'fire_spin' }, { level: 16, skillId: 'flame_wheel' }, { level: 22, skillId: 'flamethrower' }, { level: 30, skillId: 'fire_blast' } ],
  59: [ { level: 1, skillId: 'bite' }, { level: 5, skillId: 'ember' }, { level: 8, skillId: 'quick_attack' }, { level: 12, skillId: 'fire_spin' }, { level: 16, skillId: 'flame_wheel' }, { level: 22, skillId: 'flamethrower' }, { level: 30, skillId: 'fire_blast' } ],
  // 小拳石/隆隆石/隆隆岩
  74: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'rock_throw' }, { level: 8, skillId: 'magnitude' }, { level: 12, skillId: 'dig' }, { level: 16, skillId: 'rock_throw' }, { level: 20, skillId: 'earthquake' }, { level: 25, skillId: 'stone_edge' } ],
  75: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'rock_throw' }, { level: 8, skillId: 'magnitude' }, { level: 12, skillId: 'dig' }, { level: 16, skillId: 'rock_throw' }, { level: 20, skillId: 'earthquake' }, { level: 25, skillId: 'stone_edge' } ],
  76: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'rock_throw' }, { level: 8, skillId: 'magnitude' }, { level: 12, skillId: 'dig' }, { level: 16, skillId: 'rock_throw' }, { level: 20, skillId: 'earthquake' }, { level: 25, skillId: 'stone_edge' } ],
  // 小火马/烈焰马
  77: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'ember' }, { level: 8, skillId: 'quick_attack' }, { level: 12, skillId: 'fire_spin' }, { level: 16, skillId: 'flame_wheel' }, { level: 22, skillId: 'flamethrower' }, { level: 30, skillId: 'fire_blast' } ],
  78: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'ember' }, { level: 8, skillId: 'quick_attack' }, { level: 12, skillId: 'fire_spin' }, { level: 16, skillId: 'flame_wheel' }, { level: 22, skillId: 'flamethrower' }, { level: 30, skillId: 'fire_blast' } ],
  // 小磁怪/三合一磁怪
  81: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'thunder_shock' }, { level: 8, skillId: 'spark' }, { level: 12, skillId: 'sonic_boom' in SKILL_LIBRARY ? 'sonic_boom' : 'bite' }, { level: 18, skillId: 'thunderbolt' }, { level: 25, skillId: 'thunder_wave' }, { level: 30, skillId: 'thunder' } ],
  82: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'thunder_shock' }, { level: 8, skillId: 'spark' }, { level: 12, skillId: 'bite' }, { level: 18, skillId: 'thunderbolt' }, { level: 25, skillId: 'thunder_wave' }, { level: 30, skillId: 'thunder' } ],
  // 鬼斯/鬼斯通/耿鬼
  92: [ { level: 1, skillId: 'ghost_attack' }, { level: 5, skillId: 'night_shade' }, { level: 8, skillId: 'confusion' }, { level: 12, skillId: 'shadow_ball' }, { level: 16, skillId: 'bite' }, { level: 22, skillId: 'psychic' }, { level: 28, skillId: 'shadow_ball' } ],
  93: [ { level: 1, skillId: 'ghost_attack' }, { level: 5, skillId: 'night_shade' }, { level: 8, skillId: 'confusion' }, { level: 12, skillId: 'shadow_ball' }, { level: 16, skillId: 'bite' }, { level: 22, skillId: 'psychic' }, { level: 28, skillId: 'shadow_ball' } ],
  94: [ { level: 1, skillId: 'ghost_attack' }, { level: 5, skillId: 'night_shade' }, { level: 8, skillId: 'confusion' }, { level: 12, skillId: 'shadow_ball' }, { level: 16, skillId: 'bite' }, { level: 22, skillId: 'psychic' }, { level: 28, skillId: 'shadow_ball' } ],
  // --- 新增宝可梦技能表 ---
  // 派拉斯/派拉斯特
  46: [ { level: 1, skillId: 'scratch' }, { level: 5, skillId: 'poison_sting' }, { level: 8, skillId: 'mega_drain' }, { level: 12, skillId: 'sludge' }, { level: 18, skillId: 'spore_attack' in SKILL_LIBRARY ? 'spore_attack' : 'bite' }, { level: 24, skillId: 'petal_dance' } ],
  47: [ { level: 1, skillId: 'scratch' }, { level: 5, skillId: 'poison_sting' }, { level: 8, skillId: 'mega_drain' }, { level: 12, skillId: 'sludge' }, { level: 18, skillId: 'bite' }, { level: 24, skillId: 'petal_dance' } ],
  // 毛球/摩鲁蛾
  48: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'poison_sting' }, { level: 8, skillId: 'confusion' }, { level: 12, skillId: 'mega_drain' }, { level: 18, skillId: 'psychic' }, { level: 24, skillId: 'shadow_ball' } ],
  49: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'poison_sting' }, { level: 8, skillId: 'confusion' }, { level: 12, skillId: 'mega_drain' }, { level: 18, skillId: 'psychic' }, { level: 24, skillId: 'shadow_ball' } ],
  // 地鼠/三地鼠
  50: [ { level: 1, skillId: 'scratch' }, { level: 5, skillId: 'sand_attack' }, { level: 10, skillId: 'dig' }, { level: 15, skillId: 'magnitude' }, { level: 20, skillId: 'earthquake' }, { level: 26, skillId: 'slash' } ],
  51: [ { level: 1, skillId: 'scratch' }, { level: 5, skillId: 'sand_attack' }, { level: 10, skillId: 'dig' }, { level: 15, skillId: 'magnitude' }, { level: 20, skillId: 'earthquake' }, { level: 26, skillId: 'slash' } ],
  // 蚊香蝌蚪/蚊香君/蚊香泳士
  60: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'water_gun' }, { level: 8, skillId: 'confusion' }, { level: 12, skillId: 'water_pulse' }, { level: 18, skillId: 'bubble_beam' in SKILL_LIBRARY ? 'bubble_beam' : 'surf' }, { level: 25, skillId: 'surf' } ],
  61: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'water_gun' }, { level: 8, skillId: 'confusion' }, { level: 12, skillId: 'water_pulse' }, { level: 18, skillId: 'surf' }, { level: 25, skillId: 'surf' } ],
  62: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'water_gun' }, { level: 8, skillId: 'confusion' }, { level: 12, skillId: 'water_pulse' }, { level: 18, skillId: 'surf' }, { level: 25, skillId: 'surf' } ],
  // 凯西/勇基拉/胡地
  63: [ { level: 1, skillId: 'confusion' }, { level: 5, skillId: 'spark' }, { level: 8, skillId: 'night_shade' }, { level: 12, skillId: 'psychic' }, { level: 16, skillId: 'shadow_ball' }, { level: 22, skillId: 'psychic' } ],
  64: [ { level: 1, skillId: 'confusion' }, { level: 5, skillId: 'spark' }, { level: 8, skillId: 'night_shade' }, { level: 12, skillId: 'psychic' }, { level: 16, skillId: 'shadow_ball' }, { level: 22, skillId: 'psychic' } ],
  65: [ { level: 1, skillId: 'confusion' }, { level: 5, skillId: 'spark' }, { level: 8, skillId: 'night_shade' }, { level: 12, skillId: 'psychic' }, { level: 16, skillId: 'shadow_ball' }, { level: 22, skillId: 'psychic' } ],
  // 腕力/豪力/怪力
  66: [ { level: 1, skillId: 'karate_chop' }, { level: 5, skillId: 'leer' in SKILL_LIBRARY ? 'leer' : 'sand_attack' }, { level: 8, skillId: 'fury_swipes' }, { level: 12, skillId: 'seismic_toss' }, { level: 16, skillId: 'rage' }, { level: 20, skillId: 'body_slam' }, { level: 28, skillId: 'earthquake' } ],
  67: [ { level: 1, skillId: 'karate_chop' }, { level: 5, skillId: 'sand_attack' }, { level: 8, skillId: 'fury_swipes' }, { level: 12, skillId: 'seismic_toss' }, { level: 16, skillId: 'rage' }, { level: 20, skillId: 'body_slam' }, { level: 28, skillId: 'earthquake' } ],
  68: [ { level: 1, skillId: 'karate_chop' }, { level: 5, skillId: 'sand_attack' }, { level: 8, skillId: 'fury_swipes' }, { level: 12, skillId: 'seismic_toss' }, { level: 16, skillId: 'rage' }, { level: 20, skillId: 'body_slam' }, { level: 28, skillId: 'earthquake' } ],
  // 喇叭芽/口呆花/大食花
  69: [ { level: 1, skillId: 'vine_whip' }, { level: 5, skillId: 'poison_sting' }, { level: 9, skillId: 'sleep_powder' in SKILL_LIBRARY ? 'sleep_powder' : 'mega_drain' }, { level: 12, skillId: 'acid' in SKILL_LIBRARY ? 'acid' : 'sludge' }, { level: 15, skillId: 'mega_drain' }, { level: 21, skillId: 'petal_dance' } ],
  70: [ { level: 1, skillId: 'vine_whip' }, { level: 5, skillId: 'poison_sting' }, { level: 9, skillId: 'mega_drain' }, { level: 12, skillId: 'sludge' }, { level: 15, skillId: 'mega_drain' }, { level: 21, skillId: 'petal_dance' } ],
  71: [ { level: 1, skillId: 'vine_whip' }, { level: 5, skillId: 'poison_sting' }, { level: 9, skillId: 'mega_drain' }, { level: 12, skillId: 'sludge' }, { level: 15, skillId: 'mega_drain' }, { level: 21, skillId: 'petal_dance' } ],
  // 玛瑙水母/毒刺水母
  72: [ { level: 1, skillId: 'poison_sting' }, { level: 5, skillId: 'water_gun' }, { level: 8, skillId: 'sludge' }, { level: 12, skillId: 'water_pulse' }, { level: 18, skillId: 'mega_drain' }, { level: 24, skillId: 'surf' } ],
  73: [ { level: 1, skillId: 'poison_sting' }, { level: 5, skillId: 'water_gun' }, { level: 8, skillId: 'sludge' }, { level: 12, skillId: 'water_pulse' }, { level: 18, skillId: 'mega_drain' }, { level: 24, skillId: 'surf' } ],
  // 呆呆兽/呆壳兽
  79: [ { level: 1, skillId: 'water_gun' }, { level: 5, skillId: 'confusion' }, { level: 10, skillId: 'water_pulse' }, { level: 15, skillId: 'psychic' }, { level: 22, skillId: 'surf' }, { level: 30, skillId: 'psychic' } ],
  80: [ { level: 1, skillId: 'water_gun' }, { level: 5, skillId: 'confusion' }, { level: 10, skillId: 'water_pulse' }, { level: 15, skillId: 'psychic' }, { level: 22, skillId: 'surf' }, { level: 30, skillId: 'psychic' } ],
  // 大岩蛇
  95: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'rock_throw' }, { level: 8, skillId: 'magnitude' }, { level: 12, skillId: 'dig' }, { level: 18, skillId: 'earthquake' }, { level: 25, skillId: 'stone_edge' } ],
  // 卡拉卡拉/嘎啦嘎啦
  104: [ { level: 1, skillId: 'bone_club' in SKILL_LIBRARY ? 'bone_club' : 'rock_throw' }, { level: 5, skillId: 'headbutt' in SKILL_LIBRARY ? 'headbutt' : 'tackle' }, { level: 8, skillId: 'leer' in SKILL_LIBRARY ? 'leer' : 'sand_attack' }, { level: 12, skillId: 'bone_rush' in SKILL_LIBRARY ? 'bone_rush' : 'earthquake' }, { level: 18, skillId: 'earthquake' }, { level: 28, skillId: 'double_edge' } ],
  105: [ { level: 1, skillId: 'rock_throw' }, { level: 5, skillId: 'headbutt' in SKILL_LIBRARY ? 'headbutt' : 'tackle' }, { level: 8, skillId: 'sand_attack' }, { level: 12, skillId: 'bone_rush' in SKILL_LIBRARY ? 'bone_rush' : 'earthquake' }, { level: 18, skillId: 'earthquake' }, { level: 28, skillId: 'double_edge' } ],
  // 鲤鱼王/暴鲤龙
  129: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'splash' in SKILL_LIBRARY ? 'splash' : 'water_gun' }, { level: 10, skillId: 'tackle' }, { level: 15, skillId: 'flail' in SKILL_LIBRARY ? 'flail' : 'water_gun' }, { level: 20, skillId: 'dragon_rage' } ],
  130: [ { level: 1, skillId: 'bite' }, { level: 5, skillId: 'dragon_rage' }, { level: 10, skillId: 'water_pulse' }, { level: 15, skillId: 'surf' }, { level: 20, skillId: 'hydro_pump' }, { level: 30, skillId: 'hyper_beam' } ],
  // 伊布/雷精灵/水精灵/火精灵
  133: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'quick_attack' }, { level: 8, skillId: 'sand_attack' }, { level: 12, skillId: 'bite' }, { level: 16, skillId: 'take_down' }, { level: 20, skillId: 'swift' in SKILL_LIBRARY ? 'swift' : 'quick_attack' } ],
  134: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'thunder_shock' }, { level: 8, skillId: 'quick_attack' }, { level: 12, skillId: 'spark' }, { level: 16, skillId: 'thunderbolt' }, { level: 20, skillId: 'thunder' } ],
  135: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'water_gun' }, { level: 8, skillId: 'quick_attack' }, { level: 12, skillId: 'water_pulse' }, { level: 16, skillId: 'surf' }, { level: 20, skillId: 'hydro_pump' } ],
  136: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'ember' }, { level: 8, skillId: 'quick_attack' }, { level: 12, skillId: 'fire_spin' }, { level: 16, skillId: 'flamethrower' }, { level: 20, skillId: 'fire_blast' } ],
  // 迷你龙/哈克龙/快龙
  147: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'dragon_rage' }, { level: 8, skillId: 'slam' in SKILL_LIBRARY ? 'slam' : 'take_down' }, { level: 12, skillId: 'water_pulse' }, { level: 18, skillId: 'dragon_rage' }, { level: 24, skillId: 'surf' }, { level: 30, skillId: 'dragon_rage' } ],
  148: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'dragon_rage' }, { level: 8, skillId: 'take_down' }, { level: 12, skillId: 'water_pulse' }, { level: 18, skillId: 'surf' }, { level: 24, skillId: 'dragon_rage' }, { level: 30, skillId: 'hyper_beam' } ],
  149: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'dragon_rage' }, { level: 8, skillId: 'take_down' }, { level: 12, skillId: 'water_pulse' }, { level: 18, skillId: 'surf' }, { level: 24, skillId: 'hyper_beam' } ],
  // 卡比兽
  143: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'rest' in SKILL_LIBRARY ? 'rest' : 'body_slam' }, { level: 8, skillId: 'body_slam' }, { level: 12, skillId: 'earthquake' }, { level: 18, skillId: 'hyper_beam' }, { level: 24, skillId: 'hyper_beam' } ],
  // 拉普拉斯
  131: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'water_gun' }, { level: 8, skillId: 'confusion' }, { level: 12, skillId: 'ice_beam' in SKILL_LIBRARY ? 'ice_beam' : 'surf' }, { level: 18, skillId: 'surf' }, { level: 24, skillId: 'blizzard' in SKILL_LIBRARY ? 'blizzard' : 'hydro_pump' } ],
  // 化石翼龙
  142: [ { level: 1, skillId: 'bite' }, { level: 5, skillId: 'rock_throw' }, { level: 8, skillId: 'wing_attack' }, { level: 12, skillId: 'earthquake' }, { level: 18, skillId: 'stone_edge' }, { level: 24, skillId: 'hyper_beam' } ],
  // 超梦
  150: [ { level: 1, skillId: 'confusion' }, { level: 5, skillId: 'swift' in SKILL_LIBRARY ? 'swift' : 'quick_attack' }, { level: 8, skillId: 'psychic' }, { level: 12, skillId: 'shadow_ball' }, { level: 18, skillId: 'psychic' }, { level: 24, skillId: 'hyper_beam' } ],
  // 梦幻
  151: [ { level: 1, skillId: 'pound' in SKILL_LIBRARY ? 'pound' : 'tackle' }, { level: 5, skillId: 'swift' in SKILL_LIBRARY ? 'swift' : 'quick_attack' }, { level: 8, skillId: 'psychic' }, { level: 12, skillId: 'shadow_ball' }, { level: 18, skillId: 'psychic' }, { level: 24, skillId: 'hyper_beam' } ],
  // 多边兽
  137: [ { level: 1, skillId: 'tackle' }, { level: 5, skillId: 'thunder_shock' }, { level: 8, skillId: 'conversion' in SKILL_LIBRARY ? 'conversion' : 'spark' }, { level: 12, skillId: 'psychic' }, { level: 18, skillId: 'thunderbolt' }, { level: 24, skillId: 'hyper_beam' } ],
};

// 获取宝可梦在某个等级时所有已学会的技能（含已装备的）
export const getAllLearnedSkills = (speciesId: number, level: number, currentSkills: Skill[]): Skill[] => {
  const table = SPECIES_SKILL_TABLE[speciesId];
  if (!table) return currentSkills;
  const allSkills = new Map<string, Skill>();
  // 先收集已装备的技能
  for (const s of currentSkills) {
    allSkills.set(s.id, s);
  }
  // 收集等级表中该等级及以下的所有技能
  for (const entry of table) {
    if (entry.level <= level) {
      const lib = SKILL_LIBRARY[entry.skillId];
      if (lib && !allSkills.has(entry.skillId)) {
        allSkills.set(entry.skillId, { ...lib, pp: lib.maxPp, learnLevel: entry.level });
      }
    }
  }
  return Array.from(allSkills.values());
};

// 获取宝可梦的初始技能
export const getInitialSkills = (speciesId: number): Skill[] => {
  const table = SPECIES_SKILL_TABLE[speciesId];
  if (!table) return [{ ...SKILL_LIBRARY.tackle, pp: SKILL_LIBRARY.tackle.maxPp, learnLevel: 1 }];
  const skills: Skill[] = [];
  for (const entry of table) {
    if (entry.level <= 5 || skills.length < 2) { // 获取初始技能（等级5及以下或不足2个时）
      if (entry.level <= 5) {
        const lib = SKILL_LIBRARY[entry.skillId];
        if (lib) {
          skills.push({ ...lib, pp: lib.maxPp, learnLevel: entry.level });
          if (skills.length >= 4) break;
        }
      }
    }
  }
  // 只取前4个
  return skills.slice(0, 4);
};

// 等级提升时获取所有已学会的技能（含未装备的）
export const checkNewSkills = (speciesId: number, level: number, currentSkills: Skill[]): Skill[] => {
  const table = SPECIES_SKILL_TABLE[speciesId];
  if (!table) return currentSkills;
  
  const allSkills = new Map<string, Skill>();
  // 已装备的技能
  for (const s of currentSkills) {
    allSkills.set(s.id, s);
  }
  // 加入等级表中该等级及以下的技能
  for (const entry of table) {
    if (entry.level <= level) {
      const lib = SKILL_LIBRARY[entry.skillId];
      if (lib) {
        const existing = allSkills.get(entry.skillId);
        if (!existing) {
          allSkills.set(entry.skillId, { ...lib, pp: lib.maxPp, learnLevel: entry.level });
        }
      }
    }
  }
  
  // 返回所有已学会的技能（装备的+未装备的）
  return Array.from(allSkills.values());
};

export const getNextSkill = (speciesId: number, currentLevel: number, currentSkills: Skill[]): { level: number, skillId: string, name: string } | null => {
  const table = SPECIES_SKILL_TABLE[speciesId];
  if (!table) return null;
  for (const entry of table) {
    if (entry.level > currentLevel) {
      const lib = SKILL_LIBRARY[entry.skillId];
      if (lib && !currentSkills.find(s => s.id === entry.skillId)) {
        return { level: entry.level, skillId: entry.skillId, name: lib.name };
      }
    }
  }
  return null;
};

export const ITEMS: Record<
  ItemId,
  {
    id: ItemId;
    name: string;
    description: string;
    price: number;
    effect: { hunger?: number; happiness?: number; exp?: number };
    tone: string;
    image: string;
  }
> = {
  berry: {
    id: 'berry',
    name: '树果',
    description: '回复饱食度 +20',
    price: 15,
    effect: { hunger: 20 },
    tone: 'bg-orange-50 text-orange-700 border-orange-200',
    image: 'items/berry.svg',
  },
  apple: {
    id: 'apple',
    name: '苹果',
    description: '回复饱食度 +35，心情 +5',
    price: 25,
    effect: { hunger: 35, happiness: 5 },
    tone: 'bg-red-50 text-red-700 border-red-200',
    image: 'items/apple.svg',
  },
  sandwich: {
    id: 'sandwich',
    name: '三明治',
    description: '回复饱食度 +60，心情 +10',
    price: 60,
    effect: { hunger: 60, happiness: 10 },
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    image: 'items/sandwich.svg',
  },
  candy: {
    id: 'candy',
    name: '糖果',
    description: '获得经验 +40',
    price: 25,
    effect: { exp: 40 },
    tone: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    image: 'items/candy.svg',
  },
  toy: {
    id: 'toy',
    name: '玩具',
    description: '提升心情 +20',
    price: 20,
    effect: { happiness: 20 },
    tone: 'bg-pink-50 text-pink-700 border-pink-200',
    image: 'items/toy.svg',
  },
  ball: {
    id: 'ball',
    name: '皮球',
    description: '提升心情 +25 (消耗饱食度 -5)',
    price: 30,
    effect: { happiness: 25, hunger: -5 },
    tone: 'bg-sky-50 text-sky-700 border-sky-200',
    image: 'items/ball.svg',
  },
  kite: {
    id: 'kite',
    name: '风筝',
    description: '提升心情 +35 (消耗饱食度 -10)',
    price: 55,
    effect: { happiness: 35, hunger: -10 },
    tone: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    image: 'items/kite.svg',
  },
  pokeball: {
    id: 'pokeball',
    name: '精灵球',
    description: '用于在野外捕捉野生宝可梦 (基础捕捉率)',
    price: 50,
    effect: {}, 
    tone: 'bg-red-50 text-red-700 border-red-200',
    image: 'items/pokeball.svg',
  },
  greatball: {
    id: 'greatball',
    name: '超级球',
    description: '捕捉率比精灵球高 (1.5倍捕捉率)',
    price: 150,
    effect: {},
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
    image: 'items/greatball.svg',
  },
  ultraball: {
    id: 'ultraball',
    name: '高级球',
    description: '捕捉率比超级球更高 (2倍捕捉率)',
    price: 300,
    effect: {},
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    image: 'items/ultraball.svg',
  },
  masterball: {
    id: 'masterball',
    name: '大师球',
    description: '必定能捕捉到野生宝可梦',
    price: 9999,
    effect: {},
    tone: 'bg-purple-50 text-purple-700 border-purple-200',
    image: 'items/masterball.svg',
  },
  potion: {
    id: 'potion',
    name: '伤药',
    description: '回复饱食度 +50，心情 +10',
    price: 40,
    effect: { hunger: 50, happiness: 10 },
    tone: 'bg-orange-50 text-orange-700 border-orange-200',
    image: 'items/potion.svg',
  },
  rare_candy: {
    id: 'rare_candy',
    name: '稀有糖果',
    description: '获得大量经验 +120',
    price: 80,
    effect: { exp: 120 },
    tone: 'bg-purple-50 text-purple-700 border-purple-200',
    image: 'items/rare_candy.svg',
  },
  pokeblock: {
    id: 'pokeblock',
    name: '宝可方块',
    description: '回复饱食度 +40，心情 +15',
    price: 45,
    effect: { hunger: 40, happiness: 15 },
    tone: 'bg-pink-50 text-pink-700 border-pink-200',
    image: 'items/pokeblock.svg',
  },
  poffin: {
    id: 'poffin',
    name: '宝可芬',
    description: '大幅提升心情 +40 (消耗饱食度 -5)',
    price: 50,
    effect: { happiness: 40, hunger: -5 },
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    image: 'items/poffin.svg',
  },
  vitamin: {
    id: 'vitamin',
    name: '营养药剂',
    description: '回复饱食度 +70，心情 +5',
    price: 65,
    effect: { hunger: 70, happiness: 5 },
    tone: 'bg-red-50 text-red-700 border-red-200',
    image: 'items/vitamin.svg',
  },
  energy_powder: {
    id: 'energy_powder',
    name: '元气粉',
    description: '回复饱食度 +30，心情 +20',
    price: 35,
    effect: { hunger: 30, happiness: 20 },
    tone: 'bg-lime-50 text-lime-700 border-lime-200',
    image: 'items/energy_powder.svg',
  },
  frisbee: {
    id: 'frisbee',
    name: '飞盘',
    description: '提升心情 +30 (消耗饱食度 -8)',
    price: 40,
    effect: { happiness: 30, hunger: -8 },
    tone: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    image: 'items/frisbee.svg',
  },
  yarn: {
    id: 'yarn',
    name: '毛线球',
    description: '提升心情 +35 (消耗饱食度 -5)',
    price: 45,
    effect: { happiness: 35, hunger: -5 },
    tone: 'bg-violet-50 text-violet-700 border-violet-200',
    image: 'items/yarn.svg',
  },
  premium_ball: {
    id: 'premium_ball',
    name: '高级球',
    description: '外观华丽的球 (1.2倍捕捉率)',
    price: 200,
    effect: {},
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    image: 'items/premium_ball.svg',
  },
  dive_ball: {
    id: 'dive_ball',
    name: '潜水球',
    description: '水中效果更佳 (1.5倍捕捉率)',
    price: 250,
    effect: {},
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
    image: 'items/dive_ball.svg',
  },
  timer_ball: {
    id: 'timer_ball',
    name: '计时球',
    description: '回合数越多越容易捕捉 (1.3倍捕捉率)',
    price: 350,
    effect: {},
    tone: 'bg-slate-100 text-slate-700 border-slate-200',
    image: 'items/timer_ball.svg',
  },
  repeat_ball: {
    id: 'repeat_ball',
    name: '重复球',
    description: '已捕捉过的更容易 (1.5倍捕捉率)',
    price: 280,
    effect: {},
    tone: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    image: 'items/repeat_ball.svg',
  },
  // IV提升道具
  hp_up: {
    id: 'hp_up',
    name: 'HP强化剂',
    description: '提升一只宝可梦的HP个体值 +5（不超过31）',
    price: 3000,
    effect: {},
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    image: 'items/hp_up.svg',
  },
  protein: {
    id: 'protein',
    name: '蛋白粉',
    description: '提升一只宝可梦的攻击个体值 +5（不超过31）',
    price: 3000,
    effect: {},
    tone: 'bg-red-50 text-red-700 border-red-200',
    image: 'items/protein.svg',
  },
  iron: {
    id: 'iron',
    name: '铁块',
    description: '提升一只宝可梦的防御个体值 +5（不超过31）',
    price: 3000,
    effect: {},
    tone: 'bg-slate-100 text-slate-700 border-slate-200',
    image: 'items/iron.svg',
  },
  calcium: {
    id: 'calcium',
    name: '钙片',
    description: '提升一只宝可梦的特攻个体值 +5（不超过31）',
    price: 3000,
    effect: {},
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
    image: 'items/calcium.svg',
  },
  zinc: {
    id: 'zinc',
    name: '锌片',
    description: '提升一只宝可梦的特防个体值 +5（不超过31）',
    price: 3000,
    effect: {},
    tone: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    image: 'items/zinc.svg',
  },
  carbos: {
    id: 'carbos',
    name: '马力强化',
    description: '提升一只宝可梦的速度个体值 +5（不超过31）',
    price: 3000,
    effect: {},
    tone: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    image: 'items/carbos.svg',
  },
  // 进化石道具
  fire_stone: {
    id: 'fire_stone',
    name: '火之石',
    description: '能让特定宝可梦进化的石头。散发着火焰般的光芒。',
    price: 2100,
    effect: {},
    tone: 'bg-red-50 text-red-700 border-red-200',
    image: 'items/fire_stone.svg',
  },
  water_stone: {
    id: 'water_stone',
    name: '水之石',
    description: '能让特定宝可梦进化的石头。蕴含着水之力。',
    price: 2100,
    effect: {},
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
    image: 'items/water_stone.svg',
  },
  thunder_stone: {
    id: 'thunder_stone',
    name: '雷之石',
    description: '能让特定宝可梦进化的石头。闪烁着电火花。',
    price: 2100,
    effect: {},
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    image: 'items/thunder_stone.svg',
  },
  leaf_stone: {
    id: 'leaf_stone',
    name: '叶之石',
    description: '能让特定宝可梦进化的石头。蕴含着大自然的生命力。',
    price: 2100,
    effect: {},
    tone: 'bg-green-50 text-green-700 border-green-200',
    image: 'items/leaf_stone.svg',
  },
  moon_stone: {
    id: 'moon_stone',
    name: '月之石',
    description: '能让特定宝可梦进化的石头。在月光下散发着神秘光芒。',
    price: 2500,
    effect: {},
    tone: 'bg-violet-50 text-violet-700 border-violet-200',
    image: 'items/moon_stone.svg',
  },
};

export const emptyInventory = (): Inventory => ({
  berry: 0,
  apple: 0,
  sandwich: 0,
  toy: 0,
  ball: 0,
  kite: 0,
  candy: 0,
  pokeball: 0,
  greatball: 0,
  ultraball: 0,
  masterball: 0,
  potion: 0,
  rare_candy: 0,
  pokeblock: 0,
  poffin: 0,
  vitamin: 0,
  energy_powder: 0,
  frisbee: 0,
  yarn: 0,
  premium_ball: 0,
  dive_ball: 0,
  timer_ball: 0,
  repeat_ball: 0,
  hp_up: 0,
  protein: 0,
  iron: 0,
  calcium: 0,
  zinc: 0,
  carbos: 0,
  fire_stone: 0,
  water_stone: 0,
  thunder_stone: 0,
  leaf_stone: 0,
  moon_stone: 0,
});

export const getPokemonImageUrl = (speciesId: number) => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${speciesId}.png`;
};

// 判断宝可梦是否满个体值（6V）
export const isPerfectIv = (ivs: BaseStats): boolean => {
  return ivs.hp === 31 && ivs.atk === 31 && ivs.def === 31 && ivs.spa === 31 && ivs.spd === 31 && ivs.spe === 31;
};

export interface WildPokemon {
  speciesId: number;
  level: number;
  hp: number;
  maxHp: number;
  stats: BaseStats;
  isBoss: boolean;
  isShiny?: boolean;
  ability?: string;
  isHiddenAbility?: boolean;
  skills?: Skill[];
}
