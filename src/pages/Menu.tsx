import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, FerrisWheel, BookHeart, Wrench, CircleDollarSign, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';

const Card = ({
  title,
  subtitle,
  icon: Icon,
  tone,
  onClick,
  delay,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: string;
  onClick: () => void;
  delay: number;
}) => {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={[
        'w-full rounded-3xl p-5 text-left border shadow-sm',
        'flex flex-col justify-between min-h-[150px]',
        tone,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-lg font-black">{title}</div>
          <div className="text-xs font-semibold opacity-80 leading-relaxed">{subtitle}</div>
        </div><div className="w-11 h-11 rounded-2xl bg-white/60 border border-white/50 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-4 text-[11px] font-bold opacity-70">点击进入</div>
    </motion.button>
  );
};

export default function Menu() {
  const navigate = useNavigate();
  const { coins, test_addLevel, test_addLevels, test_setLevel, test_evolveFirst, test_toggleShinyFirst, test_addCoins, test_addAllItems, test_resetCooldowns, test_healAll, test_addExp, lastSpinAt } = useGameStore();
  const [showDebug, setShowDebug] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const COOLDOWN_MS = 6 * 60 * 60 * 1000;
  const wheelRemaining = lastSpinAt ? lastSpinAt + COOLDOWN_MS - now : 0;
  const wheelReady = !lastSpinAt || wheelRemaining <= 0;

  return (
    <div className="h-full w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col relative">
      <PageHeader
        title="大菜单"
        hideBack
        right={
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-slate-200">
            <CircleDollarSign className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-black text-slate-800">{coins}</span>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Card
            title="商店"
            subtitle="买树果、糖果和玩具"
            icon={Store}
            tone="bg-amber-50 border-amber-200 text-amber-900"
            onClick={() => navigate('/shop')}
            delay={0.05}
          />
          <div className="relative">
            <Card
              title="幸运转盘"
              subtitle="抽奖得金币/道具/经验"
              icon={FerrisWheel}
              tone="bg-pink-50 border-pink-200 text-pink-950"
              onClick={() => navigate('/wheel')}
              delay={0.1}
            />
            {wheelReady && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse shadow-sm z-20 border-2 border-white" />
            )}
          </div>
          <Card
            title="宝可梦图鉴"
            subtitle="查看已收集的图鉴"
            icon={BookHeart}
            tone="bg-emerald-600 border-emerald-500 text-white"
            onClick={() => navigate('/pokedex')}
            delay={0.15}
          />
          <Card
            title="设置"
            subtitle="导出/读取存档备份"
            icon={Settings}
            tone="bg-slate-100 border-slate-200 text-slate-800"
            onClick={() => navigate('/settings')}
            delay={0.2}
          />
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => setShowDebug(true)}
          className="mt-6 w-full rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-black py-4 flex items-center justify-center gap-2 shadow-sm"
        >
          <Wrench className="w-5 h-5" />
          打开测试面板
        </motion.button>
      </div>

      <BottomNav />

      {/* Test/Debug UI Overlay */}
      <AnimatePresence>
        {showDebug && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6"
            onClick={() => setShowDebug(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative"
            >
              <button 
                onClick={() => setShowDebug(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-800">测试模式</h3>
                  <div className="text-sm font-bold text-slate-500">方便测试与调试的快捷功能</div>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={() => { test_addLevel(); setShowDebug(false); }} className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 transition-colors flex items-center justify-center gap-2">
                  <span>🔼 队伍首位升 1 级</span>
                </button>
                <button onClick={() => { test_addLevels(10); setShowDebug(false); }} className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 transition-colors flex items-center justify-center gap-2">
                  <span>⏫ 队伍首位升 10 级</span>
                </button>
                <button onClick={() => { test_setLevel(100); setShowDebug(false); }} className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 transition-colors flex items-center justify-center gap-2">
                  <span>🏁 队伍首位设为 Lv.100</span>
                </button>
                <button onClick={() => { test_addExp(1000); setShowDebug(false); }} className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 transition-colors flex items-center justify-center gap-2">
                  <span>⭐ 队伍首位加 1000 经验</span>
                </button>
                <button onClick={() => { test_evolveFirst(); setShowDebug(false); }} className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl font-bold text-indigo-700 transition-colors flex items-center justify-center gap-2">
                  <span>✨ 队伍首位立即进化（若满足条件）</span>
                </button>
                <button onClick={() => { test_toggleShinyFirst(); setShowDebug(false); }} className="w-full py-3 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-xl font-bold text-yellow-800 transition-colors flex items-center justify-center gap-2">
                  <span>🌟 队伍首位切换闪光</span>
                </button>
                <button onClick={() => { test_addCoins(); setShowDebug(false); }} className="w-full py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl font-bold text-amber-700 transition-colors flex items-center justify-center gap-2">
                  <span>💰 获得 9999 金币</span>
                </button>
                <button onClick={() => { test_addAllItems(); setShowDebug(false); }} className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold text-emerald-700 transition-colors flex items-center justify-center gap-2">
                  <span>🎒 获得全道具 ×99</span>
                </button>
                <button onClick={() => { test_healAll(); setShowDebug(false); }} className="w-full py-3 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-xl font-bold text-pink-700 transition-colors flex items-center justify-center gap-2">
                  <span>💖 全体宝可梦恢复状态 (HP/饱食/心情/PP)</span>
                </button>
                <button onClick={() => { test_resetCooldowns(); setShowDebug(false); }} className="w-full py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl font-bold text-blue-700 transition-colors flex items-center justify-center gap-2">
                  <span>⏱️ 重置幸运转盘冷却</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
