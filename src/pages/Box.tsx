import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Search, Filter, SortAsc, SortDesc, Tent, Info, Trash2, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import PokemonImage from '@/components/PokemonImage';
import { getPokemonTypes } from '@/pokemonTypes';
import { AnimatePresence } from 'framer-motion';
import { STAT_NAMES, getNatureText, ABILITY_INFO, getBaseStats, canEvolve, SPECIES_INFO, BaseStats, isPerfectIv } from '@/types';
import TypeBadges from '@/components/TypeBadges';
import BaseStatsChart from '@/components/BaseStatsChart';

export default function BoxPage() {
  const { party, box, battleTeam, switchPokemon, toggleTeamMember, releasePokemon, evolvePokemon } = useGameStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [showEvolveConfirm, setShowEvolveConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
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

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('全部');
  const [filterShiny, setFilterShiny] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'level' | 'bst'>('level');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const allPokemons = useMemo(() => {
    return [...party, ...box];
  }, [party, box]);

  const allTypes = useMemo(() => {
    const types = new Set<string>();
    allPokemons.forEach(p => {
      getPokemonTypes(p.speciesId).forEach(t => types.add(t));
    });
    return ['全部', ...Array.from(types)];
  }, [allPokemons]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const isLastPokemon = party.length + box.length <= 1;

  const filteredAndSortedPokemons = useMemo(() => {
    let result = [...allPokemons];

    // Search Filter
    if (searchQuery) {
      result = result.filter(p => p.name.includes(searchQuery));
    }

    // Type Filter
    if (filterType !== '全部') {
      result = result.filter(p => getPokemonTypes(p.speciesId).includes(filterType));
    }

    // Shiny Filter
    if (filterShiny) {
      result = result.filter(p => p.isShiny);
    }

    // Sort
    result.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'level') {
        valA = a.level;
        valB = b.level;
      } else {
        valA = Object.values(a.baseStats).reduce((sum, val) => sum + val, 0);
        valB = Object.values(b.baseStats).reduce((sum, val) => sum + val, 0);
      }

      if (valA === valB) return 0;
      if (sortOrder === 'desc') return valA < valB ? 1 : -1;
      return valA > valB ? 1 : -1;
    });

    return result;
  }, [allPokemons, searchQuery, filterType, filterShiny, sortBy, sortOrder]);

  const handlePokemonClick = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
    }
  };

  const selectedPokemon = allPokemons.find(p => p.id === selectedId);
  const isInParty = party.some(p => p.id === selectedId);
  const isInTeam = battleTeam.includes(selectedId || '');
  const isWorking = !!selectedPokemon?.work;
  const isTraining = !!selectedPokemon?.train;

  const handleToggleParty = () => {
    if (!selectedId) return;
    if (isInParty) {
      switchPokemon(selectedId, null);
    } else {
      switchPokemon('', selectedId);
    }
    setSelectedId(null);
  };

  const handleToggleTeam = () => {
    if (!selectedId) return;
    toggleTeamMember(selectedId);
  };

  return (
    <div className="h-full w-full bg-slate-50 relative flex flex-col overflow-hidden">
      <div className="bg-slate-900 pt-12 pb-6 px-6 rounded-b-[2rem] shadow-sm relative z-10 text-white flex items-center justify-center shrink-0">
        <h1 className="text-xl font-black">宝可梦仓库</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 pb-56">
        <div>
          <div className="flex flex-col gap-3 mb-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            {/* Search */}
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-3 text-slate-400" />
              <input
                type="text"
                placeholder="搜索宝可梦..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-slate-700 rounded-xl pl-10 pr-4 py-2 outline-none border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-sm"
              />
            </div>

            {/* Filters and Sorts */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <div className="flex items-center gap-1 shrink-0 bg-slate-50 rounded-lg p-1 border border-slate-200">
                <Filter className="w-4 h-4 text-slate-400 ml-1" />
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none pr-2 py-1 appearance-none cursor-pointer"
                >
                  {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1 shrink-0 bg-slate-50 rounded-lg p-1 border border-slate-200">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'level' | 'bst')}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none pl-2 pr-1 py-1 appearance-none cursor-pointer"
                >
                  <option value="level">等级</option>
                  <option value="bst">种族值</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={() => setFilterShiny(!filterShiny)}
                className={`flex items-center gap-1 shrink-0 rounded-lg px-2 py-1.5 border text-xs font-bold transition-colors ${
                  filterShiny 
                    ? 'bg-amber-100 border-amber-300 text-amber-700' 
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                }`}
              >
                ✨ 闪光
              </button>
            </div>
          </div>

          <div className="text-xs font-black text-slate-400 mb-3 uppercase tracking-widest flex items-center justify-between">
            <span>所有宝可梦 ({filteredAndSortedPokemons.length})</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {filteredAndSortedPokemons.map((p) => {
              const isSelected = selectedId === p.id;
              const pIsWorking = !!p.work;
              const pIsTraining = !!p.train;
              const pIsInParty = party.some(x => x.id === p.id);
              const pIsInTeam = battleTeam.includes(p.id);
              const pCanEvo = !!canEvolve(p.speciesId, p.level);

              return (
                <motion.div
                  key={p.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePokemonClick(p.id)}
                  className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 relative shadow-sm transition-colors ${
                    isSelected ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                  } ${p.isShiny ? 'ring-2 ring-amber-300' : ''}`}
                >
                  <PokemonImage speciesId={p.speciesId} alt={p.name} isShiny={p.isShiny} className="w-12 h-12 object-contain" />
                  <div className="text-[10px] font-bold mt-1 text-slate-800 text-center truncate w-full flex items-center justify-center gap-0.5">
                    {p.name}
                    {p.isShiny && <span className="text-amber-500">✨</span>}
                    {isPerfectIv(p.ivs) && <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-1 py-px rounded border border-amber-200 ml-0.5">6V</span>}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400">Lv.{p.level}</div>
                  <TypeBadges speciesId={p.speciesId} size="xs" wrap={false} className="mt-1" />
                  
                  <div className="absolute top-1 flex flex-col gap-0.5 items-start left-1 right-1">
                    {pCanEvo && <div className="text-[8px] font-black text-blue-600 bg-blue-100 border border-blue-200 px-1 py-0.5 rounded shadow-sm w-fit animate-pulse flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />可进化</div>}
                    {pIsInParty && <div className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-1 py-0.5 rounded shadow-sm w-fit border border-emerald-200">培育中</div>}
                    {pIsInTeam && <div className="text-[8px] font-black text-blue-500 bg-blue-50 px-1 py-0.5 rounded shadow-sm w-fit border border-blue-200">出战中</div>}
                    {pIsWorking && <div className="text-[8px] font-black text-amber-500 bg-amber-50 px-1 py-0.5 rounded shadow-sm w-fit border border-amber-200">打工中</div>}
                    {pIsTraining && <div className="text-[8px] font-black text-purple-500 bg-purple-50 px-1 py-0.5 rounded shadow-sm w-fit border border-purple-200">特训中</div>}
                    {p.hp <= 0 && <div className="text-[8px] font-black text-red-500 bg-red-50 px-1 py-0.5 rounded shadow-sm w-fit border border-red-200">濒死</div>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons Fixed at Bottom above BottomNav */}
      <div className="absolute left-0 w-full bottom-[68px] bg-white border-t border-slate-200 p-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-50">
        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
          <button
            disabled={!selectedId || isWorking || isTraining || (!isInParty && party.length >= useGameStore.getState().unlockedRooms)}
            onClick={handleToggleParty}
            className={`col-span-1 py-3 rounded-xl font-black disabled:opacity-50 text-xs flex items-center justify-center gap-1 ${
              isInParty ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <Tent className="w-3.5 h-3.5" />
            {isInParty ? '移出' : '放入'}
          </button>
          <button
            disabled={!selectedId || isWorking || isTraining || (!isInTeam && battleTeam.length >= 6)}
            onClick={handleToggleTeam}
            className={`col-span-1 py-3 rounded-xl font-black disabled:opacity-50 text-xs flex items-center justify-center gap-1 ${
              isInTeam ? 'bg-red-100 text-red-600' : 'bg-blue-500 text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {isInTeam ? '下阵' : '出战'}
          </button>
          <button
            disabled={!selectedId}
            onClick={() => setShowDetailModal(true)}
            className="col-span-1 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-black disabled:opacity-50 text-xs flex items-center justify-center gap-1"
          >
            <Info className="w-3.5 h-3.5" /> 详情
          </button>
          <button
            disabled={!selectedId || isWorking || isTraining || isInTeam}
            onClick={() => setShowReleaseConfirm(true)}
            className="col-span-1 py-3 bg-slate-200 text-red-600 rounded-xl font-black disabled:opacity-50 text-xs flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> 放生
          </button>
        </div>
      </div>

      {/* Release Confirm Modal */}
      <AnimatePresence>
        {showReleaseConfirm && selectedPokemon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-6"
            onClick={() => setShowReleaseConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative text-center"
            >
              <h3 className="font-black text-xl text-slate-800 mb-2">确认放生？</h3>
              <p className="text-sm font-bold text-slate-500 mb-6">
                放生 {selectedPokemon.name} 将获得 500 金币。<br/>(此操作不可撤销)
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowReleaseConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    if (isLastPokemon) {
                      setToast('这是你最后一只宝可梦，无法放生！');
                      setShowReleaseConfirm(false);
                      return;
                    }
                    releasePokemon(selectedPokemon.id);
                    setSelectedId(null);
                    setShowReleaseConfirm(false);
                    setToast('已放生，获得 500 金币');
                  }}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"
                >
                  确认放生
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedPokemon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 z-[60] flex items-end sm:items-center justify-center sm:p-6"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md shadow-2xl relative flex flex-col h-[80vh] overflow-hidden"
            >
              <div className="bg-emerald-600 px-6 pt-6 pb-8 text-white relative rounded-b-[2rem] shadow-sm">
                <button onClick={() => setShowDetailModal(false)} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors z-20">
                  ✕
                </button>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h2 className="text-2xl font-black flex items-center gap-2">
                      {selectedPokemon.name}
                      {selectedPokemon.isShiny && <span className="text-amber-300">✨</span>}
                      {isPerfectIv(selectedPokemon.ivs) && <span className="text-xs font-black text-amber-300 bg-amber-200/50 px-1.5 py-0.5 rounded border border-amber-300/50 ml-1">6V</span>}
                    </h2>
                    <div className="text-sm font-bold opacity-90">Lv.{selectedPokemon.level}</div>
                    <TypeBadges speciesId={selectedPokemon.speciesId} size="xs" className="justify-start mt-1" />
                  </div>
                </div>
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-40 h-40">
                  <PokemonImage speciesId={selectedPokemon.speciesId} alt={selectedPokemon.name} isShiny={selectedPokemon.isShiny} className="w-full h-full object-contain drop-shadow-2xl" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pt-20 pb-6 space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-emerald-400 rounded-full"></span>
                    个体值 (IVs)
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selectedPokemon.ivs).map(([stat, val]) => (
                      <div key={stat} className={`rounded-xl p-2 border flex flex-col items-center ${val === 31 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                        <span className={`text-[10px] font-bold uppercase ${val === 31 ? 'text-amber-500' : 'text-slate-400'}`}>{STAT_NAMES[stat as keyof typeof STAT_NAMES]}</span>
                        <span className={`text-sm font-black ${val === 31 ? 'text-amber-600' : 'text-slate-700'}`}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-rose-400 rounded-full"></span>
                    种族值
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <BaseStatsChart baseStats={selectedPokemon.baseStats || getBaseStats(selectedPokemon.speciesId)} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-purple-400 rounded-full"></span>
                    努力值 (EVs)
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selectedPokemon.evs || {}).map(([stat, val]) => (
                      <div key={stat} className="bg-purple-50 rounded-xl p-2 border border-purple-100 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-purple-400 uppercase">{STAT_NAMES[stat as keyof typeof STAT_NAMES]}</span>
                        <span className="text-sm font-black text-purple-700">{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-right text-[10px] font-bold text-slate-400 mt-1">总和: {Object.values(selectedPokemon.evs || {}).reduce((a, b) => a + b, 0)}/600</div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-blue-400 rounded-full"></span>
                    能力值
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(selectedPokemon.stats || {}).map(([stat, val]) => (
                      <div key={stat} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 w-10">{STAT_NAMES[stat as keyof typeof STAT_NAMES]}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (val / 300) * 100)}%` }}
                            className="h-full bg-blue-400"
                          />
                        </div>
                        <span className="text-xs font-black text-slate-700 w-8 text-right">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">特性: {selectedPokemon.ability}</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500">
                      {ABILITY_INFO[selectedPokemon.ability] || '暂无说明'}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-800">性格</span>
                    <span className="text-sm font-bold text-emerald-600">{getNatureText(selectedPokemon.nature)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-amber-400 rounded-full"></span>
                    技能 ({selectedPokemon.skills.length}/4)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPokemon.skills.map(s => (
                      <div key={s.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <div className="font-bold text-slate-800 text-sm mb-1">{s.name}</div>
                        <div className="text-[10px] font-bold text-slate-500">PP {s.pp}/{s.maxPp} | 威力 {s.power}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-indigo-400 rounded-full"></span>
                    进化条件
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-sm font-bold text-slate-700">
                    {SPECIES_INFO[selectedPokemon.speciesId]?.evoTo ? (
                      <div className="flex items-center justify-between">
                        <span>进化为: <span className="text-emerald-600">{SPECIES_INFO[SPECIES_INFO[selectedPokemon.speciesId].evoTo!].name}</span></span>
                        <span className="text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">{SPECIES_INFO[selectedPokemon.speciesId].evoCondition}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">已达到最终形态</span>
                    )}
                  </div>
                </div>

                {!!canEvolve(selectedPokemon.speciesId, selectedPokemon.level) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isWorking || isTraining) return;
                      setShowDetailModal(false);
                      setShowEvolveConfirm(true);
                    }}
                    disabled={isWorking || isTraining}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" /> 可以进化了！
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evolution Confirm Modal */}
      {showEvolveConfirm && !isEvolving && selectedPokemon && (() => {
        const evoTarget = canEvolve(selectedPokemon.speciesId, selectedPokemon.level);
        if (!evoTarget) return null;
        return (
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
                你的 {selectedPokemon.name} 似乎要进化了！<br/>要让它现在进化吗？
              </p>
              {SPECIES_INFO[selectedPokemon.speciesId]?.evoTo && (
                <div className="flex justify-center items-center gap-6 mb-8 pointer-events-none">
                  <PokemonImage speciesId={selectedPokemon.speciesId} alt="current" isShiny={selectedPokemon.isShiny} className="w-16 h-16 object-contain" />
                  <span className="text-2xl text-slate-300">&#10132;</span>
                  <PokemonImage speciesId={SPECIES_INFO[selectedPokemon.speciesId].evoTo!} alt="next" isShiny={selectedPokemon.isShiny} className="w-16 h-16 object-contain grayscale opacity-50" />
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
                    const newSpeciesId = canEvolve(selectedPokemon.speciesId, selectedPokemon.level);
                    if (!newSpeciesId) { setShowEvolveConfirm(false); return; }
                    const newBaseStats = getBaseStats(newSpeciesId);
                    const currentBaseStats = selectedPokemon.baseStats || getBaseStats(selectedPokemon.speciesId);
                    const currentName = selectedPokemon.name;
                    const newName = SPECIES_INFO[newSpeciesId].name;
                    const targetId = selectedPokemon.id;
                    setShowEvolveConfirm(false);
                    setEvolveResult(null);
                    setEvolveAnim({ oldSpeciesId: selectedPokemon.speciesId, newSpeciesId, oldName: currentName, newName });
                    setIsEvolving(true);
                    window.setTimeout(() => {
                      evolvePokemon(targetId, newSpeciesId);
                      setIsEvolving(false);
                      setEvolveAnim(null);
                      setEvolveResult({ oldSpeciesId: selectedPokemon.speciesId, newSpeciesId, oldBaseStats: currentBaseStats, newBaseStats, oldName: currentName, newName });
                    }, 5200);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all pointer-events-auto cursor-pointer"
                >
                  开始进化！
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Evolution Result Modal */}
      {!isEvolving && evolveResult !== null && !showEvolveConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 z-[9999] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">&#127881;</div>
              <h3 className="font-black text-2xl text-slate-800 mb-1">进化成功！</h3>
              <p className="text-sm font-bold text-slate-500">
                恭喜！你的 {evolveResult.oldName} 进化成了 <span className="text-emerald-600">{evolveResult.newName}</span>！
              </p>
            </div>
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-200 to-yellow-400 rounded-full opacity-20 animate-pulse blur-xl" />
                <PokemonImage speciesId={evolveResult.newSpeciesId} alt="new" isShiny={selectedPokemon?.isShiny} className="w-full h-full object-contain relative z-10 drop-shadow-xl" />
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
                        <span className="text-slate-300">&#8594;</span>
                        <span className="font-black text-slate-700">{newBst}</span>
                      </div>
                      <span className={`font-black w-8 text-right ${diff > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>
                        {diff > 0 ? `+${diff}` : '-'}
                      </span>
                    </div>
                  );
                })()}
                {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).map(stat => {
                  const oldVal = evolveResult.oldBaseStats[stat];
                  const newVal = evolveResult.newBaseStats[stat];
                  const diff = newVal - oldVal;
                  return (
                    <div key={stat} className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-500 w-12">{STAT_NAMES[stat]}</span>
                      <div className="flex-1 mx-3 flex items-center gap-2">
                        <span className="font-bold text-slate-400">{oldVal}</span>
                        <span className="text-slate-300">&#8594;</span>
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
              onClick={() => setEvolveResult(null)}
              className="w-full py-4 bg-emerald-500 text-white font-black rounded-xl shadow-lg hover:bg-emerald-600 transition-colors"
            >
              太棒了！
            </button>
          </div>
        </div>
      )}

      {/* Evolution Animation */}
      {isEvolving && evolveAnim && selectedPokemon && (
        <div className="fixed inset-0 bg-slate-900/90 z-[9999] flex items-center justify-center p-6">
          <div className="bg-slate-900 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col items-center">
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
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{ left: `${15 + Math.random() * 70}%`, top: `${20 + Math.random() * 60}%` }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -30 - Math.random() * 20] }}
                transition={{ duration: 1.2 + Math.random() * 0.8, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
              />
            ))}
            <div className="relative z-10 text-center">
              <motion.div className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em] mb-1" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>进化中</motion.div>
              <motion.div className="font-black text-lg text-white mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                {evolveAnim.oldName} <span className="text-indigo-300 mx-1">&#8594;</span> {evolveAnim.newName}
              </motion.div>
              <div className="relative w-48 h-48 mx-auto mb-8">
                <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 1, scale: 1 }} animate={{ opacity: [1, 1, 0], scale: [1, 1.05, 1.2] }} transition={{ duration: 1.5, times: [0, 0.6, 1.0], ease: 'easeInOut' }}>
                  <PokemonImage speciesId={evolveAnim.oldSpeciesId} alt="old" isShiny={selectedPokemon.isShiny} className="w-36 h-36 object-contain drop-shadow-2xl brightness-75" />
                </motion.div>
                <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0] }} transition={{ duration: 5.0, times: [0, 0.30, 0.32, 0.38, 0.50, 0.52, 0.58, 0.66, 0.68, 0.74, 1.0], ease: 'easeInOut' }}>
                  <motion.div className="w-36 h-36 bg-white rounded-full shadow-[0_0_80px_rgba(255,255,255,0.9)]" animate={{ scale: [0.8, 0.8, 1.3, 0.8, 0.8, 1.4, 0.8, 0.8, 1.5, 0.8, 0.8] }} transition={{ duration: 5.0, times: [0, 0.30, 0.32, 0.38, 0.50, 0.52, 0.58, 0.66, 0.68, 0.74, 1.0], ease: 'easeInOut' }} />
                </motion.div>
                <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0.6, 0.8, 0.6, 0] }} transition={{ duration: 5.0, times: [0, 0.48, 0.54, 0.62, 0.68, 0.76], ease: 'easeInOut' }}>
                  <motion.div className="w-28 h-28 bg-gradient-to-b from-white via-indigo-100 to-white rounded-[50%] blur-sm shadow-2xl" animate={{ scaleX: [1, 1, 1.5, 0.7, 1.3, 1], scaleY: [1, 1, 0.6, 1.4, 0.8, 1], borderRadius: ['50%', '50%', '40%', '50%', '45%', '50%'] }} transition={{ duration: 5.0, times: [0, 0.48, 0.54, 0.60, 0.66, 0.76], ease: 'easeInOut' }} />
                </motion.div>
                <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0, scale: 0.2, filter: 'brightness(3) blur(12px)' }} animate={{ opacity: [0, 0, 0, 0.8, 1, 1], scale: [0.2, 0.2, 0.4, 0.8, 1.1, 1], filter: ['brightness(3) blur(12px)', 'brightness(3) blur(12px)', 'brightness(2) blur(6px)', 'brightness(1.3) blur(2px)', 'brightness(1.05) blur(0px)', 'brightness(1) blur(0px)'] }} transition={{ duration: 5.0, times: [0, 0.76, 0.80, 0.86, 0.92, 1.0], ease: 'easeOut' }}>
                  <PokemonImage speciesId={evolveAnim.newSpeciesId} alt="new" isShiny={selectedPokemon.isShiny} className="w-36 h-36 object-contain drop-shadow-2xl" />
                </motion.div>
                <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0.9, 0] }} transition={{ duration: 5.0, times: [0, 0.76, 0.80, 0.92], ease: 'easeOut' }}>
                  <motion.div className="w-16 h-16 border-2 border-white rounded-full" animate={{ scale: [0.5, 0.5, 3.5, 4], opacity: [0, 0, 0.9, 0] }} transition={{ duration: 5.0, times: [0, 0.76, 0.80, 0.92], ease: 'easeOut' }} />
                </motion.div>
              </div>
              <motion.div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white font-black text-sm" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}><Sparkles className="w-4 h-4 text-amber-300" /></motion.span>
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
