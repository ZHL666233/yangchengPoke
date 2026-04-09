import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleDollarSign, HeartPulse, Minus, Plus, ChevronUp, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import PokemonImage from '@/components/PokemonImage';
import { EXP_TO_NEXT_LEVEL, canEvolve, SPECIES_INFO, ABILITY_INFO, getNatureText, getBaseStats, STAT_NAMES, BaseStats, isPerfectIv } from '@/types';
import TypeBadges from '@/components/TypeBadges';
import BaseStatsChart from '@/components/BaseStatsChart';

export default function TeamPage() {
  const navigate = useNavigate();
  const { party, box, battleTeam, coins, healTeam, toggleTeamMember, moveTeamMemberUp, evolvePokemon } = useGameStore();
  const [toast, setToast] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
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

  useEffect(() => {
    if (party.length === 0) navigate('/', { replace: true });
  }, [party, navigate]);

  const teamPokemons = battleTeam.map(id => party.find(p => p.id === id) || box.find(p => p.id === id)).filter(Boolean) as typeof party;

  const handleHeal = () => {
    const cost = battleTeam.length * 20;
    if (coins < cost) {
      setToast(`金币不足！需要 ${cost} 金币`);
      return;
    }
    const ok = healTeam();
    if (ok) {
      setToast('全队状态已恢复！');
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1500);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <div className="h-full w-full bg-gradient-to-b from-blue-50 via-white to-white flex flex-col relative">
      <PageHeader
        title="队伍"
        hideBack
        right={
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/80 border border-blue-200">
            <CircleDollarSign className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-black text-slate-800">{coins}</span>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold text-slate-500">出战宝可梦 ({battleTeam.length}/6)</div>
          <button 
            onClick={handleHeal}
            disabled={battleTeam.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            <HeartPulse className="w-3.5 h-3.5" />
            一键恢复 (花费 {battleTeam.length * 20} <CircleDollarSign className="w-3 h-3 inline" />)
          </button>
        </div>

        <div className="space-y-3">
          {teamPokemons.map((pokemon, idx) => {
            const expNeeded = EXP_TO_NEXT_LEVEL(pokemon.level);
            const canEvo = !!canEvolve(pokemon.speciesId, pokemon.level);
            return (
              <motion.div
                key={pokemon.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => { setSelectedDetailId(pokemon.id); setShowStats(true); }}
                className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden cursor-pointer hover:border-emerald-300 transition-colors"
              >
                {idx === 0 && (
                  <div className="absolute -top-6 -left-6 w-16 h-16 bg-amber-100 rounded-full blur-xl"></div>
                )}
                
                {canEvo && (
                  <div className="absolute top-2 right-2 text-[10px] font-black text-blue-600 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded shadow-sm z-20 animate-pulse flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" />可进化
                  </div>
                )}

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 relative">
                    <PokemonImage speciesId={pokemon.speciesId} alt={pokemon.name} isShiny={pokemon.isShiny} className="w-12 h-12 object-contain" />
                    {idx === 0 && (
                      <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm border border-amber-500">
                        首发
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 relative z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-slate-800 text-lg">{pokemon.name}</span>
                    {isPerfectIv(pokemon.ivs) && <span className="text-[10px] font-black text-amber-500 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">6V</span>}
                    <span className="text-xs font-bold text-slate-500">Lv.{pokemon.level}</span>
                  </div>
                  <TypeBadges speciesId={pokemon.speciesId} className="justify-start" />
                  
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-emerald-600 w-6">HP</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-emerald-500"
                          animate={{ width: `${(pokemon.hp / pokemon.maxHp) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 w-12 text-right">{Math.floor(pokemon.hp)}/{pokemon.maxHp}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-blue-600 w-6">EXP</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-blue-400"
                          animate={{ width: `${(pokemon.exp / expNeeded) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 w-12 text-right">{pokemon.exp}/{expNeeded}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 z-10 shrink-0">
                  {idx > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); moveTeamMemberUp(idx); }}
                      className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      title="上移"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleTeamMember(pokemon.id); }}
                    className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                    title="移出队伍"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {battleTeam.length < 6 && (
            <button
              onClick={() => navigate('/box')}
              className="w-full bg-emerald-50 rounded-3xl py-6 border-2 border-emerald-200 border-dashed shadow-sm flex flex-col items-center justify-center hover:bg-emerald-100 transition-colors"
            >
              <Plus className="w-8 h-8 text-emerald-400 mb-2" />
              <div className="text-sm font-bold text-emerald-600">从仓库选择出战宝可梦</div>
              <div className="text-xs font-semibold text-emerald-500 mt-1">还可以上阵 {6 - battleTeam.length} 只</div>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-24 left-1/2 bg-slate-800 text-white px-4 py-2 rounded-full font-bold text-sm z-50 shadow-lg whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />

      {/* Stats Detail Modal - matches Play.tsx breeding house detail panel */}
      <AnimatePresence>
        {showStats && (() => {
          const detailPokemon = teamPokemons.find(p => p.id === selectedDetailId);
          if (!detailPokemon) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-6"
              onClick={() => { setShowStats(false); setSelectedDetailId(null); }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl relative flex flex-col max-h-[85vh]"
              >
                <button 
                  onClick={() => { setShowStats(false); setSelectedDetailId(null); }}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors z-10"
                >
                  ✕
                </button>
                
                <div className="overflow-y-auto p-6 no-scrollbar flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <PokemonImage speciesId={detailPokemon.speciesId} alt="pokemon" isShiny={detailPokemon.isShiny} className="w-12 h-12 object-contain" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-slate-800 flex items-center gap-1">
                        {detailPokemon.name}
                        {detailPokemon.isShiny && <span className="text-amber-500">✨</span>}
                      </h3>
                      <div className="text-sm font-bold text-slate-500">Lv.{detailPokemon.level} | 性格: <span className="text-emerald-600">{detailPokemon.nature ? getNatureText(detailPokemon.nature) : '未知'}</span>
                      {isPerfectIv(detailPokemon.ivs) && <span className="text-xs font-black text-amber-500 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 ml-2">6V</span>}
                      </div>
                      <TypeBadges speciesId={detailPokemon.speciesId} size="xs" className="justify-start mt-1" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">特性</h4>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{detailPokemon.ability}</span>
                          {detailPokemon.isHiddenAbility && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">隐藏特性</span>}
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">{ABILITY_INFO[detailPokemon.ability] || '暂无说明'}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">种族值</h4>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <BaseStatsChart baseStats={detailPokemon.baseStats || getBaseStats(detailPokemon.speciesId)} />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">能力值 (种族值+个体值) <span className="text-blue-500 ml-1">努力值</span></h4>
                      <div className="grid grid-cols-2 gap-3">
                        {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).map(stat => (
                          <div key={stat} className="bg-slate-50 rounded-xl p-3 border border-slate-100 relative">
                            <div className="text-[10px] font-bold text-slate-400 mb-1">{STAT_NAMES[stat]}</div>
                            <div className="font-black text-slate-700">{detailPokemon.stats?.[stat] ?? 0} <span className="text-[10px] font-semibold text-emerald-500 ml-1">({detailPokemon.baseStats?.[stat] ?? 0}+{detailPokemon.ivs?.[stat] ?? 0})</span></div>
                            <div className="absolute top-2 right-2 text-[10px] font-bold text-blue-500">+{detailPokemon.evs?.[stat] ?? 0}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">技能</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {detailPokemon.skills.map(s => (
                          <div key={s.id} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-slate-800 text-xs">{s.name}</span>
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1 rounded">{s.type}</span>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-bold text-slate-500">威力 {s.power}</span>
                              <span className={`text-[10px] font-bold ${s.pp === 0 ? 'text-red-500' : 'text-emerald-600'}`}>PP {s.pp}/{s.maxPp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">进化条件</h4>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-sm font-bold text-slate-700">
                        {SPECIES_INFO[detailPokemon.speciesId]?.evoTo ? (
                          <div className="flex items-center justify-between">
                            <span>进化为: <span className="text-emerald-600">{SPECIES_INFO[SPECIES_INFO[detailPokemon.speciesId].evoTo!].name}</span></span>
                            <span className="text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">{SPECIES_INFO[detailPokemon.speciesId].evoCondition}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">已达到最终形态</span>
                        )}
                      </div>
                    </div>

                    {!!canEvolve(detailPokemon.speciesId, detailPokemon.level) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowStats(false);
                          setSelectedDetailId(null);
                          setShowEvolveConfirm(true);
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Sparkles className="w-4 h-4" /> 可以进化了！
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Evolution Confirm Modal */}
      {showEvolveConfirm && !isEvolving && (() => {
        const evoTarget = teamPokemons.find(p => canEvolve(p.speciesId, p.level));
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
                你的 {evoTarget.name} 似乎要进化了！<br/>要让它现在进化吗？
              </p>
              {SPECIES_INFO[evoTarget.speciesId]?.evoTo && (
                <div className="flex justify-center items-center gap-6 mb-8 pointer-events-none">
                  <PokemonImage speciesId={evoTarget.speciesId} alt="current" isShiny={evoTarget.isShiny} className="w-16 h-16 object-contain" />
                  <span className="text-2xl text-slate-300">&#10132;</span>
                  <PokemonImage speciesId={SPECIES_INFO[evoTarget.speciesId].evoTo!} alt="next" isShiny={evoTarget.isShiny} className="w-16 h-16 object-contain grayscale opacity-50" />
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
                    const newSpeciesId = canEvolve(evoTarget.speciesId, evoTarget.level);
                    if (!newSpeciesId) { setShowEvolveConfirm(false); return; }
                    const newBaseStats = getBaseStats(newSpeciesId);
                    const currentBaseStats = evoTarget.baseStats || getBaseStats(evoTarget.speciesId);
                    const targetId = evoTarget.id;
                    setShowEvolveConfirm(false);
                    setEvolveResult(null);
                    setEvolveAnim({ oldSpeciesId: evoTarget.speciesId, newSpeciesId, oldName: evoTarget.name, newName: SPECIES_INFO[newSpeciesId].name });
                    setIsEvolving(true);
                    window.setTimeout(() => {
                      evolvePokemon(targetId, newSpeciesId);
                      setIsEvolving(false);
                      setEvolveAnim(null);
                      setEvolveResult({ oldSpeciesId: evoTarget.speciesId, newSpeciesId, oldBaseStats: currentBaseStats, newBaseStats, oldName: evoTarget.name, newName: SPECIES_INFO[newSpeciesId].name });
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
                <PokemonImage speciesId={evolveResult.newSpeciesId} alt="new" className="w-full h-full object-contain relative z-10 drop-shadow-xl" />
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
      {isEvolving && evolveAnim && (() => {
        const evoTarget = teamPokemons.find(p => canEvolve(p.speciesId, p.level));
        return (
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
                    <PokemonImage speciesId={evolveAnim.oldSpeciesId} alt="old" isShiny={evoTarget?.isShiny} className="w-36 h-36 object-contain drop-shadow-2xl brightness-75" />
                  </motion.div>
                  <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0] }} transition={{ duration: 5.0, times: [0, 0.30, 0.32, 0.38, 0.50, 0.52, 0.58, 0.66, 0.68, 0.74, 1.0], ease: 'easeInOut' }}>
                    <motion.div className="w-36 h-36 bg-white rounded-full shadow-[0_0_80px_rgba(255,255,255,0.9)]" animate={{ scale: [0.8, 0.8, 1.3, 0.8, 0.8, 1.4, 0.8, 0.8, 1.5, 0.8, 0.8] }} transition={{ duration: 5.0, times: [0, 0.30, 0.32, 0.38, 0.50, 0.52, 0.58, 0.66, 0.68, 0.74, 1.0], ease: 'easeInOut' }} />
                  </motion.div>
                  <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0, scale: 0.2, filter: 'brightness(3) blur(12px)' }} animate={{ opacity: [0, 0, 0, 0.8, 1, 1], scale: [0.2, 0.2, 0.4, 0.8, 1.1, 1], filter: ['brightness(3) blur(12px)', 'brightness(3) blur(12px)', 'brightness(2) blur(6px)', 'brightness(1.3) blur(2px)', 'brightness(1.05) blur(0px)', 'brightness(1) blur(0px)'] }} transition={{ duration: 5.0, times: [0, 0.76, 0.80, 0.86, 0.92, 1.0], ease: 'easeOut' }}>
                    <PokemonImage speciesId={evolveAnim.newSpeciesId} alt="new" isShiny={evoTarget?.isShiny} className="w-36 h-36 object-contain drop-shadow-2xl" />
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
        );
      })()}
    </div>
  );
}
