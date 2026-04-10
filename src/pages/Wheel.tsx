import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleDollarSign, FerrisWheel, Gift, Star, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import PageHeader from '@/components/PageHeader';
import { ItemId, ITEMS, SPECIES_INFO, generateRandomIvs, generateRandomNature, getBaseStats, calculateStats, generateAbility, getInitialSkills, emptyEvs, Pokemon } from '@/types';

type Prize =
  | { type: 'coins'; amount: number; label: string }
  | { type: 'exp'; amount: number; label: string }
  | { type: 'item'; itemId: ItemId; amount: number; label: string }
  | { type: 'pokemon'; label: string }; // 闪光6V宝可梦

const COOLDOWN_MS = 6 * 60 * 60 * 1000;
const pad2 = (n: number) => String(n).padStart(2, '0');

const formatRemaining = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
};

export default function Wheel() {
  const navigate = useNavigate();
  const { party, coins, lastSpinAt, setLastSpinAt, addCoins, gainExp, addItem, catchPokemon } = useGameStore();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (party.length === 0) navigate('/', { replace: true });
  }, [party, navigate]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  // 10个奖品扇区，概率加权：8个普通(各9%) + 1个稀有(14%) + 1个传说(18%)
  // 但用等概率抽取再映射的方式，让传说1%=1/100，稀有4%=4/100，普通95%
  const prizes: Prize[] = useMemo(
    () => [
      { type: 'coins', amount: 100, label: '100金币' },
      { type: 'item', itemId: 'rare_candy', amount: 3, label: '稀有糖果×3' },
      { type: 'coins', amount: 500, label: '500金币' },
      { type: 'exp', amount: 500, label: '500经验' },
      { type: 'coins', amount: 1000, label: '1000金币' },
      { type: 'item', itemId: 'potion', amount: 10, label: '伤药×10' },
      { type: 'coins', amount: 200, label: '200金币' },
      { type: 'exp', amount: 1000, label: '1000经验' },
      { type: 'coins', amount: 2000, label: '2000金币' },
      { type: 'item', itemId: 'candy', amount: 20, label: '糖果×20' },
    ],
    []
  );

  const remaining = lastSpinAt ? lastSpinAt + COOLDOWN_MS - now : 0;
  const canSpin = !lastSpinAt || remaining <= 0;

  const spin = () => {
    if (party.length === 0 || spinning || !canSpin) return;
    setSpinning(true);
    setResult(null);
    setShowResult(false);

    const segments = prizes.length;
    const segAngle = 360 / segments;

    // 加权随机：1%闪光宝可梦，其余等概率分配到扇区
    let prizeIndex: number;
    let finalPrize: Prize;
    const roll = Math.random() * 100;

    if (roll < 1) {
      // 1% - 闪光6V宝可梦！
      const speciesIds = Object.keys(SPECIES_INFO).map(Number);
      // 排除鲤鱼王(129)
      const filtered = speciesIds.filter(id => id !== 129);
      const speciesId = filtered[Math.floor(Math.random() * filtered.length)];
      const pokemon = createShiny6VPokemon(speciesId);
      catchPokemon(pokemon);
      finalPrize = { type: 'pokemon', label: `✨ 闪光${SPECIES_INFO[speciesId].name} 6V` };
      // 随机指向一个扇区
      prizeIndex = Math.floor(Math.random() * segments);
    } else {
      // 99% - 普通奖品
      prizeIndex = Math.floor(Math.random() * segments);
      finalPrize = prizes[prizeIndex];
      // 延迟发放
      setTimeout(() => {
        if (finalPrize.type === 'coins') addCoins((finalPrize as { type: 'coins'; amount: number }).amount);
        if (finalPrize.type === 'exp') gainExp((finalPrize as { type: 'exp'; amount: number }).amount);
        if (finalPrize.type === 'item') addItem((finalPrize as { type: 'item'; itemId: ItemId; amount: number }).itemId, (finalPrize as { type: 'item'; itemId: ItemId; amount: number }).amount);
      }, 2200);
    }

    const base = 360 * 5;
    const stopAt = 360 - (prizeIndex * segAngle + segAngle / 2);
    const target = base + stopAt;
    setRotation(target);

    window.setTimeout(() => {
      setLastSpinAt(Date.now());
      setResult(finalPrize);
      setShowResult(true);
      setSpinning(false);
    }, 2200);
  };

  if (party.length === 0) return null;

  // 扇区颜色
  const segColors = [
    ['#fb7185', '#fda4af'], // pink
    ['#fbbf24', '#fde68a'], // amber
    ['#34d399', '#a7f3d0'], // green
    ['#60a5fa', '#93c5fd'], // blue
    ['#c084fc', '#e9d5ff'], // purple
    ['#fb7185', '#fda4af'], // pink
    ['#fbbf24', '#fde68a'], // amber
    ['#34d399', '#a7f3d0'], // green
    ['#60a5fa', '#93c5fd'], // blue
    ['#f97316', '#fdba74'], // orange - 传说位
  ];

  return (
    <div className="h-full w-full bg-gradient-to-b from-pink-50 via-white to-white relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-pink-200 blur-3xl" />
        <div className="absolute top-52 -right-24 w-80 h-80 rounded-full bg-rose-200 blur-3xl" />
      </div>

      <PageHeader
        title="幸运转盘"
        onBack={() => navigate('/map')}
        right={
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/80 border border-pink-200">
            <CircleDollarSign className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-black text-slate-900">{coins}</span>
          </div>
        }
      />

      <div className="relative px-6 py-6 flex flex-col items-center gap-5 flex-1 overflow-y-auto">
        <div className="w-full rounded-3xl border border-pink-200 bg-white/80 shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-pink-700">规则</div>
            <div className="text-base font-black text-slate-900 mt-0.5">每 6 小时转一次</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              {canSpin ? '现在就能转！' : `剩余：${formatRemaining(remaining)}`}
            </div>
          </div>
          <div className="w-12 h-12 rounded-3xl bg-pink-50 border border-pink-200 flex items-center justify-center">
            <FerrisWheel className="w-6 h-6 text-pink-700" />
          </div>
        </div>

        {/* Prize hint */}
        <div className="w-full rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-pink-50 shadow-sm p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-bold text-amber-700">1% 概率获得随机闪光6V宝可梦！</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-slate-900" />
          </div>

          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 2.1, ease: [0.15, 0.9, 0.2, 1] }}
            className="w-72 h-72 rounded-full border-[10px] border-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] overflow-hidden relative"
          >
            {/* Segments with labels */}
            {[...Array(prizes.length)].map((_, i) => {
              const segAngle = 360 / prizes.length;
              const startDeg = i * segAngle;
              const midDeg = startDeg + segAngle / 2;
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    top: '50%',
                    left: '50%',
                    width: '50%',
                    height: '2px',
                    transformOrigin: '0% 0%',
                    transform: `rotate(${startDeg}deg)`,
                    background: 'transparent',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      width: '200%',
                      height: '200%',
                      top: '-100%',
                      left: '0',
                      background: `conic-gradient(from ${startDeg}deg at 50% 100%, ${segColors[i][0]} 0deg, ${segColors[i][1]} ${segAngle}deg, transparent ${segAngle}deg)`,
                      clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)',
                    }}
                  />
                  <div
                    className="absolute text-[9px] font-black text-slate-800 whitespace-nowrap"
                    style={{
                      top: '-65px',
                      left: '10px',
                      transform: `rotate(${midDeg - startDeg}deg)`,
                      textShadow: '0 0 3px white, 0 0 6px white',
                    }}
                  >
                    {prizes[i].label}
                  </div>
                </div>
              );
            })}
            <div className="absolute inset-0 rounded-full border-[10px] border-white" style={{
              background: `conic-gradient(${segColors.map((c, i) => {
                const a1 = (i * 36);
                const a2 = ((i + 1) * 36);
                return `${c[0]} ${a1}deg ${a2}deg`;
              }).join(',')})`,
            }} />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-16 h-16 rounded-full bg-white/95 border border-white shadow-sm flex items-center justify-center">
                <Gift className="w-7 h-7 text-slate-900" />
              </div>
            </div>
          </motion.div>
        </div>

        <motion.button
          whileHover={{ scale: canSpin ? 1.01 : 1 }}
          whileTap={{ scale: canSpin ? 0.98 : 1 }}
          onClick={spin}
          disabled={!canSpin || spinning}
          className={[
            'w-full rounded-3xl px-5 py-5 border shadow-sm',
            'bg-pink-600 text-white font-black text-lg',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          {spinning ? '转动中…' : canSpin ? '开始转盘' : '冷却中'}
        </motion.button>

        {/* Result display */}
        <AnimatePresence>
          {showResult && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 15 }}
              className={`w-full rounded-3xl border shadow-lg p-5 text-center ${
                result.type === 'pokemon'
                  ? 'bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-100 border-amber-300'
                  : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
              }`}
            >
              {result.type === 'pokemon' ? (
                <>
                  <div className="flex justify-center mb-2">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-200/60">
                      <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                      <span className="font-black text-amber-800 text-sm">传说大奖！</span>
                      <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">{result.label}</div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">闪光宝可梦已加入仓库！</div>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-2">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-200/60">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <span className="font-black text-emerald-800 text-sm">获得奖励！</span>
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">{result.label}</div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">奖励已自动发放到你的存档</div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 创建闪光6V宝可梦
function createShiny6VPokemon(speciesId: number): Pokemon {
  const level = 1;
  const nature = generateRandomNature();
  const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
  const evs = emptyEvs();
  const abilityInfo = generateAbility(speciesId);
  const baseStats = getBaseStats(speciesId);
  const stats = calculateStats(baseStats, ivs, evs, nature, level, true);
  const name = SPECIES_INFO[speciesId]?.name || '???';

  return {
    id: `shiny-${Date.now()}-${speciesId}`,
    speciesId,
    name,
    level,
    exp: 0,
    hunger: 100,
    happiness: 100,
    hp: stats.hp,
    maxHp: stats.hp,
    skills: getInitialSkills(speciesId),
    nature,
    ivs,
    evs,
    ability: abilityInfo.ability,
    isHiddenAbility: abilityInfo.isHidden,
    baseStats,
    stats,
    lastInteraction: Date.now(),
    isShiny: true,
  };
}
