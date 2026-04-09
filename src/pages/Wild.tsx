import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Trees, ShieldAlert, HeartPulse, Sparkles, Sword, Hand, Briefcase, Zap, Star, Flame, Utensils, Smile } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import PageHeader from '@/components/PageHeader';
import PokemonImage from '@/components/PokemonImage';
import { ItemId, ITEMS, Skill, getInitialSkills, BaseStats, generateRandomIvs, generateRandomNature, getBaseStats, calculateStats, Pokemon, generateAbility, emptyEvs, SPECIES_INFO, WILD_MAPS, ABILITY_INFO, getNatureText, MAX_HUNGER, MAX_HAPPINESS, getAllLearnedSkills, isPerfectIv } from '@/types';
import TypeBadges from '@/components/TypeBadges';
import BaseStatsChart from '@/components/BaseStatsChart';
import ItemImage from '@/components/ItemImage';
import { getPokemonTypes, getDefensiveTypeChart, getTypeEffectiveness } from '@/pokemonTypes';

type EventType = 'coins' | 'item' | 'trap' | 'spring' | 'ruin' | 'encounter' | 'happiness_boost' | 'rare_item' | 'training';

interface ExploreEvent {
  type: EventType;
  message: string;
  subMessage?: string;
  color: string;
  icon: LucideIcon;
}

type WildPokemon = {
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
};

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export default function Wild() {
  const navigate = useNavigate();
  const { party, box, battleTeam, inventory, pokedex, currentMapId, unlockedMaps, defeatedBosses, setCurrentMap, defeatBoss, unlockMap, addCoins, gainExp, addItem, changeStats, catchPokemon, consumeItem, consumeSkillPp, markSeen, releasePokemon, healTeam, restoreTeamHunger, restoreTeamHappiness, coins, gainRandomEv, setSkills, autoFillSkills } = useGameStore();
  
  const [eventResult, setEventResult] = useState<ExploreEvent | null>(null);
  const [rolling, setRolling] = useState(false);
  const [showMapSelect, setShowMapSelect] = useState(false);
  const [showTeamSelect, setShowTeamSelect] = useState(false);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  
  // Battle state
  const [inBattle, setInBattle] = useState(false);
  const [wildPkmn, setWildPkmn] = useState<WildPokemon | null>(null);
  const [battleLog, setBattleLog] = useState<string>('野生的宝可梦出现了！');
  const [showBag, setShowBag] = useState(false);
  const [capturePhase, setCapturePhase] = useState(false);
  const [caughtPokemonInfo, setCaughtPokemonInfo] = useState<Pokemon | null>(null);
  const [isActionDisabled, setIsActionDisabled] = useState(false);
  
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(0);
  const [catchAttempts, setCatchAttempts] = useState(0);

  // Animation states
  const [playerAnim, setPlayerAnim] = useState('');
  const [wildAnim, setWildAnim] = useState('');
  const [ballAnim, setBallAnim] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [showPlayerAbility, setShowPlayerAbility] = useState(false);
  const [showWildAbility, setShowWildAbility] = useState(false);
  const [showWildDetail, setShowWildDetail] = useState(false);
  const [skillSwapSlot, setSkillSwapSlot] = useState<number | null>(null);

  const handleHeal = () => {
    const cost = battleTeam.length * 30;
    if (coins < cost) {
      setToast(`金币不足！需要 ${cost} 金币`);
      return;
    }
    const ok = healTeam();
    if (ok) {
      setToast('全队状态已恢复！');
      const firstAliveIdx = battleTeam.findIndex(id => {
        const p = party.find(x => x.id === id) || box.find(x => x.id === id);
        return p && p.hp > 0;
      });
      if (firstAliveIdx !== -1) {
        setActiveTeamIndex(firstAliveIdx);
        const newActive = party.find(p => p.id === battleTeam[firstAliveIdx]) || box.find(p => p.id === battleTeam[firstAliveIdx]);
        if (newActive) setPlayerHp(newActive.hp);
      }
    }
  };

  const handleRestoreHunger = () => {
    const cost = battleTeam.length * 50;
    if (coins < cost) {
      setToast(`金币不足！需要 ${cost} 金币`);
      return;
    }
    const ok = restoreTeamHunger();
    if (ok) {
      setToast('全队饱食度已恢复！');
    }
  };

  const handleRestoreHappiness = () => {
    const cost = battleTeam.length * 50;
    if (coins < cost) {
      setToast(`金币不足！需要 ${cost} 金币`);
      return;
    }
    const ok = restoreTeamHappiness();
    if (ok) {
      setToast('全队心情已恢复！');
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const battlePokemons = useMemo(() => {
    return battleTeam.map(id => party.find(p => p.id === id) || box.find(p => p.id === id)).filter(Boolean) as Pokemon[];
  }, [battleTeam, party, box]);

  const activePokemon = battlePokemons[activeTeamIndex];

  // Initialize active pokemon
  const autoFilledRef = useRef(false);
  useEffect(() => {
    if (battlePokemons.length === 0) {
      navigate('/', { replace: true });
      return;
    }
    // 自动填补技能（仅首次加载时执行，避免循环触发）
    if (!autoFilledRef.current) {
      autoFilledRef.current = true;
      autoFillSkills();
    }
    if (!inBattle) {
      const firstAliveIdx = battlePokemons.findIndex(p => p.hp > 0);
      if (firstAliveIdx !== -1) {
        setActiveTeamIndex(firstAliveIdx);
        setPlayerHp(battlePokemons[firstAliveIdx].hp);
      }
    }
  }, [battlePokemons, navigate, inBattle]);

  // Level sync removed: wild pokemon level is independent of player level

  const closeBattle = () => {
    setInBattle(false);
    setWildPkmn(null);
    setShowBag(false);
    setCapturePhase(false);
    setCaughtPokemonInfo(null);
    setCatchAttempts(0);
    setShowWildDetail(false);
    setShowTeamSelect(false);
    setShowMapSelect(false);
    setIsActionDisabled(false);
    setEventResult(null);
    setRolling(false);
    
    // Switch to first alive pokemon after battle
    const firstAliveIdx = battlePokemons.findIndex(p => p.hp > 0);
    if (firstAliveIdx !== -1) {
      setActiveTeamIndex(firstAliveIdx);
      setPlayerHp(battlePokemons[firstAliveIdx].hp);
    }
  };

  const switchPokemon = (index: number) => {
    if (!wildPkmn || !activePokemon) return;
    const newActiveId = battleTeam[index];
    const newActivePokemon = party.find(p => p.id === newActiveId) || box.find(p => p.id === newActiveId);
    if (!newActivePokemon || newActivePokemon.hp <= 0) return;

    setShowTeamSelect(false);

    setIsActionDisabled(true);

    // Calculate Speed based Turn logic
    const wildSpeed = wildPkmn.stats.spe;
    const currentSpeed = activePokemon.stats.spe;
    
    // Wild pokemon randomly picks a skill
    const wildSkill = wildPkmn.skills && wildPkmn.skills.length > 0 
      ? wildPkmn.skills[Math.floor(Math.random() * wildPkmn.skills.length)] 
      : { name: '撞击', power: 40, maxPp: 35, pp: 35, type: '一般', id: 'tackle' };

    if (currentSpeed >= wildSpeed) {
      // Player is faster: Switch happens first, then Wild Pokemon attacks the NEW Pokemon
      setActiveTeamIndex(index);
      const wildDamage = Math.max(1, Math.floor((wildPkmn.level * 0.4 + 2) * wildSkill.power * (wildPkmn.stats.atk / newActivePokemon.stats.def) / 50) + 2);
      
      const newHp = Math.max(0, newActivePokemon.hp - wildDamage);
      setPlayerHp(newHp);
      changeStats({ hp: -wildDamage }, newActiveId);

      setBattleLog(`换上了 ${newActivePokemon.name}！\n野生 ${SPECIES_INFO[wildPkmn.speciesId]?.name || '宝可梦'} 使用了 ${wildSkill.name}，造成了 ${wildDamage} 点伤害！`);

      if (newHp <= 0) {
        setTimeout(() => {
          setBattleLog(`${newActivePokemon.name} 倒下了！`);
          setIsActionDisabled(false);
        }, 1000);
      } else {
        setTimeout(() => setIsActionDisabled(false), 1000);
      }
    } else {
      // Wild is faster: Wild Pokemon attacks the CURRENT Pokemon first, then switch happens
      const wildDamage = Math.max(1, Math.floor((wildPkmn.level * 0.4 + 2) * wildSkill.power * (wildPkmn.stats.atk / activePokemon.stats.def) / 50) + 2);
      
      const newCurrentHp = Math.max(0, playerHp - wildDamage);
      setPlayerHp(newCurrentHp);
      changeStats({ hp: -wildDamage }, activePokemon.id);

      if (newCurrentHp <= 0) {
        setBattleLog(`野生 ${SPECIES_INFO[wildPkmn.speciesId]?.name || '宝可梦'} 使用了 ${wildSkill.name}，造成了 ${wildDamage} 点伤害！\n${activePokemon.name} 倒下了！\n换上了 ${newActivePokemon.name}！`);
      } else {
        setBattleLog(`野生 ${SPECIES_INFO[wildPkmn.speciesId]?.name || '宝可梦'} 使用了 ${wildSkill.name}，造成了 ${wildDamage} 点伤害！\n换上了 ${newActivePokemon.name}！`);
      }

      // Defer the UI update of active Pokemon slightly for effect
      setTimeout(() => {
        setActiveTeamIndex(index);
        setPlayerHp(newActivePokemon.hp);
        setIsActionDisabled(false);
      }, 1000);
    }
  };

  const dropTable = useMemo(() => (['berry', 'candy', 'toy', 'pokeball', 'potion', 'pokeblock'] as ItemId[]), []);

  const explore = (isBossEncounter: boolean = false) => {
    if (!activePokemon || rolling || inBattle) return;
    
    const aliveIdx = battlePokemons.findIndex(p => p.hp > 0);
    if (aliveIdx === -1) {
      setEventResult({
        type: 'trap',
        message: '体力不支',
        subMessage: '你的队伍已全部倒下，无法探索。',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: ShieldAlert
      });
      return;
    }

    if (activeTeamIndex !== aliveIdx) {
      setActiveTeamIndex(aliveIdx);
      setPlayerHp(battlePokemons[aliveIdx].hp);
    }

    // 检查饱食度和心情是否足够探索
    const exploreHungerCost = 5;
    const exploreHappinessCost = 3;
    if (battlePokemons[aliveIdx].hunger < exploreHungerCost) {
      setEventResult({
        type: 'trap',
        message: '饱食度不足',
        subMessage: `需要 ${exploreHungerCost} 饱食度才能探索，请先喂食。`,
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: Utensils
      });
      return;
    }
    if (battlePokemons[aliveIdx].happiness < exploreHappinessCost) {
      setEventResult({
        type: 'trap',
        message: '心情不足',
        subMessage: `需要 ${exploreHappinessCost} 心情才能探索，请先玩耍。`,
        color: 'bg-pink-50 text-pink-700 border-pink-200',
        icon: Smile
      });
      return;
    }

    setRolling(true);
    setEventResult(null);

    changeStats({ hunger: -exploreHungerCost, happiness: -exploreHappinessCost }, battlePokemons[aliveIdx].id);

    window.setTimeout(() => {
      const mapInfo = WILD_MAPS[currentMapId];
      const wildPool = mapInfo.wildPool;
      
      let type: EventType = 'encounter';
      if (!isBossEncounter) {
        const roll = Math.random();
        if (roll < 0.08) type = 'coins';
        else if (roll < 0.14) type = 'item';
        else if (roll < 0.18) type = 'rare_item';
        else if (roll < 0.22) type = 'trap';
        else if (roll < 0.26) type = 'spring';
        else if (roll < 0.30) type = 'ruin';
        else if (roll < 0.34) type = 'happiness_boost';
        else if (roll < 0.37) type = 'training';
        // encounter 概率 = 63%
      }

      let result: ExploreEvent;

      if (type === 'coins') {
        const amt = rand(15, 40);
        addCoins(amt);
        result = { type, message: `发现了 ${amt} 金币！`, color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Coins };
      } else if (type === 'item') {
        const item = dropTable[rand(0, dropTable.length - 1)];
        addItem(item, 1);
        result = { type, message: `找到了一个 ${ITEMS[item].name}！`, color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Briefcase };
      } else if (type === 'trap') {
        const dmg = rand(5, 15);
        changeStats({ hp: -dmg }, battlePokemons[aliveIdx].id);
        const newHp = Math.max(0, battlePokemons[aliveIdx].hp - dmg);
        setPlayerHp(newHp);
        result = { type, message: '踩到了陷阱！', subMessage: `扣除了 ${dmg} 点体力。`, color: 'bg-red-50 text-red-700 border-red-200', icon: ShieldAlert };
      } else if (type === 'spring') {
        changeStats({ hp: 20, happiness: 20 }, battlePokemons[aliveIdx].id);
        setPlayerHp(Math.min(battlePokemons[aliveIdx].maxHp, battlePokemons[aliveIdx].hp + 20));
        result = { type, message: '发现了治愈之泉！', subMessage: '体力与心情大幅恢复。', color: 'bg-pink-50 text-pink-700 border-pink-200', icon: HeartPulse };
      } else if (type === 'ruin') {
        const exp = rand(30, 60);
        gainExp(exp, battlePokemons[aliveIdx].id);
        result = { type, message: '探索了古代遗迹！', subMessage: `获得了 ${exp} 经验值。`, color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Sparkles };
      } else if (type === 'happiness_boost') {
        changeStats({ happiness: 15 }, battlePokemons[aliveIdx].id);
        result = { type, message: '遇到了友善的宝可梦！', subMessage: '心情恢复了 15 点。', color: 'bg-pink-50 text-pink-700 border-pink-200', icon: HeartPulse };
      } else if (type === 'rare_item') {
        const rareItems: ItemId[] = ['rare_candy', 'greatball', 'ultraball'];
        const item = rareItems[rand(0, rareItems.length - 1)];
        addItem(item, 1);
        result = { type, message: `发现了稀有道具 ${ITEMS[item].name}！`, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Star };
      } else if (type === 'training') {
        const exp = rand(15, 30);
        gainExp(exp, battlePokemons[aliveIdx].id);
        changeStats({ happiness: -3 }, battlePokemons[aliveIdx].id);
        result = { type, message: '进行了战斗训练！', subMessage: `获得 ${exp} 经验值，心情 -3。`, color: 'bg-red-50 text-red-700 border-red-200', icon: Zap };
      } else {
        // Encounter
        let speciesId = wildPool[rand(0, wildPool.length - 1)];
        let level = rand(mapInfo.levelRange[0], mapInfo.levelRange[1]);
        
        if (isBossEncounter && mapInfo.bossId) {
          speciesId = mapInfo.bossId;
          level = mapInfo.levelRange[1] + mapInfo.bossLevelBonus;
        }

        const isShiny = Math.random() < 1/4096;
        let ivs = isShiny ? { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } : generateRandomIvs();
        let evs = emptyEvs();
        
        // Boss gets much better IVs and EVs
        if (isBossEncounter) {
          ivs = { hp: 25, atk: 25, def: 25, spa: 25, spd: 25, spe: 25 };
          evs = { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 };
        }
        
        const baseStats = getBaseStats(speciesId);
        const stats = calculateStats(baseStats, ivs, evs, generateRandomNature(), level, isShiny);
        const abilityInfo = generateAbility(speciesId);
        
        setWildPkmn({ 
          speciesId, 
          level, 
          hp: stats.hp, 
          maxHp: stats.hp, 
          stats, 
          isBoss: isBossEncounter, 
          isShiny,
          ability: abilityInfo.ability,
          isHiddenAbility: abilityInfo.isHidden,
          skills: getInitialSkills(speciesId)
        });
        setCatchAttempts(0);
        markSeen(speciesId);
        setInBattle(true);
        setIsActionDisabled(false);
        setBattleLog(isBossEncounter ? `首领 ${SPECIES_INFO[speciesId]?.name} (Lv.${level}) 出现了！` : `野生的 ${SPECIES_INFO[speciesId]?.name} (Lv.${level}) ${isShiny ? '✨' : ''}出现了！`);
        result = { type, message: isBossEncounter ? 'Boss战！' : '进入战斗！', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Sword };
      }

      setEventResult(result);
      setRolling(false);
    }, 600);
  };

  const attack = (skill?: Skill) => {
    if (!wildPkmn || !activePokemon || wildPkmn.hp <= 0 || playerHp <= 0 || isActionDisabled) return;
    
    let pDmg = 0;
    let isCrit = false;
    let wildHp = wildPkmn.hp;
    let myHp = playerHp;

    if (skill) {
      const ok = consumeSkillPp(skill.id, activePokemon.id);
      if (!ok) return;
      const critRate = 1 / 16;
      isCrit = Math.random() < critRate;
      const critMulti = isCrit ? 1.5 : 1;
      const stab = 1.5;
      const typeMulti = 1;

      const baseDmg = Math.floor(
        ((((2 * activePokemon.level) / 5 + 2) * skill.power * ((activePokemon.stats?.atk ?? 10) / (wildPkmn.stats?.def ?? 10))) / 50 + 2) *
          critMulti * stab * typeMulti * (Math.random() * 0.15 + 0.85)
      );

      pDmg = Math.max(1, baseDmg);
    } else {
      pDmg = Math.max(1, Math.floor((activePokemon.stats?.atk ?? 10) * 0.2 + rand(1, 5)));
    }

    setIsActionDisabled(true);

    const playerSpe = activePokemon.stats?.spe ?? 0;
    const wildSpe = wildPkmn.stats?.spe ?? 0;
    const playerGoesFirst = playerSpe >= wildSpe;

    if (playerGoesFirst) {
      executePlayerAttack();
    } else {
      executeWildAttack((afterHp) => {
        if (afterHp > 0) {
          setTimeout(executePlayerAttack, 1000);
        }
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
          return {
            ...prev,
            skills: prev.skills.map((s) => (s.id === chosen.id ? { ...s, pp: Math.max(0, s.pp - 1) } : s)),
          };
        });
      }

      const power = chosen?.power ?? 40;
      const name = chosen?.name ?? '撞击';

      const wIsCrit = Math.random() < 1/16;
      const wDmg = Math.max(
        1,
        Math.floor(
          ((((2 * wildPkmn.level) / 5 + 2) * power * ((wildPkmn.stats?.atk ?? 10) / (activePokemon.stats?.def ?? 10))) / 50 + 2) *
            (wIsCrit ? 1.5 : 1) *
            (Math.random() * 0.15 + 0.85)
        )
      );

      myHp = Math.max(0, myHp - wDmg);
      setPlayerHp(myHp);
      changeStats({ hp: -wDmg }, activePokemon.id);
      setBattleLog(`野生宝可梦使用了 ${name}！造成了 ${wDmg} 伤害${wIsCrit ? '(击中要害)' : ''}。`);

      if (myHp <= 0) {
        setTimeout(handleFaint, 1500);
      } else {
        if (callback) {
          callback(myHp);
        } else {
          setTimeout(() => setIsActionDisabled(false), 1000);
        }
      }
    }

    function handleWin() {
      const expGain = wildPkmn!.level * 10;
      const coinGain = rand(20, 50);
      const evBonus = Math.random() < 0.25;
      if (evBonus) gainRandomEv(activePokemon.id, 1);
      setBattleLog(`击败了野生宝可梦！获得 ${expGain} 经验和 ${coinGain} 金币。${evBonus ? '额外获得随机努力值 +1。' : ''}是否尝试捕捉？`);
      gainExp(expGain, activePokemon.id);
      addCoins(coinGain);
      setTimeout(() => {
        setCapturePhase(true);
        setIsActionDisabled(false);
        setBattleLog('野生宝可梦已虚弱，是捕捉的好机会！');
      }, 1500);
    }

    function handleFaint() {
      setBattleLog(`${activePokemon.name} 倒下了！`);
      
      setTimeout(() => {
        const nextAliveIdx = battlePokemons.findIndex((p, idx) => idx > activeTeamIndex && p.hp > 0);
        if (nextAliveIdx !== -1) {
          setActiveTeamIndex(nextAliveIdx);
          setPlayerHp(battlePokemons[nextAliveIdx].hp);
          setBattleLog(`去吧！${battlePokemons[nextAliveIdx].name}！`);
          setIsActionDisabled(false);
        } else {
          // Check from start
          const anyAliveIdx = battlePokemons.findIndex(p => p.hp > 0);
          if (anyAliveIdx !== -1) {
            setActiveTeamIndex(anyAliveIdx);
            setPlayerHp(battlePokemons[anyAliveIdx].hp);
            setBattleLog(`去吧！${battlePokemons[anyAliveIdx].name}！`);
            setIsActionDisabled(false);
          } else {
            setBattleLog('队伍全军覆没！');
            setTimeout(() => {
              closeBattle();
              setIsActionDisabled(false);
            }, 2000);
          }
        }
      }, 1500);
    }
  };

  const runAway = () => {
    if (!activePokemon || isActionDisabled) return;
    if (wildPkmn?.isBoss) {
      setBattleLog('无法从首领战中逃跑！');
      return;
    }

    setIsActionDisabled(true);

    const playerSpe = activePokemon.stats?.spe ?? 0;
    const wildSpe = wildPkmn?.stats?.spe ?? 0;
    
    // Formula approximation for escape probability
    // F = (Speed_Player * 128) / Speed_Wild + 30
    // Modified here: Base chance 30%, increases up to 100% based on speed ratio
    let escapeChance = 0.3; 
    if (wildSpe > 0) {
      escapeChance = Math.max(0.3, Math.min(1.0, (playerSpe * 128 / wildSpe + 30) / 256));
    } else {
      escapeChance = 1.0;
    }

    if (Math.random() < escapeChance) {
      setBattleLog('逃跑成功！');
      setTimeout(() => {
        closeBattle();
        setIsActionDisabled(false);
      }, 1000);
    } else {
      if (!wildPkmn) {
        setIsActionDisabled(false);
        return;
      }
      const wLevelFactor = (2 * wildPkmn.level) / 5 + 2;
      const wBaseDmg = (wLevelFactor * 40 * ((wildPkmn.stats?.atk ?? 10) / (activePokemon.stats?.def ?? 10))) / 50 + 2;
      const wIsCrit = Math.random() < 1/16;
      const wDmg = Math.max(1, Math.floor(wBaseDmg * (wIsCrit ? 1.5 : 1) * (Math.random() * 0.15 + 0.85)));

      const newPlayerHp = Math.max(0, playerHp - wDmg);
      setPlayerHp(newPlayerHp);
      changeStats({ hp: -wDmg }, activePokemon.id);
      setWildAnim('animate-bounce');
      setTimeout(() => setWildAnim(''), 300);
      setBattleLog(`逃跑失败！野生宝可梦攻击造成了 ${wDmg} 伤害${wIsCrit ? '(击中要害)' : ''}。`);
      
      if (newPlayerHp <= 0) {
          setTimeout(() => {
            const nextAliveIdx = battlePokemons.findIndex((p, idx) => idx > activeTeamIndex && p.hp > 0);
            if (nextAliveIdx !== -1) {
              setActiveTeamIndex(nextAliveIdx);
              setPlayerHp(battlePokemons[nextAliveIdx].hp);
              setBattleLog(`去吧！${battlePokemons[nextAliveIdx].name}！`);
              setIsActionDisabled(false);
            } else {
              const anyAliveIdx = battlePokemons.findIndex(p => p.hp > 0);
              if (anyAliveIdx !== -1) {
                setActiveTeamIndex(anyAliveIdx);
                setPlayerHp(battlePokemons[anyAliveIdx].hp);
                setBattleLog(`去吧！${battlePokemons[anyAliveIdx].name}！`);
                setIsActionDisabled(false);
              } else {
                setBattleLog('队伍全军覆没！');
                setTimeout(() => {
                  closeBattle();
                  setIsActionDisabled(false);
                }, 2000);
              }
            }
          }, 1500);
      } else {
        setTimeout(() => setIsActionDisabled(false), 1000);
      }
    }
  };

  const getCatchProbability = (ballId: ItemId) => {
    if (!wildPkmn) return 0;
    if (ballId === 'masterball') return 100;
    
    // HP factor: lower HP = easier to catch
    const hpFactor = (3 * wildPkmn.maxHp - 2 * wildPkmn.hp) / (3 * wildPkmn.maxHp);
    
    // BST factor: higher BST = harder to catch (base rate decreases)
    const bst = Object.values(wildPkmn.stats).reduce((a, b) => a + b, 0);
    const bstFactor = Math.max(15, 255 - Math.floor(bst / 2.5));
    
    // Level factor: higher wild level = harder
    const levelFactor = Math.max(0.5, 1 - (wildPkmn.level - 1) / 150);
    
    // Player level bonus: higher player level = slightly easier
    const playerLevelBonus = 1 + activePokemon.level * 0.005;
    
    // Shiny factor: much harder to catch
    const shinyFactor = wildPkmn.isShiny ? 0.3 : 1;
    
    // Ball multiplier
    let ballBonus = 1;
    if (ballId === 'greatball') ballBonus = 1.5;
    else if (ballId === 'ultraball') ballBonus = 1.75;
    else if (ballId === 'premium_ball') ballBonus = 1.2;
    else if (ballId === 'dive_ball') ballBonus = 1.5;
    else if (ballId === 'timer_ball') ballBonus = 1.3 + (catchAttempts * 0.1); // 计时球随尝试次数增加
    else if (ballId === 'repeat_ball') {
      ballBonus = 1.5;
      // 重复球对已捕捉过的宝可梦加成更大
      if (pokedex[wildPkmn.speciesId]?.caught) ballBonus = 2.5;
    }
    
    const modifiedCatchRate = (bstFactor * hpFactor * levelFactor * playerLevelBonus * ballBonus * shinyFactor) / 255;
    
    // Convert to % and cap
    const finalProb = Math.min(100, Math.max(1, Math.floor(modifiedCatchRate * 100)));
    return finalProb;
  };

  const getEscapeProbability = () => {
    if (!activePokemon || !wildPkmn) return 0;
    if (wildPkmn.isBoss) return 0;
    // 递增逃跑概率：第一次5%，之后每次+10%
    const attempts = catchAttempts || 0;
    const prob = 5 + attempts * 10;
    return Math.min(100, prob);
  };

  const throwPokeball = (ballId: ItemId) => {
    if (!wildPkmn || !activePokemon || isActionDisabled) return;
    if ((inventory[ballId] || 0) <= 0) {
      setBattleLog(`没有 ${ITEMS[ballId].name} 了！`);
      return;
    }
    
    setIsActionDisabled(true);

    consumeItem(ballId);
    setShowBag(false);
    
    setBallAnim(`animate-[throw_1s_ease-in-out_forwards]`);
    setBattleLog(`你扔出了 ${ITEMS[ballId].name}！`);
    
    setTimeout(() => {
      const finalProb = getCatchProbability(ballId) / 100;
      
      if (Math.random() < finalProb || ballId === 'masterball') {
        setBallAnim('');
        setBattleLog('捕捉成功！');
        
        if (wildPkmn.isBoss) {
          const isFirstDefeat = !defeatedBosses.includes(currentMapId);
          defeatBoss(currentMapId);
          if (isFirstDefeat) {
            const mapInfo = WILD_MAPS[currentMapId];
            if (mapInfo.unlocksMap) {
              unlockMap(mapInfo.unlocksMap);
              setBattleLog(`捕捉成功！首次击败首领，解锁新区域：${WILD_MAPS[mapInfo.unlocksMap].name}！额外获得 500 金币奖励！`);
              addCoins(500);
            } else {
              setBattleLog(`捕捉成功！首次击败首领！额外获得 500 金币奖励！`);
              addCoins(500);
            }
          } else {
            setBattleLog('捕捉成功！再次击败首领。');
          }
        }
        
        const nature = generateRandomNature();
        const ivs = wildPkmn.isShiny ? { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } : generateRandomIvs();
        const evs = emptyEvs();
        const baseStats = getBaseStats(wildPkmn.speciesId);
        const finalStats = calculateStats(baseStats, ivs, evs, nature, wildPkmn.level, wildPkmn.isShiny);

        const newPokemon = {
          id: Date.now().toString(),
          speciesId: wildPkmn.speciesId,
          name: SPECIES_INFO[wildPkmn.speciesId]?.name || `野生宝可梦`,
          level: wildPkmn.level,
          exp: 0,
          hunger: 80,
          happiness: 80,
          hp: finalStats.hp,
          maxHp: finalStats.hp,
          nature,
          ivs,
          evs,
          ability: wildPkmn.ability || generateAbility(wildPkmn.speciesId).ability,
          isHiddenAbility: wildPkmn.isHiddenAbility || false,
          baseStats,
          stats: finalStats,
          skills: getInitialSkills(wildPkmn.speciesId),
          lastInteraction: Date.now(),
          isShiny: wildPkmn.isShiny,
        };
        catchPokemon(newPokemon);
        setTimeout(() => {
          setCaughtPokemonInfo(newPokemon as Pokemon);
          setIsActionDisabled(false);
        }, 1500);
      } else {
        setBallAnim('');
        const newAttempts = catchAttempts + 1;
        setCatchAttempts(newAttempts);
        // 检查逃跑概率
        const escapeProb = (5 + (newAttempts - 1) * 10) / 100;
        if (Math.random() < escapeProb && !wildPkmn.isBoss) {
          setBattleLog(`捕捉失败！野生宝可梦趁机逃跑了！`);
          setTimeout(() => {
            closeBattle();
            setIsActionDisabled(false);
          }, 2000);
        } else {
          const wLevelFactor = (2 * wildPkmn.level) / 5 + 2;
          const wBaseDmg = (wLevelFactor * 40 * ((wildPkmn.stats?.atk ?? 10) / (activePokemon.stats?.def ?? 10))) / 50 + 2;
          const wIsCrit = Math.random() < 1/16;
          const wDmg = Math.max(1, Math.floor(wBaseDmg * (wIsCrit ? 1.5 : 1) * (Math.random() * 0.15 + 0.85)));

          const newPlayerHp = Math.max(0, playerHp - wDmg);
          setPlayerHp(newPlayerHp);
          changeStats({ hp: -wDmg }, activePokemon.id);
          setWildAnim('animate-bounce');
          setTimeout(() => setWildAnim(''), 300);
          setBattleLog(`捕捉失败！野生宝可梦挣脱并攻击，造成 ${wDmg} 伤害。`);
          
        if (newPlayerHp <= 0) {
          setTimeout(() => {
            const nextAliveIdx = battlePokemons.findIndex((p, idx) => idx > activeTeamIndex && p.hp > 0);
            if (nextAliveIdx !== -1) {
              setActiveTeamIndex(nextAliveIdx);
              setPlayerHp(battlePokemons[nextAliveIdx].hp);
              setBattleLog(`去吧！${battlePokemons[nextAliveIdx].name}！`);
              setIsActionDisabled(false);
            } else {
              const anyAliveIdx = battlePokemons.findIndex(p => p.hp > 0);
              if (anyAliveIdx !== -1) {
                setActiveTeamIndex(anyAliveIdx);
                setPlayerHp(battlePokemons[anyAliveIdx].hp);
                setBattleLog(`去吧！${battlePokemons[anyAliveIdx].name}！`);
                setIsActionDisabled(false);
              } else {
                setBattleLog('队伍全军覆没！');
                setTimeout(() => {
                  closeBattle();
                  setIsActionDisabled(false);
                }, 2000);
              }
            }
          }, 1500);
        } else {
          setTimeout(() => setIsActionDisabled(false), 1000);
        }
        }
      }
    }, 1000);
  };

  if (!activePokemon) return null;

  return (
    <div className={`h-full w-full ${WILD_MAPS[currentMapId]?.background || 'bg-gradient-to-b from-emerald-50 via-white to-white'} relative overflow-hidden flex flex-col`}>
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/60 blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-white/40 blur-3xl" />
      </div>

      <PageHeader
        title="野外探索"
        onBack={() => navigate('/map')}
        right={
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/80 border border-emerald-200">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-black text-slate-800">{coins}</span>
          </div>
        }
      />

      {!inBattle ? (
        <div className="relative px-6 py-6 flex flex-col gap-5 flex-1 overflow-y-auto">
          <button 
            onClick={() => setShowMapSelect(true)}
            className="bg-white/80 rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between"
          >
            <div className="text-left">
              <div className="text-xs font-bold text-slate-500 mb-1">当前地区</div>
              <div className="text-lg font-black text-slate-800">{WILD_MAPS[currentMapId]?.name || '未知区域'}</div>
            </div>
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500">更换地图</div>
          </button>

          <div className="rounded-3xl border border-emerald-200 bg-white/80 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 border border-emerald-100 flex items-center justify-center overflow-hidden">
                <PokemonImage speciesId={activePokemon.speciesId} isShiny={activePokemon.isShiny} alt={activePokemon.name} className="w-14 h-14 object-contain drop-shadow-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-bold text-emerald-700">首位状态</div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={handleRestoreHunger}
                      className="flex flex-col items-center justify-center shrink-0 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-xl px-2.5 py-1.5 transition-colors"
                    >
                      <Utensils className="w-4 h-4 mb-0.5" />
                      <span className="text-[9px] font-bold whitespace-nowrap">恢复饱食度</span>
                      <span className="text-[8px] font-bold opacity-80">{battleTeam.length * 50} 金币</span>
                    </button>
                    <button 
                      onClick={handleRestoreHappiness}
                      className="flex flex-col items-center justify-center shrink-0 bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 rounded-xl px-2.5 py-1.5 transition-colors"
                    >
                      <Smile className="w-4 h-4 mb-0.5" />
                      <span className="text-[9px] font-bold whitespace-nowrap">恢复心情</span>
                      <span className="text-[8px] font-bold opacity-80">{battleTeam.length * 50} 金币</span>
                    </button>
                    <button 
                      onClick={handleHeal}
                      className="flex flex-col items-center justify-center shrink-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl px-2.5 py-1.5 transition-colors"
                    >
                      <HeartPulse className="w-4 h-4 mb-0.5" />
                      <span className="text-[9px] font-bold whitespace-nowrap">全队恢复</span>
                      <span className="text-[8px] font-bold opacity-80">{battleTeam.length * 30} 金币</span>
                    </button>
                  </div>
                </div>
                <div className="text-lg font-black text-slate-900">{activePokemon.name}
                {isPerfectIv(activePokemon.ivs) && <span className="text-xs font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 ml-1">6V</span>}
                {' '}HP: {Math.floor(playerHp)}/{activePokemon.maxHp}</div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-1">
                  <motion.div 
                    className={`h-full ${playerHp / activePokemon.maxHp < 0.3 ? 'bg-red-500' : 'bg-emerald-400'}`}
                    animate={{ width: `${(playerHp / activePokemon.maxHp) * 100}%` }}
                  />
                </div>
                <div className="mt-2 space-y-1">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                      <span>饱食度</span>
                      <span>{Math.floor(activePokemon.hunger)}/{MAX_HUNGER}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-orange-400" animate={{ width: `${(activePokemon.hunger / MAX_HUNGER) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                      <span>心情</span>
                      <span>{Math.floor(activePokemon.happiness)}/{MAX_HAPPINESS}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-pink-400" animate={{ width: `${(activePokemon.happiness / MAX_HAPPINESS) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-500 mt-1.5">{WILD_MAPS[currentMapId]?.description || '在野外探索可能遭遇野生宝可梦或发现宝物。'}</div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => explore(false)}
            disabled={rolling || playerHp <= 0 || activePokemon.hunger < 5 || activePokemon.happiness < 3}
            className={[
              'w-full rounded-3xl px-5 py-6 shadow-lg shadow-emerald-200 border',
              'bg-emerald-500 text-white font-black text-xl flex items-center justify-center gap-3',
              'disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed',
            ].join(' ')}
          >
            <Trees className="w-6 h-6" />
            {rolling ? '探索中...' : activePokemon.hunger < 5 || activePokemon.happiness < 3 ? '状态不足' : playerHp <= 0 ? '需要休息' : '探索四周'}
          </motion.button>

          <AnimatePresence mode="wait">
            {eventResult && (
              <motion.div
                key={eventResult.message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`rounded-3xl border shadow-sm p-5 flex items-start gap-4 ${eventResult.color}`}
              >
                <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center shrink-0">
                  <eventResult.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg font-black">{eventResult.message}</div>
                  {eventResult.subMessage && <div className="text-sm font-semibold opacity-80 mt-1">{eventResult.subMessage}</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {(() => {
            const mapInfo = WILD_MAPS[currentMapId];
            if (!mapInfo || !mapInfo.bossId) return null;
            const allCaught = mapInfo.wildPool.every(id => pokedex[id]?.caught);
            const isBossDefeated = defeatedBosses.includes(currentMapId);
            
            if (allCaught) {
              return (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => explore(true)}
                  disabled={rolling || playerHp <= 0 || activePokemon.hunger < 5 || activePokemon.happiness < 3}
                  className="w-full mt-4 bg-purple-600 text-white font-black text-lg rounded-3xl px-5 py-5 shadow-lg shadow-purple-200 border border-purple-500 disabled:opacity-50"
                >
                  {isBossDefeated ? '重新挑战地区首领！' : '挑战地区首领！'}
                </motion.button>
              );
            } else {
              return (
                <div className="text-center text-xs font-bold text-slate-400 mt-4">
                捕捉该地区所有种类宝可梦以解锁首领挑战
                <div className="flex justify-center gap-2 mt-3 flex-wrap">
                  {mapInfo.wildPool.map(id => (
                    <div key={id} className={`flex flex-col items-center gap-1 w-16 h-20 rounded-xl bg-white border ${pokedex[id]?.caught ? 'border-emerald-300 shadow-sm' : 'border-slate-200 opacity-50 grayscale'} p-1`}>
                      <div className="flex-1 flex items-center justify-center relative w-full">
                        <PokemonImage speciesId={id} alt="poke" className="w-10 h-10 object-contain" />
                      </div>
                      <div className="text-[9px] font-black text-slate-600 truncate w-full text-center leading-none">{SPECIES_INFO[id]?.name}</div>
                      <div className="text-[8px] font-bold text-slate-400 leading-none">Lv.{mapInfo.levelRange[0]}~{mapInfo.levelRange[1]}</div>
                    </div>
                  ))}
                </div>
              </div>
              );
            }
          })()}
        </div>
      ) : (
        /* Battle UI */
        <div className="relative flex-1 flex flex-col z-10 overflow-hidden">
          {/* Battle background - darker version of map background */}
          <div className={`absolute inset-0 pointer-events-none ${
            currentMapId === 'map1' ? 'bg-gradient-to-b from-green-200/40 via-emerald-100/30 to-green-50/20' :
            currentMapId === 'map2' ? 'bg-gradient-to-b from-slate-300/40 via-slate-200/30 to-slate-100/20' :
            currentMapId === 'map3' ? 'bg-gradient-to-b from-orange-200/40 via-amber-100/30 to-orange-50/20' :
            'bg-gradient-to-b from-emerald-100/30 via-white/20 to-white/10'
          }`} />
          <div className="flex-1 px-6 pt-3 pb-44 flex flex-col gap-4 overflow-y-auto no-scrollbar relative">
            {wildPkmn && (
              <div className="flex justify-end w-full relative">
                <div className="flex flex-col items-end">
                  <div className="bg-white/80 rounded-lg px-2.5 py-1 shadow-sm border border-slate-200 mb-1 w-40 relative cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                    onClick={() => setShowWildDetail(!showWildDetail)}
                  >
                    {pokedex[wildPkmn.speciesId]?.caught ? (
                      <div className="absolute -top-1.5 -left-1.5 bg-emerald-100 text-emerald-600 rounded-full p-0.5 shadow border border-emerald-200" title="已捕捉">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative overflow-hidden">
                           <div className="absolute top-1/2 left-0 right-0 h-px bg-white/80"></div>
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow border border-red-200" title="未捕捉"></div>
                    )}
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`text-xs font-bold flex items-center gap-0.5 ${wildPkmn.isBoss ? 'text-purple-700' : 'text-slate-800'}`}>
                        {wildPkmn.isBoss && '👑 '}
                        {SPECIES_INFO[wildPkmn.speciesId]?.name || '野生宝可梦'}
                        {wildPkmn.isShiny && <span className="text-amber-500 text-[10px]">✨</span>}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">Lv.{wildPkmn.level}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <TypeBadges speciesId={wildPkmn.speciesId} size="xs" className="flex-1" />
                      {wildPkmn.ability && (
                        <div className="relative group cursor-help shrink-0">
                          <span className="text-[9px] font-black px-1 py-0.5 rounded shadow-sm border bg-indigo-100 text-indigo-700 border-indigo-200">
                            {wildPkmn.ability}
                          </span>
                          <div className="hidden group-hover:block absolute top-full right-0 mt-1 w-44 bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl whitespace-normal z-[80] pointer-events-none">
                            {ABILITY_INFO[wildPkmn.ability] || '暂无说明'}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-emerald-500" 
                        animate={{ width: `${(wildPkmn.hp / wildPkmn.maxHp) * 100}%` }} 
                      />
                    </div>
                    <div className="text-right text-[9px] font-bold text-slate-400 mt-0.5">
                      {Math.max(0, Math.floor(wildPkmn.hp))}/{wildPkmn.maxHp}
                    </div>
                  </div>
                  <div className={wildAnim}>
                    <PokemonImage speciesId={wildPkmn.speciesId} alt="wild" isShiny={!!wildPkmn.isShiny} className={`w-28 h-28 object-contain ${wildPkmn.isBoss ? 'scale-110' : ''}`} />
                  </div>
                </div>
                
                {ballAnim && (
                  <div className={`absolute bottom-0 right-16 w-8 h-8 z-50 ${ballAnim}`}>
                    <div className="w-full h-full rounded-full bg-red-500 border-2 border-slate-800 relative overflow-hidden">
                       <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white"></div>
                       <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800"></div>
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-slate-800 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-start w-full -mt-1">
              <div className="flex flex-col items-start">
                <div className="bg-white/80 rounded-lg px-2.5 py-1 shadow-sm border border-slate-200 mt-1 w-40 relative">
                    <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-0.5">
                      {activePokemon.name}
                      {activePokemon.isShiny && <span className="text-amber-500 text-[10px]">✨</span>}
                      {isPerfectIv(activePokemon.ivs) && <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-1 py-px rounded border border-amber-200">6V</span>}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">Lv.{activePokemon.level}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <TypeBadges speciesId={activePokemon.speciesId} size="xs" className="flex-1" />
                    {activePokemon.ability && (
                      <div className="relative group cursor-help shrink-0">
                        <span className="text-[9px] font-black px-1 py-0.5 rounded shadow-sm border bg-indigo-100 text-indigo-700 border-indigo-200">
                          {activePokemon.ability}
                        </span>
                        <div className="hidden group-hover:block absolute top-full right-0 mt-1 w-44 bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl whitespace-normal z-[80] pointer-events-none">
                          {ABILITY_INFO[activePokemon.ability] || '暂无说明'}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-500" 
                      animate={{ width: `${(playerHp / activePokemon.maxHp) * 100}%` }} 
                    />
                  </div>
                  <div className="text-right text-[9px] font-bold text-slate-400 mt-0.5">
                    {Math.max(0, Math.floor(playerHp))}/{activePokemon.maxHp}
                  </div>
                </div>
                <div className={playerAnim}>
                  <PokemonImage speciesId={activePokemon.speciesId} alt="player" isShiny={activePokemon.isShiny} className="w-28 h-28 object-contain scale-x-[-1]" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-t-3xl shadow-2xl text-white shrink-0 flex flex-col" style={{ maxHeight: '55vh' }}>
            {/* Scrollable area: detail panel + battle log */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 pb-0 min-h-0">
            {/* Wild Pokemon Detail Panel */}
            <AnimatePresence>
              {showWildDetail && wildPkmn && (() => {
                const wildTypes = getPokemonTypes(wildPkmn.speciesId);
                const defChart = getDefensiveTypeChart(wildTypes);
                const playerTypes = getPokemonTypes(activePokemon.speciesId);
                return (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                      <div className="flex items-center gap-3 mb-3">
                        <PokemonImage speciesId={wildPkmn.speciesId} alt="wild" isShiny={!!wildPkmn.isShiny} className="w-12 h-12 object-contain" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm">
                              {wildPkmn.isBoss && '👑 '}{SPECIES_INFO[wildPkmn.speciesId]?.name}
                              {wildPkmn.isShiny && <span className="text-amber-400 ml-1">✨</span>}
                            </span>
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
            {/* Fixed button area - always visible and clickable */}
            <div className="shrink-0 p-5 pt-3">
            {capturePhase ? (
              <div className="space-y-2">
                <div className="text-[11px] font-black text-slate-300 flex items-center justify-between">
                  <span>逃跑概率 (第{catchAttempts + 1}次)</span>
                  <span className="text-white">{5 + catchAttempts * 10}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                <button onClick={() => throwPokeball('pokeball')} disabled={isActionDisabled} className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 px-2 rounded-xl flex flex-col items-center justify-center transition-colors text-sm min-h-[56px]">
                  <div className="flex items-center gap-2"><ItemImage itemId="pokeball" className="w-5 h-5" /> <span>精灵球 ({inventory['pokeball'] || 0})</span></div>
                  <span className="text-[10px] font-semibold opacity-80 mt-0.5">捕捉率: {getCatchProbability('pokeball')}%</span>
                </button>
                <button onClick={() => throwPokeball('greatball')} disabled={isActionDisabled} className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-2 rounded-xl flex flex-col items-center justify-center transition-colors text-sm min-h-[56px]">
                  <div className="flex items-center gap-2"><ItemImage itemId="greatball" className="w-5 h-5" /> <span>超级球 ({inventory['greatball'] || 0})</span></div>
                  <span className="text-[10px] font-semibold opacity-80 mt-0.5">捕捉率: {getCatchProbability('greatball')}%</span>
                </button>
                <button onClick={() => throwPokeball('ultraball')} disabled={isActionDisabled} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 px-2 rounded-xl flex flex-col items-center justify-center transition-colors text-sm min-h-[56px]">
                  <div className="flex items-center gap-2"><ItemImage itemId="ultraball" className="w-5 h-5" /> <span>高级球 ({inventory['ultraball'] || 0})</span></div>
                  <span className="text-[10px] font-semibold opacity-80 mt-0.5">捕捉率: {getCatchProbability('ultraball')}%</span>
                </button>
                <button onClick={() => throwPokeball('masterball')} disabled={isActionDisabled} className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold py-3 px-2 rounded-xl flex flex-col items-center justify-center transition-colors text-sm min-h-[56px]">
                  <div className="flex items-center gap-2"><ItemImage itemId="masterball" className="w-5 h-5" /> <span>大师球 ({inventory['masterball'] || 0})</span></div>
                  <span className="text-[10px] font-semibold opacity-80 mt-0.5">捕捉率: 100%</span>
                </button>
                <button onClick={() => { setCapturePhase(false); closeBattle(); }} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors col-span-2 mt-1 cursor-pointer">
                  放弃捕捉
                </button>
                </div>
              </div>
            ) : !showBag ? (
              <div className="space-y-2">
                {/* 技能切换悬浮框 */}
                <AnimatePresence>
                  {skillSwapSlot !== null && activePokemon && (() => {
                    const allLearned = getAllLearnedSkills(activePokemon.speciesId, activePokemon.level, activePokemon.skills);
                    const unequipped = allLearned.filter(s => !activePokemon.skills.find(e => e.id === s.id));
                    return (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-800 rounded-xl p-3 border border-slate-700 overflow-hidden"
                      >
                        <div className="text-[10px] font-bold text-slate-300 mb-2">
                          选择替换「{activePokemon.skills[skillSwapSlot]?.name}」的技能
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                          {unequipped.map(s => (
                            <button
                              key={s.id}
                              onClick={() => {
                                if (!activePokemon) return;
                                const newSkills = [...activePokemon.skills];
                                newSkills[skillSwapSlot] = { ...s, pp: s.maxPp };
                                setSkills(activePokemon.id, newSkills);
                                setSkillSwapSlot(null);
                              }}
                              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-[10px] font-bold text-white transition-colors flex items-center gap-1"
                            >
                              <span>{s.name}</span>
                              <span className="opacity-60">{s.type}</span>
                              <span className="text-amber-400 opacity-70">威力{s.power || '—'}</span>
                            </button>
                          ))}
                          {unequipped.length === 0 && (
                            <span className="text-[10px] text-slate-500">暂无其他已学会的技能</span>
                          )}
                        </div>
                        <button
                          onClick={() => setSkillSwapSlot(null)}
                          className="mt-2 text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                        >
                          取消
                        </button>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
                <div className="grid grid-cols-2 gap-2">
                {activePokemon.skills.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={(e) => {
                      if (e.shiftKey || e.ctrlKey || e.metaKey) {
                        // Shift+Click 打开技能切换
                        setSkillSwapSlot(skillSwapSlot === idx ? null : idx);
                        return;
                      }
                      attack(s);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSkillSwapSlot(skillSwapSlot === idx ? null : idx);
                    }}
                    disabled={s.pp <= 0 || playerHp <= 0 || isActionDisabled}
                    className={`bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-900 border font-bold py-2 rounded-xl flex flex-col items-center justify-center transition-colors relative ${skillSwapSlot === idx ? 'border-blue-400 ring-2 ring-blue-200' : 'border-red-200'}`}
                    title="右键或Shift+点击切换技能"
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] opacity-70">PP {s.pp}/{s.maxPp} | {s.type} | 威力 {s.power}</span>
                    {skillSwapSlot === idx && (
                      <div className="absolute top-0.5 right-1 text-[8px] font-black text-blue-600 bg-blue-100 px-1 py-0.5 rounded">切换中</div>
                    )}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-800 text-white text-xs font-normal p-2 rounded shadow-xl whitespace-normal z-50 pointer-events-none">
                      <div className="font-bold mb-0.5">{s.name} ({s.type}属性)</div>
                      <div>威力: {s.power || '变化技能'} | PP: {s.pp}/{s.maxPp}</div>
                      <div className="mt-1 opacity-80">{s.description || '暂无说明'}</div>
                      <div className="mt-1 text-[10px] text-blue-300">右键或Shift+点击可切换技能</div>
                    </div>
                  </button>
                ))}
                
                {/* 填补空位，确保技能不足4个时下方按钮不乱跳 */}
                {Array.from({ length: Math.max(0, 4 - activePokemon.skills.length) }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="bg-slate-100/50 border border-slate-200/50 rounded-xl" />
                ))}

                <button onClick={() => setShowTeamSelect(true)} disabled={isActionDisabled} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors mt-1">
                  换宠
                </button>
                <button onClick={runAway} disabled={isActionDisabled} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors mt-1">
                  <Hand className="w-5 h-5" /> 逃跑
                </button>
                </div>
              </div>
            ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Caught Modal */}
      <AnimatePresence>
        {caughtPokemonInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl flex flex-col items-center relative overflow-hidden max-h-[85vh]"
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-emerald-100 rounded-t-[2rem] -z-10" />
              <h3 className="font-black text-2xl text-emerald-800 mb-4 z-10">捕捉成功！</h3>
              
              <PokemonImage speciesId={caughtPokemonInfo.speciesId} alt="caught" isShiny={caughtPokemonInfo.isShiny} className="w-24 h-24 object-contain drop-shadow-lg z-10 mb-3" />
              
              <div className="w-full bg-slate-50 rounded-xl p-4 space-y-2 mb-4 border border-slate-100 max-h-[40vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-sm">种类</span>
                  <span className="text-slate-800 font-black">{caughtPokemonInfo.name} {caughtPokemonInfo.isShiny && <span className="text-amber-500">✨</span>}{caughtPokemonInfo.ivs && isPerfectIv(caughtPokemonInfo.ivs) && <span className="text-xs font-black text-amber-600 bg-amber-100 px-1 py-px rounded border border-amber-200 ml-1">6V</span>}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-sm">属性</span>
                  <TypeBadges speciesId={caughtPokemonInfo.speciesId} size="xs" className="justify-end" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-sm">等级</span>
                  <span className="text-slate-800 font-black">Lv.{caughtPokemonInfo.level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-sm">性格</span>
                  <span className="text-emerald-600 font-black">{getNatureText(caughtPokemonInfo.nature)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-sm">特性</span>
                  <div className="flex items-center gap-1">
                    <span className="text-indigo-600 font-black text-sm">{caughtPokemonInfo.ability}</span>
                    {caughtPokemonInfo.isHiddenAbility && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1 py-0.5 rounded border border-amber-200">隐藏</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-slate-500 font-bold text-sm">技能</span>
                  <div className="grid grid-cols-2 gap-1">
                    {caughtPokemonInfo.skills.map((s) => (
                      <div key={s.id} className="bg-white rounded-lg px-2 py-1.5 border border-slate-200 flex flex-col">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-black text-slate-800">{s.name}</span>
                          <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1 rounded">{s.type}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[8px] font-bold text-slate-500">威力 {s.power}</span>
                          <span className="text-[8px] font-bold text-slate-500">PP {s.pp}/{s.maxPp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-slate-500 font-bold text-sm">个体值 (IVs)</span>
                  <div className="grid grid-cols-3 gap-1">
                    {Object.entries(caughtPokemonInfo.ivs).map(([stat, val]) => (
                      <div key={stat} className="bg-white rounded p-1 flex justify-between border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{stat}</span>
                        <span className={`text-[10px] font-black ${val === 31 ? 'text-amber-500' : 'text-slate-700'}`}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-slate-500 font-bold text-sm">种族值</span>
                  <div className="bg-white rounded p-2 border border-slate-200">
                    <BaseStatsChart baseStats={caughtPokemonInfo.baseStats || getBaseStats(caughtPokemonInfo.speciesId)} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={closeBattle}
                  className="flex-1 py-4 bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors"
                >
                  收下并返回
                </button>
                <button 
                  onClick={() => setShowReleaseConfirm(true)}
                  className="px-6 py-4 bg-red-50 text-red-600 font-black rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
                >
                  放生
                </button>
              </div>

              <AnimatePresence>
                {showReleaseConfirm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 rounded-[2rem]"
                  >
                    <h4 className="text-xl font-black text-slate-800 mb-2">确认放生？</h4>
                    <p className="text-sm font-bold text-slate-500 mb-6 text-center">放生后将获得 500 金币补偿。<br/>(此操作不可撤销)</p>
                    <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => setShowReleaseConfirm(false)}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        取消
                      </button>
                      <button 
                        onClick={() => {
                          if (party.length + box.length <= 1) {
                            setToast('这是你最后一只宝可梦，无法放生！');
                            setShowReleaseConfirm(false);
                            return;
                          }
                          releasePokemon(caughtPokemonInfo.id);
                          setCaughtPokemonInfo(null);
                          setShowReleaseConfirm(false);
                          setInBattle(false);
                        }}
                        className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"
                      >
                        确认放生
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Select Modal */}
      <AnimatePresence>
        {showTeamSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 z-50 flex items-end sm:items-center justify-center sm:p-6"
            onClick={() => setShowTeamSelect(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full max-w-md shadow-2xl relative max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-xl text-slate-800">替换出战宝可梦</h3>
                <button onClick={() => setShowTeamSelect(false)} className="text-slate-400 font-bold">取消</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-2">
                {battleTeam.map((id, index) => {
                  const p = party.find(x => x.id === id) || box.find(x => x.id === id);
                  if (!p) return null;
                  const isCurrent = index === activeTeamIndex;
                  const isFainted = p.hp <= 0;
                  
                  return (
                    <button
                      key={id}
                      disabled={isCurrent || isFainted}
                      onClick={() => switchPokemon(index)}
                      className={`w-full flex items-center gap-4 p-3 rounded-2xl border-2 text-left transition-all ${
                        isCurrent ? 'border-emerald-500 bg-emerald-50 opacity-50' : 
                        isFainted ? 'border-slate-200 bg-slate-50 opacity-50' : 
                        'border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <div className={`w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center ${isFainted ? 'grayscale' : ''}`}>
                        <PokemonImage speciesId={p.speciesId} alt={p.name} isShiny={p.isShiny} className="w-10 h-10 object-contain" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-800">{p.name}{isPerfectIv(p.ivs) && <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-1 py-px rounded border border-amber-200 ml-0.5">6V</span>}</span>
                          <span className="text-[10px] font-black text-slate-400">Lv.{p.level}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${isFainted ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${(p.hp / p.maxHp) * 100}%` }} />
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 mt-1">
                          HP {Math.max(0, Math.floor(p.hp))}/{p.maxHp}
                        </div>
                      </div>
                      {isCurrent && <div className="text-xs font-bold text-emerald-600">战斗中</div>}
                      {isFainted && <div className="text-xs font-bold text-red-500">濒死</div>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Selection Modal */}
      <AnimatePresence>
        {showMapSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-6"
            onClick={() => setShowMapSelect(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative"
            >
              <button 
                onClick={() => setShowMapSelect(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
              
              <h3 className="font-black text-xl text-slate-800 mb-4">选择地区</h3>
              
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {Object.values(WILD_MAPS).map((map) => {
                  const isUnlocked = unlockedMaps.includes(map.id);
                  const isCurrent = currentMapId === map.id;
                  const allCaught = map.wildPool.every(id => pokedex[id]?.caught);
                  const isBossDefeated = defeatedBosses.includes(map.id);
                  
                  return (
                    <button
                      key={map.id}
                      disabled={!isUnlocked}
                      onClick={() => {
                        setCurrentMap(map.id);
                        setShowMapSelect(false);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border ${isCurrent ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : isUnlocked ? 'border-slate-200 bg-white hover:bg-slate-50' : 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'} transition-all relative overflow-hidden`}
                    >
                      <div className="flex justify-between items-center mb-1 relative z-10">
                        <span className={`font-black ${isCurrent ? 'text-emerald-700' : 'text-slate-800'}`}>{map.name}</span>
                        <div className="flex items-center gap-1">
                          {isBossDefeated && <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">🏆 已通关</span>}
                          {allCaught && !isBossDefeated && <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">👑 首领出现</span>}
                          {!isUnlocked && <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">🔒 未解锁</span>}
                          {isCurrent && <span className="text-[10px] font-bold bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded">📍 当前位置</span>}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-500 relative z-10 mb-2">{map.description}</div>
                      <div className="flex items-center gap-2 relative z-10 mb-2">
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Lv.{map.levelRange[0]}~{map.levelRange[1]}</span>
                      </div>
                      <div className="flex gap-1 flex-wrap relative z-10">
                        {map.wildPool.map(id => (
                          <div key={id} className={`w-6 h-6 rounded bg-white/80 border ${pokedex[id]?.caught ? 'border-emerald-300' : 'border-slate-200 opacity-50'} flex items-center justify-center`} title={SPECIES_INFO[id]?.name}>
                            <PokemonImage speciesId={id} alt="poke" className="w-5 h-5 object-contain" />
                          </div>
                        ))}
                        {map.bossId && (
                          <div className={`w-6 h-6 rounded bg-purple-50/80 border ${isBossDefeated ? 'border-purple-300' : 'border-purple-200 opacity-50'} flex items-center justify-center ml-1`} title={`首领: ${SPECIES_INFO[map.bossId]?.name}`}>
                            <PokemonImage speciesId={map.bossId} alt="boss" className="w-5 h-5 object-contain" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
