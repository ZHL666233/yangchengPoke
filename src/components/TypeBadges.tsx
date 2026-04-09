import { getPokemonTypes } from '@/pokemonTypes';

const typeTone: Record<string, string> = {
  一般: 'bg-slate-100 text-slate-700 border-slate-200',
  火: 'bg-orange-100 text-orange-800 border-orange-200',
  水: 'bg-sky-100 text-sky-800 border-sky-200',
  草: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  电: 'bg-yellow-100 text-yellow-900 border-yellow-200',
  冰: 'bg-cyan-100 text-cyan-900 border-cyan-200',
  毒: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  地面: 'bg-amber-100 text-amber-900 border-amber-200',
  飞行: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  超能力: 'bg-pink-100 text-pink-800 border-pink-200',
  虫: 'bg-lime-100 text-lime-800 border-lime-200',
  岩石: 'bg-stone-100 text-stone-700 border-stone-200',
  幽灵: 'bg-violet-100 text-violet-800 border-violet-200',
  龙: 'bg-blue-100 text-blue-900 border-blue-200',
  恶: 'bg-gray-100 text-gray-800 border-gray-300',
  钢: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  妖精: 'bg-rose-100 text-rose-700 border-rose-200',
  格斗: 'bg-red-100 text-red-800 border-red-200',
};

export default function TypeBadges({
  speciesId,
  size = 'sm',
  wrap = true,
  className,
}: {
  speciesId: number;
  size?: 'xs' | 'sm';
  wrap?: boolean;
  className?: string;
}) {
  const types = getPokemonTypes(speciesId);
  const base =
    size === 'xs'
      ? 'text-[9px] px-1.5 py-0.5 rounded-md'
      : 'text-[11px] px-2 py-0.5 rounded-lg';

  return (
    <div
      className={[
        'inline-flex items-center gap-1.5 min-h-[18px] relative z-10',
        wrap ? 'flex-wrap' : 'flex-nowrap',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {types.slice(0, 2).map((t) => (
        <span
          key={t}
          className={[base, 'inline-flex items-center font-black border leading-none shadow-sm', typeTone[t] || typeTone['一般']].join(' ')}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

