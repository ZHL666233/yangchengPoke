import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import PokemonImage from '@/components/PokemonImage';
import { SPECIES_INFO } from '@/types';
import TypeBadges from '@/components/TypeBadges';
import { Map, Tent, Shield, Box, ShoppingBag, Menu } from 'lucide-react';

const STARTERS = [1, 4, 7];

const GUIDE_STEPS = [
  {
    icon: Tent,
    title: '培育屋',
    desc: '你的宝可梦在这里休息、训练、打工和进化。合理安排它们的日程来提升实力。',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    icon: Map,
    title: '探索野外',
    desc: '派出宝可梦探索不同区域，遭遇野生宝可梦进行战斗和捕捉。击败首领可解锁新地图！',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  {
    icon: Shield,
    title: '组建队伍',
    desc: '在队伍页面管理出战宝可梦（最多6只）。合理安排首发顺序和队伍搭配。',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    icon: ShoppingBag,
    title: '商店购物',
    desc: '使用金币购买回复道具、精灵球、个体值提升道具等。探索和战斗可以获得金币。',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    icon: Menu,
    title: '更多功能',
    desc: '在大菜单中可以进入幸运转盘抽奖、查看宝可梦图鉴，还有副本挑战等你征服！',
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { party, adoptPokemon, gameStarted } = useGameStore();
  const [selectedStarter, setSelectedStarter] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  useEffect(() => {
    if (gameStarted) {
      navigate('/play', { replace: true });
    }
  }, [gameStarted, navigate]);

  // Check if guide has been shown before
  useEffect(() => {
    const guideShown = localStorage.getItem('guide_shown');
    if (guideShown) {
      setShowGuide(false);
    }
  }, []);

  if (gameStarted) return null;

  const handleAdopt = () => {
    if (selectedStarter) {
      adoptPokemon(selectedStarter, SPECIES_INFO[selectedStarter]?.name || '宝可梦');
      localStorage.setItem('guide_shown', 'true');
      navigate('/play');
    }
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-10 z-10"
      >
        <h1 className="text-4xl font-black text-slate-800 mb-2">欢迎来到宝可梦</h1>
        <p className="text-slate-500 font-bold">请选择你的初始伙伴</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-sm z-10">
        {STARTERS.map((id, index) => (
          <motion.button
            key={id}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedStarter(id)}
            className={`bg-white rounded-3xl p-4 flex items-center gap-4 shadow-sm border-2 transition-colors ${selectedStarter === id ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100' : 'border-transparent hover:border-slate-200'}`}
          >
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center p-2">
              <PokemonImage speciesId={id} alt={SPECIES_INFO[id]?.name} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xl font-black text-slate-800">{SPECIES_INFO[id]?.name}</h3>
              <TypeBadges speciesId={id} className="justify-start mt-1" />
            </div>
          </motion.button>
        ))}
      </div>

      <motion.button
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        disabled={!selectedStarter}
        onClick={handleAdopt}
        className="mt-10 w-full max-w-sm bg-emerald-500 text-white font-black text-xl py-5 rounded-3xl shadow-xl shadow-emerald-200 hover:bg-emerald-600 disabled:opacity-50 disabled:shadow-none transition-all z-10"
      >
        就决定是你了！
      </motion.button>

      {/* New Player Guide Button */}
      {!selectedStarter && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => { setShowGuide(true); setGuideStep(0); }}
          className="mt-4 w-full max-w-sm bg-indigo-50 text-indigo-700 font-bold py-3 rounded-2xl border border-indigo-200 hover:bg-indigo-100 transition-colors z-10 text-sm"
        >
          查看新手引导
        </motion.button>
      )}

      {/* Version & Feedback */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 z-10 text-center space-y-1"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-700">
          <span className="text-xs font-black">测试版 v0.1.0 Demo</span>
        </div>
        <p className="text-[11px] font-semibold text-slate-400">
          问题反馈 & 建议 QQ：<span className="text-indigo-500 font-bold">3222407954</span>
        </p>
      </motion.div>

      {/* Guide Modal */}
      {showGuide && (() => {
        const step = GUIDE_STEPS[guideStep];
        if (!step) return null;
        const StepIcon = step.icon;
        return (
          <div
            className="fixed inset-0 bg-slate-900/70 z-[80] flex items-center justify-center p-6"
            onClick={() => { setShowGuide(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">{guideStep + 1} / {GUIDE_STEPS.length}</span>
                <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">跳过</button>
              </div>
              
              {/* Progress dots */}
              <div className="flex gap-1.5 mb-4">
                {GUIDE_STEPS.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= guideStep ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                ))}
              </div>

              <div className={`w-14 h-14 rounded-2xl ${step.bg} border ${step.border} flex items-center justify-center mb-4`}>
                <StepIcon className={`w-7 h-7 ${step.color}`} />
              </div>
              <h3 className="font-black text-xl text-slate-800 mb-2">{step.title}</h3>
              <p className="text-sm font-semibold text-slate-500 leading-relaxed mb-6">{step.desc}</p>

              <div className="flex gap-3">
                {guideStep > 0 && (
                  <button
                    onClick={() => setGuideStep(guideStep - 1)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    上一步
                  </button>
                )}
                {guideStep < GUIDE_STEPS.length - 1 ? (
                  <button
                    onClick={() => setGuideStep(guideStep + 1)}
                    className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                  >
                    下一步
                  </button>
                ) : (
                  <button
                    onClick={() => setShowGuide(false)}
                    className="flex-1 py-3 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200"
                  >
                    开始冒险！
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
