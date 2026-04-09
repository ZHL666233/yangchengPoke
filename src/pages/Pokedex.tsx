import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { SPECIES_INFO } from '@/types';
import PokemonImage from '@/components/PokemonImage';
import TypeBadges from '@/components/TypeBadges';

const ALL_SPECIES_IDS = Object.keys(SPECIES_INFO).map(Number).sort((a, b) => a - b);

export default function Pokedex() {
  const navigate = useNavigate();
  const { pokedex } = useGameStore();

  const totalCaught = Object.values(pokedex).filter(p => p.caught).length;
  const totalSeen = Object.values(pokedex).filter(p => p.seen).length;

  return (
    <div className="h-full w-full bg-slate-50 relative overflow-hidden flex flex-col">
      <div className="bg-emerald-600 pt-12 pb-6 px-6 rounded-b-[2rem] shadow-sm relative z-10">
        <div className="flex items-center justify-between text-white mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black">宝可梦图鉴</h1>
          <div className="w-10"></div>
        </div>
        
        <div className="flex gap-4 items-center bg-white/20 p-4 rounded-2xl border border-white/20 text-white">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">已捕捉</span>
            <span className="text-2xl font-black">{totalCaught}</span>
          </div>
          <div className="w-px h-10 bg-white/30"></div>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">已遇见</span>
            <span className="text-2xl font-black">{totalSeen}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-3 pb-12">
          {ALL_SPECIES_IDS.map(id => {
            const entry = pokedex[id];
            const info = SPECIES_INFO[id];
            const isSeen = entry?.seen;
            const isCaught = entry?.caught;

            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 relative shadow-sm ${
                  isCaught ? 'bg-white border-emerald-200' : isSeen ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'
                }`}
              >
                <div className="absolute top-1.5 left-2 text-[10px] font-bold text-slate-400">
                  #{id.toString().padStart(3, '0')}
                </div>
                
                {isCaught && (
                  <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-emerald-500 rounded-full border border-white shadow-sm flex items-center justify-center">
                    <div className="w-full h-px bg-white/80 absolute top-1/2"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                )}

                {isSeen ? (
                  <>
                    <PokemonImage speciesId={id} alt={info.name} className={`w-12 h-12 object-contain mt-2 ${!isCaught && 'brightness-0 opacity-40'}`} />
                    <div className={`text-[10px] font-bold mt-1 text-center ${isCaught ? 'text-slate-800' : 'text-slate-400'}`}>
                      {info.name}
                    </div>
                    <TypeBadges speciesId={id} size="xs" className="mt-1" />
                  </>
                ) : (
                  <div className="text-2xl font-black text-slate-300 mt-2">?</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
