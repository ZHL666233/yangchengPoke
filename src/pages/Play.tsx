import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { EXP_TO_NEXT_LEVEL, ITEMS, ItemId, MAX_HAPPINESS, MAX_HUNGER, SPECIES_INFO, getNextSkill, ABILITY_INFO, getNatureText, canEvolve, getBaseStats, STAT_NAMES, BaseStats, getAllLearnedSkills, isPerfectIv } from '@/types';
import { Apple, Backpack, CircleDollarSign, Dumbbell, Sparkles, Briefcase, BookOpen, HeartPulse, Activity, ChevronLeft, ChevronRight, Plus, Lock, ArrowRightLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PokemonImage from '@/components/PokemonImage';
import BottomNav from '@/components/BottomNav';
import TypeBadges from '@/components/TypeBadges';
import BaseStatsChart from '@/components/BaseStatsChart';
import ItemImage from '@/components/ItemImage';
import { getPokemonTypes } from '@/pokemonTypes';

const FEED_ITEMS: ItemId[] = ['berry', 'apple', 'sandwich', 'potion', 'pokeblock', 'vitamin', 'energy_powder'];
const PLAY_ITEMS: ItemId[] = ['toy', 'ball', 'kite', 'frisbee', 'yarn', 'poffin'];
const OTHER_ITEMS: ItemId[] = ['candy', 'rare_candy'];
const EVOLUTION_ITEMS: ItemId[] = ['fire_stone', 'water_stone', 'thunder_stone', 'leaf_stone', 'moon_stone'];
const IV_ITEMS: ItemId[] = ['hp_up', 'protein', 'iron', 'calcium', 'zinc', 'carbos'];
const BAG_ALL_ITEMS: ItemId[] = [...EVOLUTION_ITEMS, ...IV_ITEMS];

const ActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  color 
}: { 
  icon: LucideIcon; 
  label: string; 
  onClick: () => void;
  color: string;
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl shadow-sm ${color} transition-colors`}
  >
    <Icon className="w-6 h-6 mb-1" />
    <span className="font-bold text-xs">{label}</span>
  </motion.button>
);

const ProgressBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div className="w-full">
    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
      <span>{label}</span>
      <span>{Math.floor(value)}/{max}</span>
    </div>
    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
      <motion.div 
        className={`h-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
      />
    </div>
  </div>
);

export default function Play() {
  const { party, box, battleTeam, unlockedRooms, coins, inventory, consumeItem, work, finishWork, train, finishTrain, checkStatus, restorePp, unlockRoom, switchPokemon, evolvePokemon, setSkills } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showBag, setShowBag] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWorkPanel, setShowWorkPanel] = useState(false);
  const [showTrainPanel, setShowTrainPanel] = useState(false);
  const [bagMode, setBagMode] = useState<'all' | 'feed' | 'play'>('all');
  const [showUnlockRoomConfirm, setShowUnlockRoomConfirm] = useState(false);
  const [pendingUnlockCost, setPendingUnlockCost] = useState<number>(0);
  
  // Evolution states
  const [showEvolveConfirm, setShowEvolveConfirm] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolveAnim, setEvolveAnim] = useState<{
    oldSpeciesId: number;
    newSpeciesId: number;
    oldName: string;
    newName: string;
  } | null>(null);
  const [evolveResult, setEvolveResult] = useState<{
    oldSpeciesId: number;
    newSpeciesId: number;
    oldBaseStats: BaseStats;
    newBaseStats: BaseStats;
    oldName: string;
    newName: string;
  } | null>(null);
  const [roomPage, setRoomPage] = useState(0);
  const [swapSlotId, setSwapSlotId] = useState<string | null>(null);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [skillSwapSlot, setSkillSwapSlot] = useState<number | null>(null);
  const [boxSearchQuery, setBoxSearchQuery] = useState('');
  const [boxFilterType, setBoxFilterType] = useState<string | null>(null);

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus();
    }, 60000);
    checkStatus();
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleUseBagItem = (itemId: ItemId) => {
    if (!selectedId) return;
    // IV道具
    if (IV_ITEMS.includes(itemId)) {
      const ok = useGameStore.getState().useIvItem(itemId, selectedId);
      if (ok) setToast(`使用 ${ITEMS[itemId].name}，个体值提升！`);
      else {
        const count = inventory[itemId] || 0;
        setToast(count <= 0 ? '道具不足' : '个体值已满，无法再提升');
      }
      return;
    }
    // 进化石道具
    if (EVOLUTION_ITEMS.includes(itemId)) {
      const pokemon = party.find(p => p.id === selectedId);
      if (!pokemon) return;
      const info = SPECIES_INFO[pokemon.speciesId];
      if (!info?.evoCondition?.includes(ITEMS[itemId].name.replace('之石', ''))) {
        setToast(`该宝可梦无法使用 ${ITEMS[itemId].name} 进化`);
        return;
      }
      // 找到对应的进化条件匹配
      const stoneName = ITEMS[itemId].name.replace('之石', '');
      const evoConditionMatch = info.evoCondition?.includes(stoneName) || 
        (itemId === 'fire_stone' && info.evoCondition?.includes('火之石')) ||
        (itemId === 'water_stone' && info.evoCondition?.includes('水之石')) ||
        (itemId === 'thunder_stone' && info.evoCondition?.includes('雷之石')) ||
        (itemId === 'leaf_stone' && info.evoCondition?.includes('叶之石')) ||
        (itemId === 'moon_stone' && info.evoCondition?.includes('月之石'));
      if (!evoConditionMatch) {
        setToast(`该宝可梦无法使用 ${ITEMS[itemId].name} 进化`);
        return;
      }
      if (!info.evoTo) {
        setToast('该宝可梦已达到最终形态');
        return;
      }
      // 消耗道具并进化
      const count = inventory[itemId] || 0;
      if (count <= 0) {
        setToast('道具不足');
        return;
      }
      consumeItem(itemId);
      evolvePokemon(selectedId, info.evoTo);
      setToast(`${pokemon.name} 使用 ${ITEMS[itemId].name} 进化了！`);
      return;
    }
    // 喂食/玩耍道具
    if (bagMode === 'feed') setActiveAction('feed');
    if (bagMode === 'play') setActiveAction('play');
    const ok = consumeItem(itemId, selectedId);
    if (ok) setToast(`使用 ${ITEMS[itemId].name}`);
    else setToast('道具不足');
    window.setTimeout(() => setActiveAction(null), 600);
  };

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleUnlockRoom = () => {
    const cost = unlockedRooms * 1000;
    if (coins < cost) {
      setToast(`金币不足！需要 ${cost} 金币`);
      return;
    }
    setPendingUnlockCost(cost);
    setShowUnlockRoomConfirm(true);
  };

  if (!selectedId) {
    const ROOMS_PER_PAGE = 6;
    const totalRoomsToShow = Math.min(unlockedRooms + (unlockedRooms < 20 ? 1 : 0), 20);
    const totalPages = Math.ceil(totalRoomsToShow / ROOMS_PER_PAGE) || 1;
    const startIdx = roomPage * ROOMS_PER_PAGE;
    const currentSlots = Array.from({ length: ROOMS_PER_PAGE }).map((_, i) => startIdx + i).filter(i => i < totalRoomsToShow);

    // Rooms Overview
    return (
      <div className="h-full w-full bg-slate-50 flex flex-col relative">
        <div className="bg-emerald-600 px-6 pt-12 pb-6 shadow-sm z-10 rounded-b-3xl text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">培育屋</h1>
            <div className="text-sm font-bold opacity-80 mt-1">安排宝可梦在此休息与训练</div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/20 border border-white/20">
            <CircleDollarSign className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-black">{coins}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-24 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-slate-500 text-sm">房间列表 ({unlockedRooms}/20)</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setRoomPage(p => Math.max(0, p - 1))}
                  disabled={roomPage === 0}
                  className="p-1 rounded bg-slate-200 text-slate-600 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-500">{roomPage + 1} / {totalPages}</span>
                <button 
                  onClick={() => setRoomPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={roomPage === totalPages - 1}
                  className="p-1 rounded bg-slate-200 text-slate-600 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 min-w-0">
            {currentSlots.map((i) => {
              const isUnlocked = i < unlockedRooms;
              const pokemon = isUnlocked ? party[i] : null;

              if (!isUnlocked) {
                const cost = unlockedRooms * 1000;
                return (
                  <motion.button
                    key={`locked-${i}`}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUnlockRoom}
                    className="min-h-[200px] bg-slate-200 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center p-4 text-slate-400 hover:bg-slate-300 hover:text-slate-500 transition-colors w-full"
                  >
                    <Lock className="w-8 h-8 mb-2" />
                    <span className="font-bold text-sm">解锁房间</span>
                    <span className="text-xs font-bold flex items-center gap-1 mt-1 text-amber-600"><CircleDollarSign className="w-3 h-3" />{cost}</span>
                  </motion.button>
                );
              }

              if (!pokemon) {
                return (
                  <motion.button
                    key={`empty-${i}`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSwapSlotId(null); // passing null means empty slot, but we need to track index or something...
                      // Wait, we need to know WHICH slot. But switchPokemon uses IDs.
                      // Since party is just an array, adding a pokemon pushes it to the end.
                      // If party length is less than unlocked rooms, any empty slot adds to the end.
                      setSwapSlotId(''); 
                      setShowBoxModal(true);
                    }}
                    className="min-h-[200px] bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-3xl flex flex-col items-center justify-center p-4 text-emerald-600 hover:bg-emerald-100 transition-colors w-full"
                  >
                    <Plus className="w-8 h-8 mb-2" />
                    <span className="font-bold text-sm">安排宝可梦</span>
                  </motion.button>
                );
              }

              const isWorking = !!pokemon.work;
              const isTraining = !!pokemon.train;
              const canEvo = !!canEvolve(pokemon.speciesId, pokemon.level);

              return (
                <motion.div
                  key={pokemon.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedId(pokemon.id)}
                  className="min-h-[200px] bg-white border border-slate-200 rounded-3xl p-4 shadow-sm relative flex flex-col items-center hover:border-emerald-300 transition-colors cursor-pointer w-full overflow-hidden"
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSwapSlotId(pokemon.id); setShowBoxModal(true); }}
                    className="absolute top-2 right-2 p-1.5 bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 rounded-full z-20 transition-colors"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
                  {isWorking && <div className="absolute top-2 left-2 text-[10px] font-black text-amber-500 bg-amber-50 px-1 py-0.5 rounded shadow-sm z-20">打工中</div>}
                  {isTraining && <div className="absolute top-2 left-2 text-[10px] font-black text-purple-500 bg-purple-50 px-1 py-0.5 rounded shadow-sm z-20">训练中</div>}
                  {canEvo && !isWorking && !isTraining && (
                    <div className="absolute top-2 left-2 text-[10px] font-black text-blue-600 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded shadow-sm z-20 animate-pulse flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" />可进化
                    </div>
                  )}
                  <PokemonImage speciesId={pokemon.speciesId} alt={pokemon.name} isShiny={pokemon.isShiny} className={`w-14 h-14 object-contain drop-shadow-md ${(isWorking || isTraining) ? 'opacity-70' : ''} ${isWorking ? 'animate-[bounce_2s_infinite]' : isTraining ? 'animate-pulse' : ''}`} />
                  <div className="text-xs font-black text-slate-800 mt-1 truncate w-full text-center flex items-center justify-center gap-0.5">
                    {pokemon.name}
                    {pokemon.isShiny && <span className="text-amber-500">✨</span>}
                    {isPerfectIv(pokemon.ivs) && <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-1 py-px rounded border border-amber-200">6V</span>}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">Lv.{pokemon.level}</div>
                  <TypeBadges speciesId={pokemon.speciesId} size="xs" />
                  {pokemon.ability && (
                    <div className="text-[8px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded truncate w-full text-center mt-0.5">{pokemon.ability}{pokemon.isHiddenAbility ? ' ★' : ''}</div>
                  )}
                  <div className="w-full space-y-1 pointer-events-none mt-1">
                    <div className="w-full">
                      <div className="flex justify-between text-[8px] font-bold text-slate-400 mb-0.5">
                        <span>HP</span>
                        <span>{Math.max(0, Math.floor(pokemon.hp))}/{pokemon.maxHp}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${pokemon.hp <= 0 ? 'bg-red-500' : pokemon.hp / pokemon.maxHp < 0.3 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.max(0, (pokemon.hp / pokemon.maxHp) * 100)}%` }} />
                      </div>
                    </div>
                    <ProgressBar label="饱食度" value={pokemon.hunger} max={MAX_HUNGER} color="bg-orange-400" />
                    <ProgressBar label="心情" value={pokemon.happiness} max={MAX_HAPPINESS} color="bg-pink-400" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>



      <AnimatePresence>
        {showUnlockRoomConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-6"
            onClick={() => setShowUnlockRoomConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative text-center"
            >
              <h3 className="font-black text-xl text-slate-800 mb-2">确认解锁新房间？</h3>
              <p className="text-sm font-bold text-slate-500 mb-6">
                将消耗 {pendingUnlockCost} 金币解锁一个新的培育房间。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnlockRoomConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const ok = unlockRoom();
                    setShowUnlockRoomConfirm(false);
                    setToast(ok ? '成功解锁新房间！' : '解锁失败');
                  }}
                  className="flex-1 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  确认解锁
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full font-bold text-sm z-[70]">
            {toast}
          </div>
        )}
        <BottomNav />

        {/* Box Modal for Swapping */}
        <AnimatePresence>
          {showBoxModal && (() => {
            // 筛选后的宝可梦列表
            const filteredBox = box.filter(p => {
              // 搜索过滤
              if (boxSearchQuery) {
                const q = boxSearchQuery.toLowerCase();
                const nameMatch = p.name.toLowerCase().includes(q);
                const speciesMatch = SPECIES_INFO[p.speciesId]?.name.toLowerCase().includes(q);
                if (!nameMatch && !speciesMatch) return false;
              }
              // 属性过滤
              if (boxFilterType) {
                const types = getPokemonTypes(p.speciesId);
                if (!types.includes(boxFilterType)) return false;
              }
              return true;
            });
            // 收集所有出现过的属性
            const allTypes = [...new Set(box.flatMap(p => getPokemonTypes(p.speciesId)))];
            return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 z-[60] flex items-end sm:items-center justify-center sm:p-6"
              onClick={() => { setShowBoxModal(false); setBoxSearchQuery(''); setBoxFilterType(null); }}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md h-[80vh] sm:h-[600px] shadow-2xl relative flex flex-col"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-black text-xl text-slate-800">选择宝可梦</h3>
                  <button onClick={() => { setShowBoxModal(false); setBoxSearchQuery(''); setBoxFilterType(null); }} className="text-slate-400 hover:text-slate-600 font-bold">关闭</button>
                </div>
                
                {swapSlotId && party.find(p => p.id === swapSlotId) && (
                  <button 
                    onClick={() => {
                      switchPokemon(swapSlotId, null);
                      setShowBoxModal(false);
                      setToast('已移至仓库');
                    }}
                    className="w-full py-3 mb-3 rounded-xl border-2 border-red-100 bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                  >
                    移入仓库
                  </button>
                )}

                {/* 搜索栏 */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="搜索宝可梦名称..."
                    value={boxSearchQuery}
                    onChange={(e) => setBoxSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-9 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* 属性筛选 */}
                {allTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    <button
                      onClick={() => setBoxFilterType(null)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${!boxFilterType ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
                    >
                      全部
                    </button>
                    {allTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => setBoxFilterType(boxFilterType === type ? null : type)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${boxFilterType === type ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-2 pr-1 min-h-0">
                  {filteredBox.map((p) => {
                    const isWorking = !!p.work;
                    const isTraining = !!p.train;
                    const pTypes = getPokemonTypes(p.speciesId);
                    return (
                      <button
                        key={p.id}
                        disabled={isWorking || isTraining}
                        onClick={() => {
                          switchPokemon(swapSlotId || '', p.id);
                          setShowBoxModal(false);
                          setBoxSearchQuery('');
                          setBoxFilterType(null);
                          setToast('更换成功');
                        }}
                        className="rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center p-2 relative shadow-sm hover:border-indigo-400 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-3"
                      >
                        <PokemonImage speciesId={p.speciesId} alt={p.name} isShiny={p.isShiny} className="w-12 h-12 object-contain" />
                        <div className="text-[10px] font-bold mt-1 text-slate-800 text-center truncate w-full flex items-center justify-center gap-0.5">
                          {p.name}
                          {p.isShiny && <span className="text-amber-500">✨</span>}
                          {isPerfectIv(p.ivs) && <span className="text-[7px] font-black text-amber-600 bg-amber-100 px-1 py-px rounded border border-amber-200">6V</span>}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400">Lv.{p.level}</div>
                        <div className="flex gap-0.5 mt-0.5">
                          {pTypes.map(t => (
                            <span key={t} className="text-[7px] font-bold text-slate-500 bg-slate-100 px-1 rounded">{t}</span>
                          ))}
                        </div>
                        {(isWorking || isTraining) && <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl"><span className="text-[10px] font-black bg-slate-800 text-white px-2 py-0.5 rounded">忙碌中</span></div>}
                      </button>
                    );
                  })}
                  {filteredBox.length === 0 && (
                    <div className="col-span-3 text-center py-10 text-slate-400 font-bold text-sm">
                      {boxSearchQuery || boxFilterType ? '没有匹配的宝可梦' : '仓库中没有宝可梦'}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    );
  }

  const pokemon = party.find(p => p.id === selectedId);
  if (!pokemon) {
    setSelectedId(null);
    return null;
  }

  const expNeeded = EXP_TO_NEXT_LEVEL(pokemon.level);
  const isWorking = !!pokemon.work;
  const isTraining = !!pokemon.train;
  const evolveTo = canEvolve(pokemon.speciesId, pokemon.level);

  const workRemaining = pokemon.work ? Math.max(0, pokemon.work.endTime - Date.now()) : 0;
  const trainRemaining = pokemon.train ? Math.max(0, pokemon.train.endTime - Date.now()) : 0;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}分${s}秒`;
  };

  const handleStartWork = (jobName: string, durationMs: number, reward: number, itemChance: number, hungerCost: number, happinessCost: number) => {
    if (battleTeam.includes(pokemon.id)) {
      setToast('出战中的宝可梦无法打工，请先取消出战。');
      return;
    }
    if (pokemon.hunger < hungerCost || pokemon.happiness < happinessCost) {
      setToast(`饱食度不足 ${hungerCost} 或心情不足 ${happinessCost}，无法打工！`);
      return;
    }
    work(pokemon.id, jobName, durationMs, reward, itemChance, hungerCost, happinessCost);
    setShowWorkPanel(false);
    setActiveAction('work');
    setToast('开始打工！');
    window.setTimeout(() => setActiveAction(null), 800);
  };

  const handleStartTrain = (intensityName: string, durationMs: number, evTotal: number, hungerCost: number, happinessCost: number) => {
    if (battleTeam.includes(pokemon.id)) {
      setToast('出战中的宝可梦无法特训，请先取消出战。');
      return;
    }
    if (pokemon.hunger < hungerCost || pokemon.happiness < happinessCost) {
      setToast(`饱食度不足 ${hungerCost} 或心情不足 ${happinessCost}，无法特训！`);
      return;
    }
    train(pokemon.id, intensityName, durationMs, evTotal, hungerCost, happinessCost);
    setShowTrainPanel(false);
    setActiveAction('train');
    setToast('开始特训！');
    window.setTimeout(() => setActiveAction(null), 800);
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col relative">
      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-2 shadow-sm z-10 rounded-b-3xl">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedId(null)} className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setShowStats(true)}>
                <h1 className="text-lg font-black text-slate-800 flex items-center gap-1">
                  {pokemon.name}
                  {pokemon.isShiny && <span className="text-amber-500">✨</span>}
                  {isPerfectIv(pokemon.ivs) && <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">6V</span>}
                </h1>
                <Activity className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">Lv.{pokemon.level}</span>
                <TypeBadges speciesId={pokemon.speciesId} className="justify-start" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">EXP</span>
              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div className="h-full bg-yellow-400" animate={{ width: `${(pokemon.exp / expNeeded) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <ProgressBar label="饱食度" value={pokemon.hunger} max={MAX_HUNGER} color="bg-orange-400" />
          </div>
          <div className="flex-1">
            <ProgressBar label="心情" value={pokemon.happiness} max={MAX_HAPPINESS} color="bg-pink-400" />
          </div>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="w-64 h-64 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10">
          <AnimatePresence>
            {activeAction === 'feed' && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.5 }}
                animate={{ opacity: 1, y: -40, scale: 1 }}
                exit={{ opacity: 0, y: -60 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl"
              >
                🍎
              </motion.div>
            )}
            {activeAction === 'play' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1.5, rotate: [0, 10, -10, 0] }}
                exit={{ opacity: 0, scale: 2 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl"
              >
                ❤️
              </motion.div>
            )}
            {activeAction === 'work' && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 20 }}
                exit={{ opacity: 0 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl text-amber-400"
              >
                💰
              </motion.div>
            )}
            {activeAction === 'train' && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 20 }}
                exit={{ opacity: 0 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl"
              >
                💪
              </motion.div>
            )}
          </AnimatePresence>

          <PokemonImage
            speciesId={pokemon.speciesId}
            alt={pokemon.name}
            isShiny={pokemon.isShiny}
            className={`w-44 h-44 sm:w-52 sm:h-52 object-contain drop-shadow-2xl ${isWorking ? 'animate-[bounce_2s_infinite]' : isTraining ? 'animate-pulse' : ''}`}
            animate={{
              y: [0, -15, 0],
              scale: activeAction ? [1, 1.1, 1] : 1,
            }}
            transition={{
              y: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
              scale: { duration: 0.3 },
            }}
          />
        </div>
      </div>

      {/* Action Panel */}
      <div className="bg-white p-4 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10">
        {!showBag && !showSkills && !showWorkPanel && !showTrainPanel ? (
          <>
            <div className="grid grid-cols-4 gap-2">
              <ActionButton icon={Apple} label="喂食" onClick={() => { setBagMode('feed'); setShowBag(true); }} color="bg-orange-50 text-orange-600 hover:bg-orange-100" />
              <ActionButton icon={Sparkles} label="玩耍" onClick={() => { setBagMode('play'); setShowBag(true); }} color="bg-pink-50 text-pink-600 hover:bg-pink-100" />
              <ActionButton icon={Briefcase} label="打工" onClick={() => isWorking ? finishWork(pokemon.id) : setShowWorkPanel(true)} color="bg-amber-50 text-amber-600 hover:bg-amber-100" />
              <ActionButton icon={Dumbbell} label="特训" onClick={() => isTraining ? finishTrain(pokemon.id) : setShowTrainPanel(true)} color="bg-purple-50 text-purple-600 hover:bg-purple-100" />
            </div>
            {isWorking && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-amber-700">正在进行：{pokemon.work!.jobName}</span>
                  <span className="text-[9px] font-bold text-amber-600">预计收益：{pokemon.work!.reward} <CircleDollarSign className="w-2.5 h-2.5 inline" /></span>
                </div>
                {workRemaining > 0 ? (
                  <span className="text-xs font-black text-amber-600">{formatTime(workRemaining)}</span>
                ) : (
                  <button onClick={() => finishWork(pokemon.id)} className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] font-bold">领取奖励</button>
                )}
              </div>
            )}
            {isTraining && (
              <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-2 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-purple-700">正在进行：{pokemon.train!.intensityName}</span>
                  <span className="text-[9px] font-bold text-purple-600">预计提升：{pokemon.train!.evTotal} 点努力值</span>
                </div>
                {trainRemaining > 0 ? (
                  <span className="text-xs font-black text-purple-600">{formatTime(trainRemaining)}</span>
                ) : (
                  <button onClick={() => finishTrain(pokemon.id)} className="px-2 py-1 bg-purple-500 text-white rounded text-[10px] font-bold">完成特训</button>
                )}
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button onClick={() => { setBagMode('all'); setShowBag(true); }} className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors text-sm">
                <Backpack className="w-4 h-4" />
                <span>背包</span>
              </button>
              <button onClick={() => setShowSkills(true)} className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors text-sm">
                <BookOpen className="w-4 h-4" />
                <span>技能</span>
              </button>
            </div>
            
            {/* Evolution Button */}
            {!!evolveTo && (
              <button 
                type="button"
                onClick={() => {
                  if (isWorking || isTraining) {
                    setToast('忙碌中无法进化，请先结束打工/特训。');
                    return;
                  }
                  setShowEvolveConfirm(true);
                }}
                className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-sm relative z-[9999] pointer-events-auto"
              >
                ✨ 可以进化了！✨
              </button>
            )}
          </>
        ) : showWorkPanel ? (
          <div className="flex flex-col h-full max-h-64">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 text-lg">选择打工</h3>
              <button onClick={() => setShowWorkPanel(false)} className="text-slate-400 font-bold text-sm">取消</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1 no-scrollbar">
              <button onClick={() => handleStartWork('帮忙搬运', 1 * 60 * 1000, 50, 0.05, 10, 10)} className="w-full p-3 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">帮忙搬运</span>
                  <span className="text-xs font-bold text-amber-600">~50 金币</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">耗时 1 分钟，小概率获得道具。</div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">-10 饱食度</span>
                  <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded">-10 心情</span>
                </div>
              </button>
              <button onClick={() => handleStartWork('协助研究', 5 * 60 * 1000, 300, 0.15, 20, 20)} className="w-full p-3 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">协助研究</span>
                  <span className="text-xs font-bold text-amber-600">~300 金币</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">耗时 5 分钟，一定概率获得道具。</div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">-20 饱食度</span>
                  <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded">-20 心情</span>
                </div>
              </button>
              <button onClick={() => handleStartWork('探索寻宝', 15 * 60 * 1000, 1000, 0.4, 40, 40)} className="w-full p-3 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">探索寻宝</span>
                  <span className="text-xs font-bold text-amber-600">~1000 金币</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">耗时 15 分钟，大概率获得道具。</div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">-40 饱食度</span>
                  <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded">-40 心情</span>
                </div>
              </button>
            </div>
          </div>
        ) : showTrainPanel ? (
          <div className="flex flex-col h-full max-h-64">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 text-lg">选择特训</h3>
              <button onClick={() => setShowTrainPanel(false)} className="text-slate-400 font-bold text-sm">取消</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1 no-scrollbar">
              <button onClick={() => handleStartTrain('轻度训练', 1 * 60 * 1000, 5, 10, 5)} className="w-full p-3 rounded-2xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">轻度训练</span>
                  <span className="text-xs font-bold text-purple-600">+5 努力值</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">耗时 1 分钟，消耗较少体力。</div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">-10 饱食度</span>
                  <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded">-5 心情</span>
                </div>
              </button>
              <button onClick={() => handleStartTrain('常规特训', 5 * 60 * 1000, 30, 20, 10)} className="w-full p-3 rounded-2xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">常规特训</span>
                  <span className="text-xs font-bold text-purple-600">+30 努力值</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">耗时 5 分钟，显著提升能力。</div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">-20 饱食度</span>
                  <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded">-10 心情</span>
                </div>
              </button>
              <button onClick={() => handleStartTrain('魔鬼特训', 15 * 60 * 1000, 100, 40, 20)} className="w-full p-3 rounded-2xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">魔鬼特训</span>
                  <span className="text-xs font-bold text-purple-600">+100 努力值</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">耗时 15 分钟，挑战极限！</div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">-40 饱食度</span>
                  <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded">-20 心情</span>
                </div>
              </button>
            </div>
          </div>
        ) : showBag ? (
          <div className="flex flex-col h-full max-h-64">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 text-lg">
                {bagMode === 'feed' ? '喂食道具' : bagMode === 'play' ? '玩耍道具' : '背包'}
              </h3>
              <button onClick={() => setShowBag(false)} className="text-slate-400 font-bold text-sm">关闭</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1">
              {(
                bagMode === 'feed'
                  ? FEED_ITEMS
                  : bagMode === 'play'
                    ? PLAY_ITEMS
                    : BAG_ALL_ITEMS
              ).map(id => {
                const item = ITEMS[id];
                const count = inventory[id] || 0;
                if (count <= 0) return null;
                return (
                  <div key={id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center">
                        <ItemImage itemId={id} className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{item.name} <span className="text-slate-400 text-xs ml-1">x{count}</span></div>
                        <div className="text-xs text-slate-500 font-medium">{item.description}</div>
                      </div>
                    </div>
                    <button onClick={() => handleUseBagItem(id)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
                      使用
                    </button>
                  </div>
                );
              })}
              {(
                (bagMode === 'feed'
                  ? FEED_ITEMS
                  : bagMode === 'play'
                    ? PLAY_ITEMS
                    : BAG_ALL_ITEMS)
                  .filter((id) => (inventory[id] || 0) > 0).length === 0
              ) && (
                <div className="text-center text-slate-400 font-bold py-4">背包里没有可以使用的道具</div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full max-h-64">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 text-lg">已习得技能</h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    restorePp();
                    setToast('PP 已恢复！');
                  }} 
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <HeartPulse className="w-3.5 h-3.5" /> 恢复PP
                </button>
                <button onClick={() => { setShowSkills(false); setSkillSwapSlot(null); }} className="text-slate-400 font-bold text-sm">关闭</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-2 pr-1">
              {pokemon.skills.map((s, idx) => (
                <div key={s.id} className={`bg-slate-50 border rounded-xl p-3 flex flex-col justify-center relative overflow-hidden cursor-pointer transition-colors ${skillSwapSlot === idx ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'}`}
                  onClick={() => setSkillSwapSlot(skillSwapSlot === idx ? null : idx)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-black text-slate-800 text-sm z-10">{s.name}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 rounded z-10">{s.type}</span>
                  </div>
                  <div className="flex justify-between items-end mt-2 z-10">
                    <span className="text-xs font-bold text-slate-500">威力 {s.power}</span>
                    <span className={`text-xs font-bold ${s.pp === 0 ? 'text-red-500' : 'text-emerald-600'}`}>PP {s.pp}/{s.maxPp}</span>
                  </div>
                  {skillSwapSlot === idx && (
                    <div className="absolute top-0.5 right-1 text-[8px] font-black text-blue-600 bg-blue-100 px-1 py-0.5 rounded">已选</div>
                  )}
                  <div className="mt-2 text-[10px] font-semibold text-slate-500 leading-tight z-10 line-clamp-2">{s.description}</div>
                </div>
              ))}
              {(() => {
                const nextSkill = getNextSkill(pokemon.speciesId, pokemon.level, pokemon.skills);
                if (!nextSkill) return null;
                return (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden opacity-60">
                    <BookOpen className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="font-bold text-slate-500 text-xs">下一技能解锁</span>
                    <span className="font-black text-slate-700 text-sm">Lv.{nextSkill.level}</span>
                  </div>
                );
              })()}
            </div>
            {/* Skill Swap Panel */}
            {skillSwapSlot !== null && (() => {
              const allLearned = getAllLearnedSkills(pokemon.speciesId, pokemon.level, pokemon.skills);
              const unequipped = allLearned.filter(s => !pokemon.skills.find(e => e.id === s.id));
              const currentId = pokemon.skills[skillSwapSlot]?.id;
              return (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-[10px] font-bold text-blue-700 mb-2">
                    选择替换「{pokemon.skills[skillSwapSlot]?.name}」的技能（点击装备）
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSkillSwapSlot(null)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100"
                    >
                      取消
                    </button>
                    {unequipped.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          if (!selectedId) return;
                          const newSkills = [...pokemon.skills];
                          newSkills[skillSwapSlot!] = { ...s, pp: s.maxPp };
                          setSkills(selectedId, newSkills);
                          setSkillSwapSlot(null);
                          setToast(`${s.name} 已替换！`);
                        }}
                        className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        {s.name} <span className="opacity-60 ml-0.5">{s.type}</span> <span className="opacity-50">Lv.{s.learnLevel ?? '?'}</span>
                      </button>
                    ))}
                    {unequipped.length === 0 && (
                      <span className="text-[10px] text-slate-400">暂无其他已学会的技能</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-6"
            onClick={() => { setShowStats(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl relative flex flex-col max-h-[85vh]"
            >
              <button 
                onClick={() => setShowStats(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors z-10"
              >
                ✕
              </button>
              
              <div className="overflow-y-auto p-6 no-scrollbar flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <PokemonImage speciesId={pokemon.speciesId} alt="pokemon" isShiny={pokemon.isShiny} className="w-12 h-12 object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-800 flex items-center gap-1">
                    {pokemon.name}
                    {pokemon.isShiny && <span className="text-amber-500">✨</span>}
                    {isPerfectIv(pokemon.ivs) && <span className="text-xs font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">6V</span>}
                  </h3>
                  <div className="text-sm font-bold text-slate-500">Lv.{pokemon.level} | 性格: <span className="text-emerald-600">{pokemon.nature ? getNatureText(pokemon.nature) : '未知'}</span></div>
                  <TypeBadges speciesId={pokemon.speciesId} size="xs" className="justify-start mt-1" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">特性</h4>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">{pokemon.ability}</span>
                      {pokemon.isHiddenAbility && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">隐藏特性</span>}
                    </div>
                    <div className="text-xs text-slate-500 font-semibold">{ABILITY_INFO[pokemon.ability] || '暂无说明'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">种族值</h4>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <BaseStatsChart baseStats={pokemon.baseStats || getBaseStats(pokemon.speciesId)} />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">能力值 (种族值+个体值) <span className="text-blue-500 ml-1">努力值</span></h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 relative">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">HP</div>
                      <div className="font-black text-slate-700">{pokemon.stats?.hp ?? pokemon.hp} <span className="text-[10px] font-semibold text-emerald-500 ml-1">({pokemon.baseStats?.hp ?? 0}+{pokemon.ivs?.hp ?? 0})</span></div>
                      <div className="absolute top-2 right-2 text-[10px] font-bold text-blue-500">+{pokemon.evs?.hp ?? 0}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 relative">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">攻击 (Atk)</div>
                      <div className="font-black text-slate-700">{pokemon.stats?.atk ?? 0} <span className="text-[10px] font-semibold text-emerald-500 ml-1">({pokemon.baseStats?.atk ?? 0}+{pokemon.ivs?.atk ?? 0})</span></div>
                      <div className="absolute top-2 right-2 text-[10px] font-bold text-blue-500">+{pokemon.evs?.atk ?? 0}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 relative">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">防御 (Def)</div>
                      <div className="font-black text-slate-700">{pokemon.stats?.def ?? 0} <span className="text-[10px] font-semibold text-emerald-500 ml-1">({pokemon.baseStats?.def ?? 0}+{pokemon.ivs?.def ?? 0})</span></div>
                      <div className="absolute top-2 right-2 text-[10px] font-bold text-blue-500">+{pokemon.evs?.def ?? 0}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 relative">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">特攻 (SpA)</div>
                      <div className="font-black text-slate-700">{pokemon.stats?.spa ?? 0} <span className="text-[10px] font-semibold text-emerald-500 ml-1">({pokemon.baseStats?.spa ?? 0}+{pokemon.ivs?.spa ?? 0})</span></div>
                      <div className="absolute top-2 right-2 text-[10px] font-bold text-blue-500">+{pokemon.evs?.spa ?? 0}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 relative">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">特防 (SpD)</div>
                      <div className="font-black text-slate-700">{pokemon.stats?.spd ?? 0} <span className="text-[10px] font-semibold text-emerald-500 ml-1">({pokemon.baseStats?.spd ?? 0}+{pokemon.ivs?.spd ?? 0})</span></div>
                      <div className="absolute top-2 right-2 text-[10px] font-bold text-blue-500">+{pokemon.evs?.spd ?? 0}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 relative">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">速度 (Spe)</div>
                      <div className="font-black text-slate-700">{pokemon.stats?.spe ?? 0} <span className="text-[10px] font-semibold text-emerald-500 ml-1">({pokemon.baseStats?.spe ?? 0}+{pokemon.ivs?.spe ?? 0})</span></div>
                      <div className="absolute top-2 right-2 text-[10px] font-bold text-blue-500">+{pokemon.evs?.spe ?? 0}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">进化条件</h4>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-sm font-bold text-slate-700">
                    {SPECIES_INFO[pokemon.speciesId]?.evoTo ? (
                      <div className="flex items-center justify-between">
                        <span>进化为: <span className="text-emerald-600">{SPECIES_INFO[SPECIES_INFO[pokemon.speciesId].evoTo!].name}</span></span>
                        <span className="text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">{SPECIES_INFO[pokemon.speciesId].evoCondition}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">已达到最终形态</span>
                    )}
                  </div>
                </div>
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evolution Modals - Using simple conditionals without AnimatePresence for rock-solid stability during rapid state changes */}
      {showEvolveConfirm && !isEvolving && (
        <div
          className="fixed inset-0 bg-slate-900/80 z-[9999] flex items-center justify-center p-6"
          onPointerDown={() => setShowEvolveConfirm(false)}
        >
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative text-center"
          >
            <h3 className="font-black text-2xl text-slate-800 mb-2">准备进化！</h3>
            <p className="text-sm font-bold text-slate-500 mb-6">
              你的 {pokemon.name} 似乎要进化了！<br/>要让它现在进化吗？
            </p>
            {SPECIES_INFO[pokemon.speciesId]?.evoTo && (
              <div className="flex justify-center items-center gap-6 mb-8 pointer-events-none">
                <PokemonImage speciesId={pokemon.speciesId} alt="current" isShiny={pokemon.isShiny} className="w-16 h-16 object-contain" />
                <span className="text-2xl text-slate-300">➡️</span>
                <PokemonImage speciesId={SPECIES_INFO[pokemon.speciesId].evoTo!} alt="next" isShiny={pokemon.isShiny} className="w-16 h-16 object-contain grayscale opacity-50" />
              </div>
            )}
            <div className="flex gap-3 relative z-[99999] pointer-events-auto">
              <button 
                type="button"
                onClick={() => setShowEvolveConfirm(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors pointer-events-auto cursor-pointer"
              >
                取消
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const newSpeciesId = canEvolve(pokemon.speciesId, pokemon.level);
                  if (!newSpeciesId) {
                    setShowEvolveConfirm(false);
                    setToast('当前未满足进化条件。');
                    return;
                  }
                  
                  // Extract state data safely before calling global stores
                  const newBaseStats = getBaseStats(newSpeciesId);
                  const currentBaseStats = pokemon.baseStats || getBaseStats(pokemon.speciesId);
                  const currentName = pokemon.name;
                  const newName = SPECIES_INFO[newSpeciesId].name;
                  const targetId = pokemon.id;
                  
                  // Hide confirm modal first
                  setShowEvolveConfirm(false);
                  setEvolveResult(null);
                  setEvolveAnim({
                    oldSpeciesId: pokemon.speciesId,
                    newSpeciesId,
                    oldName: currentName,
                    newName,
                  });
                  setIsEvolving(true);

                  window.setTimeout(() => {
                    evolvePokemon(targetId, newSpeciesId);
                    setIsEvolving(false);
                    setEvolveAnim(null);
                    setEvolveResult({
                      oldSpeciesId: pokemon.speciesId,
                      newSpeciesId: newSpeciesId,
                      oldBaseStats: currentBaseStats,
                      newBaseStats: newBaseStats,
                      oldName: currentName,
                      newName: newName,
                    });
                  }, 5200);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all pointer-events-auto cursor-pointer"
              >
                开始进化！
              </button>
            </div>
          </div>
        </div>
      )}

      {!isEvolving && evolveResult !== null && !showEvolveConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 z-[9999] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative animate-in slide-in-from-bottom-10">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="font-black text-2xl text-slate-800 mb-1">进化成功！</h3>
              <p className="text-sm font-bold text-slate-500">
                恭喜！你的 {evolveResult.oldName} 进化成了 <span className="text-emerald-600">{evolveResult.newName}</span>！
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-200 to-yellow-400 rounded-full opacity-20 animate-pulse blur-xl" />
                <PokemonImage speciesId={evolveResult.newSpeciesId} alt="new" isShiny={pokemon.isShiny} className="w-full h-full object-contain relative z-10 drop-shadow-xl" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
              <h4 className="text-xs font-black text-slate-400 mb-3 uppercase tracking-wider text-center">种族值提升</h4>
              <div className="space-y-2">
                {(() => {
                  const oldBst = evolveResult.oldBaseStats.hp + evolveResult.oldBaseStats.atk + evolveResult.oldBaseStats.def + evolveResult.oldBaseStats.spa + evolveResult.oldBaseStats.spd + evolveResult.oldBaseStats.spe;
                  const newBst = evolveResult.newBaseStats.hp + evolveResult.newBaseStats.atk + evolveResult.newBaseStats.def + evolveResult.newBaseStats.spa + evolveResult.newBaseStats.spd + evolveResult.newBaseStats.spe;
                  const diff = newBst - oldBst;
                  return (
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-500 w-12">总和</span>
                      <div className="flex-1 mx-3 flex items-center gap-2">
                        <span className="font-bold text-slate-400">{oldBst}</span>
                        <span className="text-slate-300">→</span>
                        <span className="font-black text-slate-700">{newBst}</span>
                      </div>
                      <span className={`font-black w-8 text-right ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-slate-300'}`}>
                        {diff > 0 ? `+${diff}` : diff < 0 ? diff : '-'}
                      </span>
                    </div>
                  );
                })()}
                {['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map(stat => {
                  const oldVal = evolveResult.oldBaseStats[stat as keyof BaseStats];
                  const newVal = evolveResult.newBaseStats[stat as keyof BaseStats];
                  const diff = newVal - oldVal;
                  return (
                    <div key={stat} className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-500 w-12">{STAT_NAMES[stat as keyof BaseStats]}</span>
                      <div className="flex-1 mx-3 flex items-center gap-2">
                        <span className="font-bold text-slate-400">{oldVal}</span>
                        <span className="text-slate-300">→</span>
                        <span className="font-black text-slate-700">{newVal}</span>
                      </div>
                      <span className={`font-black w-8 text-right ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-slate-300'}`}>
                        {diff > 0 ? `+${diff}` : diff < 0 ? diff : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={() => {
                setEvolveResult(null);
              }}
              className="w-full py-4 bg-emerald-500 text-white font-black rounded-xl shadow-lg hover:bg-emerald-600 transition-colors"
            >
              太棒了！
            </button>
          </div>
        </div>
      )}

      {isEvolving && evolveAnim && (
        <div className="fixed inset-0 bg-slate-900/90 z-[9999] flex items-center justify-center p-6">
          <div className="bg-slate-900 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col items-center">
            {/* Animated background glow */}
            <motion.div
              className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.3), transparent 70%)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.3), transparent 70%)' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.55, 0.25] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Stars / sparkles floating */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${15 + Math.random() * 70}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  y: [0, -30 - Math.random() * 20],
                }}
                transition={{
                  duration: 1.2 + Math.random() * 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}

            <div className="relative z-10 text-center">
              <motion.div
                className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em] mb-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                进化中
              </motion.div>
              <motion.div
                className="font-black text-lg text-white mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {evolveAnim.oldName} <span className="text-indigo-300 mx-1">→</span> {evolveAnim.newName}
              </motion.div>

              {/* Main evolution visual - Total ~5.0s timeline */}
              <div className="relative w-48 h-48 mx-auto mb-8">
                {/* Phase 1: Old Pokemon fades out (0~1.5s) opacity 1→0 */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: [1, 1, 0], scale: [1, 1.05, 1.2] }}
                  transition={{ duration: 1.5, times: [0, 0.6, 1.0], ease: 'easeInOut' }}
                >
                  <PokemonImage speciesId={evolveAnim.oldSpeciesId} alt="old" isShiny={pokemon.isShiny} className="w-36 h-36 object-contain drop-shadow-2xl brightness-75" />
                </motion.div>

                {/* Phase 2: Three white flashes (1.5~3.9s) with accelerating rhythm */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0] }}
                  transition={{ duration: 5.0, times: [0, 0.30, 0.32, 0.38, 0.50, 0.52, 0.58, 0.66, 0.68, 0.74, 1.0], ease: 'easeInOut' }}
                >
                  <motion.div
                    className="w-36 h-36 bg-white rounded-full shadow-[0_0_80px_rgba(255,255,255,0.9)]"
                    animate={{ scale: [0.8, 0.8, 1.3, 0.8, 0.8, 1.4, 0.8, 0.8, 1.5, 0.8, 0.8] }}
                    transition={{ duration: 5.0, times: [0, 0.30, 0.32, 0.38, 0.50, 0.52, 0.58, 0.66, 0.68, 0.74, 1.0], ease: 'easeInOut' }}
                  />
                </motion.div>

                {/* Phase 3: Morphing silhouette (2.4~3.5s) during flashes */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0.6, 0.8, 0.6, 0] }}
                  transition={{ duration: 5.0, times: [0, 0.48, 0.54, 0.62, 0.68, 0.76], ease: 'easeInOut' }}
                >
                  <motion.div
                    className="w-28 h-28 bg-gradient-to-b from-white via-indigo-100 to-white rounded-[50%] blur-sm shadow-2xl"
                    animate={{
                      scaleX: [1, 1, 1.5, 0.7, 1.3, 1],
                      scaleY: [1, 1, 0.6, 1.4, 0.8, 1],
                      borderRadius: ['50%', '50%', '40%', '50%', '45%', '50%'],
                    }}
                    transition={{ duration: 5.0, times: [0, 0.48, 0.54, 0.60, 0.66, 0.76], ease: 'easeInOut' }}
                  />
                </motion.div>

                {/* Phase 4: New Pokemon emerges (4.0s+) after all flashes */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.2, filter: 'brightness(3) blur(12px)' }}
                  animate={{
                    opacity: [0, 0, 0, 0.8, 1, 1],
                    scale: [0.2, 0.2, 0.4, 0.8, 1.1, 1],
                    filter: ['brightness(3) blur(12px)', 'brightness(3) blur(12px)', 'brightness(2) blur(6px)', 'brightness(1.3) blur(2px)', 'brightness(1.05) blur(0px)', 'brightness(1) blur(0px)'],
                  }}
                  transition={{ duration: 5.0, times: [0, 0.76, 0.80, 0.86, 0.92, 1.0], ease: 'easeOut' }}
                >
                  <PokemonImage speciesId={evolveAnim.newSpeciesId} alt="new" isShiny={pokemon.isShiny} className="w-36 h-36 object-contain drop-shadow-2xl" />
                </motion.div>

                {/* Burst ring at 4.0s when new Pokemon appears */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0.9, 0] }}
                  transition={{ duration: 5.0, times: [0, 0.76, 0.80, 0.92], ease: 'easeOut' }}
                >
                  <motion.div
                    className="w-16 h-16 border-2 border-white rounded-full"
                    animate={{ scale: [0.5, 0.5, 3.5, 4], opacity: [0, 0, 0.9, 0] }}
                    transition={{ duration: 5.0, times: [0, 0.76, 0.80, 0.92], ease: 'easeOut' }}
                  />
                </motion.div>
              </div>

              <motion.div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white font-black text-sm"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </motion.span>
                <span>光芒正在聚集…</span>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full font-bold text-sm z-[70]">
          {toast}
        </div>
      )}
    </div>
  );
}
