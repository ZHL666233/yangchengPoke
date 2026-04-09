import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Castle, Trees, CircleDollarSign } from 'lucide-react';
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

export default function MapPage() {
  const navigate = useNavigate();
  const { party, coins, dungeonBest } = useGameStore();

  useEffect(() => {
    if (party.length === 0) navigate('/', { replace: true });
  }, [party, navigate]);

  if (party.length === 0) return null;

  return (
    <div className="h-full w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col relative">
      <PageHeader
        title="冒险"
        hideBack
        right={
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-slate-200">
            <CircleDollarSign className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-black text-slate-800">{coins}</span>
          </div>
        }
      />

      <div className="px-6 pt-6 pb-2 flex justify-between items-center">
        <div className="text-xs font-bold text-slate-500">地图导航</div>
        <div className="text-[10px] font-bold text-slate-400">副本最高：{dungeonBest}层</div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Card
            title="野外"
            subtitle="随机遭遇，赚金币和经验"
            icon={Trees}
            tone="bg-emerald-50 border-emerald-200 text-emerald-950"
            onClick={() => navigate('/wild')}
            delay={0.1}
          />
          <Card
            title="副本"
            subtitle="层层挑战，奖励更丰厚"
            icon={Castle}
            tone="bg-indigo-50 border-indigo-200 text-indigo-950"
            onClick={() => navigate('/dungeon')}
            delay={0.15}
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}