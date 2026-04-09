import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Castle, CircleDollarSign, Swords, Trophy, Hand, Gift, Info, X, HeartPulse, Shield, Skull } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import PageHeader from '@/components/PageHeader';
import PokemonImage from '@/components/PokemonImage';
import { BaseStats, SPECIES_INFO, calculateStats, generateRandomNature, emptyEvs, getBaseStats, Skill, Pokemon, ABILITY_INFO, getInitialSkills, generateAbility, STAT_NAMES, isPerfectIv } from '@/types';
import TypeBadges from '@/components/TypeBadges';
import { getPokemonTypes, getDefensiveTypeChart, getTypeEffectiveness } from '@/pokemonTypes';

type WildPokemon = {
  speciesId: number;
  level: number;
  hp: number;
  maxHp: number;
  stats: BaseStats;
  ability?: string;
  isHiddenAbility?: boolean;
  skills?: Skill[];
};

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// 确定性种子随机数生成器（每层怪物固定）
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

// 副本每5层奖励配置
const DUNGEON_FLOOR_REWARDS: Record<number, { coins: number; exp: number; label: string }> = {
  5: { coins: 200, exp: 80, label: '第5层奖励' },
  10: { coins: 500, exp: 200, label: '第10层奖励' },
  15: { coins: 1000, exp: 400, label: '第15层奖励' },
  20: { coins: 2000, exp: 800, label: '第20层奖励' },
  25: { coins: 4000, exp: 1500, label: '第25层奖励' },
  30: { coins: 8000, exp: 3000, label: '第30层奖励' },
  35: { coins: 15000, exp: 6000, label: '第35层奖励' },
  40: { coins: 30000, exp: 10000, label: '第40层奖励' },
  45: { coins: 50000, exp: 15000, label: '第45层奖励' },
  50: { coins: 100000, exp: 30000, label: '第50层奖励' },
};

// 副本难度曲线：每10层增加难度段
const getDungeonDifficulty = (floor: number) => {
  if (floor <= 10) return { ivBonus: 0, evPerStat: 0, levelScale: 1.0, label: '普通', color: 'text-emerald-600', icon: <Shield className="w-3.5 h-3.5" /> };
  if (floor <= 20) return { ivBonus: 5, evPerStat: 10, levelScale: 1.05, label: '困难', color: 'text-amber-600', icon: <Swords className="w-3.5 h-3.5" /> };
  if (floor <= 30) return { ivBonus: 10, evPerStat: 25, levelScale: 1.1, label: '精英', color: 'text-red-600', icon: <Skull className="w-3.5 h-3.5" /> };
  if (floor <= 40) return { ivBonus: 15, evPerStat: 40, levelScale: 1.15, label: '大师', color: 'text-purple-600', icon: <Skull className="w-3.5 h-3.5" /> };
  return { ivBonus: 20, evPerStat: 60, levelScale: 1.2, label: '传说', color: 'text-amber-500', icon: <Skull className="w-3.5 h-3.5" /> };
};

// 预览下一层敌人（基于层数的确定性种子，每层怪物固定）
const previewEnemy = (floor: number) => {
  const diff = getDungeonDifficulty(floor);
  const speciesIds = Object.keys(SPECIES_INFO).map(Number);
  const rng = seededRandom(floor * 73856093);
  const speciesId = speciesIds[Math.floor(rng() * speciesIds.length)];
  const level = Math.max(1, Math.min(100, Math.floor((3 + Math.floor(floor * 1.5) + Math.floor(rng() * 5) - 2) * diff.levelScale)));
  const ivs = { hp: 15 + diff.ivBonus, atk: 15 + diff.ivBonus, def: 15 + diff.ivBonus, spa: 15 + diff.ivBonus, spd: 15 + diff.ivBonus, spe: 15 + diff.ivBonus };
  const stats = calculateStats(getBaseStats(speciesId), ivs, { hp: diff.evPerStat, atk: diff.evPerStat, def: diff.evPerStat, spa: diff.evPerStat, spd: diff.evPerStat, spe: diff.evPerStat }, generateRandomNature(), level);
  return { speciesId, level, stats };
};

export default function Dungeon() {
  const navigate = useNavigate();
  const {
    party, box, battleTeam, coins,
    dungeonFloor, dungeonBest, dungeonClaimedFloors,
    setDungeonFloor, setDungeonBest,
    addCoins, gainExp, gainRandomEv, changeStats, consumeSkillPp,
    claimDungeonFloorReward, healTeam
  } = useGameStore();

  const [inBattle, setInBattle] = useState(false);
  const [wildPkmn, setWildPkmn] = useState<WildPokemon | null>(null);
  const [activePartyIdx, setActivePartyIdx] = useState(0);
  const [playerHp, setPlayerHp] = useState(0);
  const [battleLog, setBattleLog] = useState<string>('');
  const [isActionDisabled, setIsActionDisabled] = useState(false);
  const [playerAnim, setPlayerAnim] = useState('');
  const [wildAnim, setWildAnim] = useState('');
  const [showWildDetail, setShowWildDetail] = useState(false);
  const [showRewardClaimed, setShowRewardClaimed] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [enemyPreview, setEnemyPreview] = useState<ReturnType<typeof previewEnemy> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  };

  const battlePokemons = useMemo(() => {
    return battleTeam.map(id => party.find(p => p.id === id) || box.find(p => p.id === id)).filter(Boolean) as Pokemon[];
  }, [battleTeam, party, box]);

  const activePokemon = battlePokemons[activePartyIdx];

  // Refresh enemy preview when floor changes
  useEffect(() => {
    if (!inBattle) {
      setEnemyPreview(previewEnemy(dungeonFloor));
    }
  }, [dungeonFloor, inBattle]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1500);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (battlePokemons.length === 0) {
      navigate('/', { replace: true });
      return;
    }
    if (!inBattle) {
      const firstAliveIdx = battlePokemons.findIndex(p => p.hp > 0);
      if (firstAliveIdx !== -1) {
        setActivePartyIdx(firstAliveIdx);
        setPlayerHp(battlePokemons[firstAliveIdx].hp);
      }
    }
  }, [battlePokemons, navigate, inBattle]);

  const closeBattle = () => {
    setInBattle(false);
    setWildPkmn(null);
    const firstAliveIdx = battlePokemons.findIndex(p => p.hp > 0);
    if (firstAliveIdx !== -1) {
      setActivePartyIdx(firstAliveIdx);
      setPlayerHp(battlePokemons[firstAliveIdx].hp);
    }
  };

  const handleHeal = () => {
    const cost = battleTeam.length * 30;
    if (coins < cost) {
      showToast(`金币不足！需要 ${cost} 金币`);
      return;
    }
    const ok = healTeam();
    if (ok) {
      showToast('全队状态已恢复！');
      const firstAliveIdx = battlePokemons.findIndex(p => p.hp > 0);
      if (firstAliveIdx !== -1) {
        setActivePartyIdx(firstAliveIdx);
        const newActive = party.find(p => p.id === battleTeam[firstAliveIdx]) || box.find(p => p.id === battleTeam[firstAliveIdx]);
        if (newActive) setPlayerHp(newActive.hp);
      }
      setEnemyPreview(previewEnemy(dungeonFloor, activePokemon?.level || 5));
    }
  };

  const challenge = () => {
    if (!activePokemon || inBattle) return;
    const aliveIdx = battlePokemons.findIndex(p => p.hp > 0);
    if (aliveIdx === -1) return;
    if (activePartyIdx !== aliveIdx) {
      setActivePartyIdx(aliveIdx);
      setPlayerHp(battlePokemons[aliveIdx].hp);
    }

    const diff = getDungeonDifficulty(dungeonFloor);
    const speciesIds = Object.keys(SPECIES_INFO).map(Number);
    const rng = seededRandom(dungeonFloor * 73856093);
    const speciesId = speciesIds[Math.floor(rng() * speciesIds.length)];
    const rawLevel = 3 + Math.floor(dungeonFloor * 1.5) + Math.floor(rng() * 5) - 2;
    const level = Math.max(1, Math.min(100, Math.floor(rawLevel * diff.levelScale)));

    const ivs = { hp: 15 + diff.ivBonus, atk: 15 + diff.ivBonus, def: 15 + diff.ivBonus, spa: 15 + diff.ivBonus, spd: 15 + diff.ivBonus, spe: 15 + diff.ivBonus };
    const evs = { hp: diff.evPerStat, atk: diff.evPerStat, def: diff.evPerStat, spa: diff.evPerStat, spd: diff.evPerStat, spe: diff.evPerStat };
    const stats = calculateStats(getBaseStats(speciesId), ivs, evs, generateRandomNature(), level);
    const abilityInfo = generateAbility(speciesId);

    setWildPkmn({ speciesId, level, hp: stats.hp, maxHp: stats.hp, stats, ability: abilityInfo.ability, isHiddenAbility: abilityInfo.isHidden, skills: getInitialSkills(speciesId) });
    setInBattle(true);
    setBattleLog(`第 ${dungeonFloor} 层的守卫 ${SPECIES_INFO[speciesId]?.name} 出现了！`);
  };

  const attack = (skill?: Skill) => {
    if (!wildPkmn || !activePokemon || wildPkmn.hp <= 0 || playerHp <= 0 || isActionDisabled) return;

    let pDmg = 0;
    let isCrit = false;
    let wildHp = wildPkmn.hp;
    let myHp = playerHp;

    setIsActionDisabled(true);

    if (skill) {
      const ok = consumeSkillPp(skill.id, activePokemon.id);
      if (!ok) return;
      const levelFactor = (2 * activePokemon.level) / 5 + 2;
      const baseDmg = (levelFactor * skill.power * ((activePokemon.stats?.atk ?? 10) / (wildPkmn.stats?.def ?? 10))) / 50 + 2;
      isCrit = Math.random() < 1 / 16;
      const critMultiplier = isCrit ? 1.5 : 1;
      pDmg = Math.max(1, Math.floor(baseDmg * critMultiplier * (Math.random() * 0.15 + 0.85)));
    } else {
      pDmg = Math.max(1, Math.floor((activePokemon.stats?.atk ?? 10) * 0.2 + rand(1, 5)));
    }

    const playerSpe = activePokemon.stats?.spe ?? 0;
    const wildSpe = wildPkmn.stats?.spe ?? 0;
    const playerGoesFirst = playerSpe >= wildSpe;

    if (playerGoesFirst) {
      executePlayerAttack();
    } else {
      executeWildAttack((afterHp) => {
        if (afterHp > 0) setTimeout(executePlayerAttack, 1000);
      });
    }

    function executePlayerAttack() {
      setPlayerAnim('animate-bounce');
      setTimeout(() => setPlayerAnim(''), 300);
      wildHp = Math.max(0, wildHp - pDmg);
      setWildPkmn((prev) => (prev ? { ...prev, hp: wildHp } : prev));
      setBattleLog(`你使用了 ${skill ? skill.name : '攻击'}！造成了 ${pDmg} 伤害${isCrit ? '(击中要害)' : ''}。`);
      if (wildHp <= 0) {
        handleWin();
      } else if (playerGoesFirst) {
        setTimeout(() => executeWildAttack(), 1000);
      } else {
        setTimeout(() => setIsActionDisabled(false), 1000);
      }
    }

    function executeWildAttack(callback?: (afterHp: number) => void) {
      if (!wildPkmn || !activePokemon) return;
      setWildAnim('animate-bounce');
      setTimeout(() => setWildAnim(''), 300);

      const skills = wildPkmn.skills || [];
      const usable = skills.filter((s) => s.pp > 0);
      const chosen = usable.slice().sort((a, b) => (b.power || 0) - (a.power || 0))[0];

      if (chosen && chosen.pp > 0) {
        setWildPkmn((prev) => {
          if (!prev?.skills) return prev;
          return { ...prev, skills: prev.skills.map((s) => (s.id === chosen.id ? { ...s, pp: Math.max(0, s.pp - 1) } : s)) };
        });
      }

      const power = chosen?.power ?? 40;
      const name = chosen?.name ?? '撞击';
      const wIsCrit = Math.random() < 1 / 16;
      const wDmg = Math.max(1, Math.floor(((((2 * wildPkmn.level) / 5 + 2) * power * ((wildPkmn.stats?.atk ?? 10) / (activePokemon.stats?.def ?? 10))) / 50 + 2) * (wIsCrit ? 1.5 : 1) * (Math.random() * 0.15 + 0.85)));

      myHp = Math.max(0, myHp - wDmg);
      setPlayerHp(myHp);
      changeStats({ hp: -wDmg }, activePokemon.id);
      setBattleLog(`守卫使用了 ${name}！造成了 ${wDmg} 伤害${wIsCrit ? '(击中要害)' : ''}。`);
      if (myHp <= 0) {
        setTimeout(handleFaint, 1500);
      } else if (callback) {
        callback(myHp);
      } else {
        setTimeout(() => setIsActionDisabled(false), 1000);
      }
    }

    function handleWin() {
      const expGain = wildPkmn!.level * 15;
      const coinGain = dungeonFloor * 20 + rand(10, 30);
      const evBonus = Math.random() < 0.25;
      if (evBonus) gainRandomEv(activePokemon.id, 1);
      setBattleLog(`击败了守卫！获得 ${expGain} 经验和 ${coinGain} 金币。${evBonus ? '额外获得随机努力值 +1。' : ''}`);
      gainExp(expGain, activePokemon.id);
      addCoins(coinGain);
      const nextFloor = dungeonFloor + 1;
      setDungeonFloor(nextFloor);
      if (nextFloor > dungeonBest) setDungeonBest(nextFloor);
      setTimeout(() => { closeBattle(); setIsActionDisabled(false); }, 2000);
    }

    function handleFaint() {
      setBattleLog(`${activePokemon.name} 倒下了！`);
      setTimeout(() => {
        const nextAliveIdx = battlePokemons.findIndex((p, idx) => idx > activePartyIdx && p.hp > 0);
        if (nextAliveIdx !== -1) {
          setActivePartyIdx(nextAliveIdx);
          setPlayerHp(battlePokemons[nextAliveIdx].hp);
          setBattleLog(`去吧！${battlePokemons[nextAliveIdx].name}！`);
          setIsActionDisabled(false);
        } else {
          const anyAliveIdx = battlePokemons.findIndex(p => p.hp > 0);
          if (anyAliveIdx !== -1) {
            setActivePartyIdx(anyAliveIdx);
            setPlayerHp(battlePokemons[anyAliveIdx].hp);
            setBattleLog(`去吧！${battlePokemons[anyAliveIdx].name}！`);
            setIsActionDisabled(false);
          } else {
            setBattleLog('队伍全军覆没！被传送回副本入口...');
            setDungeonFloor(1);
            setTimeout(() => { closeBattle(); setIsActionDisabled(false); }, 2000);
          }
        }
      }, 1500);
    }
  };

  const runAway = () => {
    setBattleLog('逃离了副本！');
    setTimeout(() => { closeBattle(); }, 1000);
  };

  if (!activePokemon) return null;

  const difficulty = getDungeonDifficulty(dungeonFloor);
  const healCost = battleTeam.length * 30;

  return (
    <div className="h-full w-full bg-gradient-to-b from-indigo-50 via-white to-white relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 opacity-40 pointer-events-none z-0">
        <div className="absolute -top-24 left-10 w-80 h-80 rounded-full bg-indigo-200 blur-3xl" />
        <div className="absolute top-48 -right-24 w-80 h-80 rounded-full bg-violet-200 blur-3xl" />
      </div>

      <PageHeader
        title="副本"
        onBack={() => navigate('/map')}
        right={
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/80 border border-indigo-200">
            <CircleDollarSign className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-black text-slate-900">{coins}</span>
          </div>
        }
      />

      {!inBattle ? (
        <div className="relative px-6 py-6 space-y-4 flex-1 overflow-y-auto">
          {/* Floor info */}
          <div className="rounded-3xl border border-indigo-200 bg-white/80 shadow-sm p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-indigo-700">当前层数</div>
              <div className="text-3xl font-black text-slate-900">{dungeonFloor}</div>
              <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                最高 {dungeonBest} 层
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="w-14 h-14 rounded-3xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <Castle className="w-7 h-7 text-indigo-700" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black ${difficulty.color}`}>
                {difficulty.icon}
                {difficulty.label}
              </div>
            </div>
          </div>

          {/* Current pokemon + heal */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-slate-500">当前出战</div>
              <button
                onClick={handleHeal}
                disabled={coins < healCost}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">一键治愈 {healCost} 金币</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <PokemonImage speciesId={activePokemon.speciesId} alt="pokemon" isShiny={activePokemon.isShiny} className="w-16 h-16 object-contain" />
              <div>
                <div className="text-lg font-black text-slate-900">{activePokemon.name} <span className="text-xs font-bold text-slate-400">Lv.{activePokemon.level}</span>
                {isPerfectIv(activePokemon.ivs) && <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 ml-1">6V</span>}
                </div>
                <TypeBadges speciesId={activePokemon.speciesId} size="xs" className="justify-start mt-1" />
                <div className="text-sm font-bold text-emerald-600 mt-1">HP: {playerHp}/{activePokemon.maxHp}</div>
              </div>
            </div>
          </div>

          {/* Enemy preview */}
          {enemyPreview && SPECIES_INFO[enemyPreview.speciesId] && (
            <motion.div
              key={`preview-${dungeonFloor}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4"
            >
              <div className="text-xs font-bold text-slate-500 mb-3">下一层预览</div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                  <PokemonImage speciesId={enemyPreview.speciesId} alt="preview" className="w-12 h-12 object-contain" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-800">{SPECIES_INFO[enemyPreview.speciesId].name}</span>
                    <span className="text-[10px] font-bold text-slate-500">Lv.{enemyPreview.level}</span>
                  </div>
                  <TypeBadges speciesId={enemyPreview.speciesId} size="xs" className="justify-start mt-1" />
                  <div className="mt-1.5 space-y-1">
                    {(['hp', 'atk', 'def', 'spa', 'spe'] as const).map(stat => (
                      <div key={stat} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 w-7">{STAT_NAMES[stat]}</span>
                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-300 rounded-full" style={{ width: `${Math.min(100, (enemyPreview.stats[stat] / 200) * 100)}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-600 w-7 text-right">{enemyPreview.stats[stat]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={challenge}
            disabled={playerHp <= 0}
            className={[
              'w-full rounded-3xl px-5 py-5 border shadow-sm',
              'bg-indigo-700 text-white font-black text-lg flex items-center justify-center gap-2',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            ].join(' ')}
          >
            <Swords className="w-5 h-5" />
            {playerHp <= 0 ? '体力耗尽' : '挑战下一层'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDungeonFloor(1)}
            className="w-full rounded-3xl px-5 py-4 border border-slate-200 bg-white font-black text-slate-700 shadow-sm"
          >
            重置到第1层
          </motion.button>

          {/* Floor Rewards */}
          {Object.entries(DUNGEON_FLOOR_REWARDS)
            .filter(([floor]) => parseInt(floor) <= dungeonBest)
            .map(([floor, reward]) => {
              const floorNum = parseInt(floor);
              const isClaimed = dungeonClaimedFloors.includes(floorNum);
              return (
                <div key={floor} className="rounded-3xl border border-amber-200 bg-white shadow-sm p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-black text-slate-800 text-sm">{reward.label}</div>
                      <div className="text-xs font-bold text-slate-500">{reward.coins} 金币 + {reward.exp} 经验</div>
                    </div>
                  </div>
                  {isClaimed ? (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">已领取</span>
                  ) : floorNum <= dungeonBest ? (
                    <button
                      onClick={() => {
                        const ok = claimDungeonFloorReward(floorNum);
                        if (ok) {
                          addCoins(reward.coins);
                          gainExp(reward.exp);
                          setShowRewardClaimed(reward.label);
                          setTimeout(() => setShowRewardClaimed(null), 2000);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-white font-black text-xs shadow-lg shadow-amber-200 hover:bg-amber-600 transition-colors"
                    >
                      领取
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl">未到达</span>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        /* Battle UI */
        <div className="relative flex-1 flex flex-col z-10">
          <div className="flex-1 px-6 pt-3 pb-4 flex flex-col gap-4 overflow-y-auto">
            {/* Wild Pokemon */}
            {wildPkmn && (
              <div className="flex justify-end w-full relative">
                <div className="flex flex-col items-end">
                  <div
                    className="bg-white/80 rounded-xl px-3 py-1.5 shadow-sm border border-slate-200 mb-1.5 w-48 relative cursor-pointer hover:bg-white hover:shadow-md transition-colors"
                    onClick={() => setShowWildDetail(!showWildDetail)}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-slate-800">
                        {SPECIES_INFO[wildPkmn.speciesId]?.name || '守卫'}
                      </span>
                      <span className="text-xs font-bold text-slate-500">Lv.{wildPkmn.level}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <TypeBadges speciesId={wildPkmn.speciesId} size="xs" className="flex-1" />
                      {wildPkmn.ability && (
                        <div className="relative group cursor-help shrink-0">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm border bg-indigo-100 text-indigo-700 border-indigo-200">
                            {wildPkmn.ability}
                          </span>
                          <div className="hidden group-hover:block absolute top-full right-0 mt-1 w-48 bg-slate-800 text-white text-xs p-2 rounded shadow-xl whitespace-normal z-[80] pointer-events-none">
                            {ABILITY_INFO[wildPkmn.ability] || '暂无说明'}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-indigo-500"
                        animate={{ width: `${(wildPkmn.hp / wildPkmn.maxHp) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className={wildAnim}>
                    <PokemonImage speciesId={wildPkmn.speciesId} alt="wild" className="w-32 h-32 object-contain" />
                  </div>
                </div>
              </div>
            )}

            {/* Player Pokemon */}
            <div className="flex justify-start w-full -mt-2">
              <div className="flex flex-col items-start">
                <div className="bg-white/80 rounded-xl px-3 py-1.5 shadow-sm border border-slate-200 mt-1.5 w-48 relative">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-slate-800">{activePokemon.name}</span>
                    <span className="text-xs font-bold text-slate-500">Lv.{activePokemon.level}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <TypeBadges speciesId={activePokemon.speciesId} size="xs" className="flex-1" />
                    {activePokemon.ability && (
                      <div className="relative group cursor-help shrink-0">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm border bg-indigo-100 text-indigo-700 border-indigo-200">
                          {activePokemon.ability}
                        </span>
                        <div className="hidden group-hover:block absolute top-full right-0 mt-1 w-48 bg-slate-800 text-white text-xs p-2 rounded shadow-xl whitespace-normal z-[80] pointer-events-none">
                          {ABILITY_INFO[activePokemon.ability] || '暂无说明'}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500"
                      animate={{ width: `${(playerHp / activePokemon.maxHp) * 100}%` }}
                    />
                  </div>
                  <div className="text-right text-[10px] font-bold text-slate-500 mt-0.5">
                    {Math.max(0, Math.floor(playerHp))}/{activePokemon.maxHp}
                  </div>
                </div>
                <div className={playerAnim}>
                  <PokemonImage speciesId={activePokemon.speciesId} alt="player" isShiny={activePokemon.isShiny} className="w-32 h-32 object-contain scale-x-[-1]" />
                </div>
              </div>
            </div>
          </div>

          {/* Battle Menu */}
          <div className="bg-slate-900 rounded-t-3xl p-5 shadow-2xl text-white shrink-0 pointer-events-auto">
            <div className="flex-1 overflow-y-auto no-scrollbar mb-4 min-h-0">
              {/* Wild Detail Panel (same style as Wild.tsx) */}
              <AnimatePresence>
                {showWildDetail && wildPkmn && (() => {
                  const wildTypes = getPokemonTypes(wildPkmn.speciesId);
                  const defChart = getDefensiveTypeChart(wildTypes);
                  return (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden mb-3"
                    >
                      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                          <PokemonImage speciesId={wildPkmn.speciesId} alt="wild" className="w-12 h-12 object-contain" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm">{SPECIES_INFO[wildPkmn.speciesId]?.name}</span>
                              <span className="text-[10px] font-bold text-slate-400">Lv.{wildPkmn.level}</span>
                            </div>
                            {wildPkmn.ability && (
                              <div className="text-[10px] font-bold text-indigo-300 mt-0.5">{wildPkmn.ability}{wildPkmn.isHiddenAbility ? ' ★' : ''} - {ABILITY_INFO[wildPkmn.ability] || '暂无说明'}</div>
                            )}
                          </div>
                        </div>
                        {/* Type effectiveness vs player */}
                        <div className="mb-3">
                          <div className="text-[10px] font-bold text-slate-400 mb-1.5">我方技能属性克制</div>
                          <div className="flex flex-wrap gap-1">
                            {activePokemon.skills.map((s) => {
                              const eff = getTypeEffectiveness(s.type, wildTypes);
                              return (
                                <div key={s.id} className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                  eff.multiplier === 0 ? 'bg-slate-700 text-slate-500 border-slate-600' :
                                  eff.multiplier >= 2 ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700' :
                                  eff.multiplier < 1 ? 'bg-red-900/50 text-red-300 border-red-700' :
                                  'bg-slate-700 text-slate-300 border-slate-600'
                                }`}>
                                  {s.name} <span className="opacity-70">{s.type}</span>
                                  <span className="ml-1">{eff.multiplier === 0 ? '✕' : `${eff.multiplier}x`}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* Defensive type chart */}
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 mb-1.5">敌方属性弱点/抗性</div>
                          <div className="flex flex-wrap gap-1">
                            {defChart.map((d) => (
                              <div key={d.attackType} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                d.multiplier === 0 ? 'bg-slate-700 text-slate-500' :
                                d.multiplier >= 2 ? 'bg-emerald-800 text-emerald-300' :
                                d.multiplier < 1 ? 'bg-red-800 text-red-300' :
                                'bg-slate-700 text-slate-400'
                              }`}>
                                {d.attackType} {d.multiplier}x
                              </div>
                            ))}
                            {defChart.length === 0 && <span className="text-[10px] text-slate-500">无明显弱点</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 min-h-[80px] flex items-center">
                <span className="font-medium">{battleLog}</span>
              </div>
            </div>
            <div className="shrink-0">
              <div className="grid grid-cols-2 gap-2">
                {activePokemon.skills.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => attack(s)}
                    disabled={s.pp <= 0 || playerHp <= 0 || isActionDisabled}
                    className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-900 border border-red-200 font-bold py-2.5 rounded-xl flex flex-col items-center justify-center transition-colors relative group pointer-events-auto"
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] opacity-70">PP {s.pp}/{s.maxPp} | 威力 {s.power}</span>
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs font-normal p-2 rounded shadow-xl whitespace-normal z-50 pointer-events-none">
                      {s.description || '暂无说明'}
                    </div>
                  </button>
                ))}
                <button onClick={runAway} disabled={isActionDisabled} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors col-span-2 mt-1 pointer-events-auto">
                  <Hand className="w-5 h-5" /> 逃跑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-xl z-50"
        >
          {toast}
        </motion.div>
      )}

      {/* Reward Claimed Toast */}
      {showRewardClaimed && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-full font-bold text-sm z-[70] shadow-lg animate-bounce">
          领取成功：{showRewardClaimed}！
        </div>
      )}
    </div>
  );
}
