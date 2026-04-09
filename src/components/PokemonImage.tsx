import { useState } from 'react';
import { motion } from 'framer-motion';
import type { MotionProps } from 'framer-motion';

type Props = {
  speciesId: number;
  alt: string;
  className?: string;
  isShiny?: boolean;
  animate?: MotionProps['animate'];
  transition?: MotionProps['transition'];
};

const getSrc = (speciesId: number, isShiny: boolean) => {
  const folder = isShiny ? '/pokemon/shiny' : '/pokemon/normal';
  return `${folder}/${speciesId}.png`;
};

export default function PokemonImage({ speciesId, alt, className, isShiny = false, animate, transition }: Props) {
  const src = getSrc(speciesId, isShiny);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={[
          'flex items-center justify-center rounded-3xl bg-gradient-to-b from-slate-100 to-slate-50',
          'border border-slate-200 text-slate-500 font-bold text-sm',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        图片加载失败
      </div>
    );
  }

  return (
    <motion.img
      key={`${speciesId}-${isShiny ? 's' : 'n'}`}
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      animate={animate}
      transition={transition}
      onError={() => setFailed(true)}
    />
  );
}
