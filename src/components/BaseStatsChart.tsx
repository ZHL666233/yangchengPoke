import type { BaseStats } from '@/types';

const statOrder: Array<{ key: keyof BaseStats; label: string; tone: string }> = [
  { key: 'hp', label: 'HP', tone: 'bg-rose-400' },
  { key: 'atk', label: '攻击', tone: 'bg-orange-400' },
  { key: 'def', label: '防御', tone: 'bg-amber-400' },
  { key: 'spa', label: '特攻', tone: 'bg-sky-400' },
  { key: 'spd', label: '特防', tone: 'bg-indigo-400' },
  { key: 'spe', label: '速度', tone: 'bg-emerald-400' },
];

export default function BaseStatsChart({ baseStats }: { baseStats: BaseStats }) {
  const max = 255;
  return (
    <div className="space-y-2">
      {statOrder.map(({ key, label, tone }) => {
        const v = baseStats[key];
        const pct = Math.max(0, Math.min(100, (v / max) * 100));
        return (
          <div key={key} className="flex items-center gap-2">
            <div className="w-10 text-[10px] font-black text-slate-500">{label}</div>
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className={[tone, 'h-full rounded-full'].join(' ')} style={{ width: `${pct}%` }} />
            </div>
            <div className="w-8 text-right text-[10px] font-black text-slate-700">{v}</div>
          </div>
        );
      })}
    </div>
  );
}

