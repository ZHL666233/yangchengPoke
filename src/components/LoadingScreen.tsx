import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GAME_VERSION = 'v0.1.0 Demo';
const GAME_NAME = '养成宝可梦';
const QQ_NUMBER = '3222407954';

/**
 * 预加载资源列表：初始宝可梦(1,4,7) + 常用宝可梦(8-15) + 所有道具SVG
 */
const PRELOAD_IMAGES: string[] = [
  // 初始宝可梦 + 常用宝可梦（normal）
  ...[1, 4, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
    (id) => `pokemon/normal/${id}.png`
  ),
  // 所有道具
  'items/berry.svg', 'items/apple.svg', 'items/sandwich.svg',
  'items/candy.svg', 'items/toy.svg', 'items/ball.svg',
  'items/kite.svg', 'items/pokeball.svg', 'items/greatball.svg',
  'items/ultraball.svg', 'items/masterball.svg', 'items/potion.svg',
  'items/rare_candy.svg', 'items/pokeblock.svg', 'items/poffin.svg',
  'items/vitamin.svg', 'items/energy_powder.svg', 'items/frisbee.svg',
  'items/yarn.svg', 'items/premium_ball.svg', 'items/dive_ball.svg',
  'items/timer_ball.svg', 'items/repeat_ball.svg', 'items/hp_up.svg',
  'items/protein.svg', 'items/iron.svg', 'items/calcium.svg',
  'items/zinc.svg', 'items/carbos.svg', 'items/fire_stone.svg',
  'items/water_stone.svg', 'items/thunder_stone.svg', 'items/leaf_stone.svg',
  'items/moon_stone.svg',
];

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // 单张失败不影响整体
    img.src = src;
  });
}

const POKEBALL_PATH = 'M32 4C16.536 4 4 16.536 4 32s12.536 28 28 28 28-12.536 28-28S47.464 4 32 4zm0 24c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM6 32h52c0 14.359-11.641 26-26 26S6 46.359 6 32zm26-26c14.359 0 26 11.641 26 26H32V6z';

const POKEBALL_SVG = (
  <svg viewBox="0 0 64 64" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pb-top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF3B3B" />
        <stop offset="100%" stopColor="#E02020" />
      </linearGradient>
      <linearGradient id="pb-bottom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E8E8E8" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#pb-top)" stroke="#1a1a2e" strokeWidth="3" />
    <path d="M4 32 A28 28 0 0 0 60 32 Z" fill="url(#pb-bottom)" />
    <circle cx="32" cy="32" r="28" fill="none" stroke="#1a1a2e" strokeWidth="3" />
    <rect x="4" y="29" width="56" height="6" fill="#1a1a2e" rx="1" />
    <circle cx="32" cy="32" r="9" fill="#FFFFFF" stroke="#1a1a2e" strokeWidth="3" />
    <circle cx="32" cy="32" r="5" fill="#FFFFFF" stroke="#1a1a2e" strokeWidth="2" />
    <circle cx="32" cy="32" r="3" fill="none" stroke="#E02020" strokeWidth="1.5" />
  </svg>
);

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('正在准备...');
  const [fadeOut, setFadeOut] = useState(false);

  const startLoading = useCallback(async () => {
    const total = PRELOAD_IMAGES.length;
    let loaded = 0;

    // 并发预加载，限制同时加载数量
    const batchSize = 6;
    for (let i = 0; i < total; i += batchSize) {
      const batch = PRELOAD_IMAGES.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (src) => {
          await preloadImage(src);
          loaded++;
          setProgress(Math.round((loaded / total) * 100));
        })
      );

      // 更新状态文字
      if (progress < 30) setStatusText('加载精灵贴图中...');
      else if (progress < 70) setStatusText('加载道具资源中...');
      else if (progress < 95) setStatusText('即将完成...');
      else setStatusText('准备就绪！');
    }

    // 加载完成后等待一小段时间让动画播完
    await new Promise((r) => setTimeout(r, 400));
    setFadeOut(true);
    await new Promise((r) => setTimeout(r, 600));
    onComplete();
  }, [progress]);

  useEffect(() => {
    startLoading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {!fadeOut && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden"
        >
          {/* 背景装饰粒子 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
                initial={{
                  x: Math.random() * 400,
                  y: Math.random() * 800,
                  opacity: 0,
                }}
                animate={{
                  y: [null, -800],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          {/* 精灵球 Logo 动画 */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            className="w-24 h-24 mb-6 relative"
          >
            <motion.div
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {POKEBALL_SVG}
            </motion.div>
            {/* 光环 */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(16,185,129,0.2)',
                  '0 0 40px rgba(16,185,129,0.4)',
                  '0 0 20px rgba(16,185,129,0.2)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          {/* 游戏名称 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-3xl font-black text-white mb-1 tracking-wide"
          >
            {GAME_NAME}
          </motion.h1>

          {/* 版本号 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-2 mb-8"
          >
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-black">
              测试版 {GAME_VERSION}
            </span>
          </motion.div>

          {/* 进度条 */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="w-56 mb-3"
          >
            <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>

          {/* 进度文字 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-2 text-xs"
          >
            <span className="text-slate-400 font-semibold">{statusText}</span>
            <span className="text-emerald-400 font-black">{progress}%</span>
          </motion.div>

          {/* 底部信息 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 text-center space-y-2"
          >
            <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[11px] font-semibold">
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span>反馈 & 建议</span>
            </div>
            <div className="text-slate-400 text-sm font-black tracking-wider">
              QQ: {QQ_NUMBER}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
