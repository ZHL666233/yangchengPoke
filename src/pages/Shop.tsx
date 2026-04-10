import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleDollarSign, ShoppingBag } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import PageHeader from '@/components/PageHeader';
import { ITEMS, ItemId } from '@/types';
import ItemImage from '@/components/ItemImage';

type ShopCategory = 'feed' | 'play' | 'exp' | 'ball' | 'iv' | 'evolution';

const SHOP_CATEGORIES: { id: ShopCategory; name: string; items: ItemId[] }[] = [
  { id: 'feed', name: '喂食道具', items: ['berry', 'apple', 'sandwich', 'potion', 'pokeblock', 'vitamin', 'energy_powder'] as ItemId[] },
  { id: 'play', name: '玩耍道具', items: ['toy', 'ball', 'kite', 'frisbee', 'yarn', 'poffin'] as ItemId[] },
  { id: 'exp', name: '经验道具', items: ['candy', 'rare_candy'] as ItemId[] },
  { id: 'ball', name: '精灵球', items: ['pokeball', 'greatball', 'ultraball', 'masterball'] as ItemId[] },
  { id: 'iv', name: '个体值道具', items: ['hp_up', 'protein', 'iron', 'calcium', 'zinc', 'carbos'] as ItemId[] },
  { id: 'evolution', name: '进化道具', items: ['fire_stone', 'water_stone', 'thunder_stone', 'leaf_stone', 'moon_stone'] as ItemId[] },
];

export default function Shop() {
  const navigate = useNavigate();
  const { party, coins, inventory, spendCoins, addItem } = useGameStore();
  const [toast, setToast] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('feed');

  useEffect(() => {
    if (party.length === 0) navigate('/', { replace: true });
  }, [party, navigate]);

  const buy = (itemId: ItemId) => {
    const item = ITEMS[itemId];
    const ok = spendCoins(item.price);
    if (!ok) {
      setToast('金币不足');
      return;
    }
    addItem(itemId, 1);
    setToast(`获得 ${item.name} +1`);
  };

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1400);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (party.length === 0) return null;

  const currentItems = SHOP_CATEGORIES.find(c => c.id === activeCategory)?.items || [];

  return (
    <div className="h-full w-full bg-gradient-to-b from-amber-50 via-white to-white flex flex-col">
      <PageHeader
        title="商店"
        onBack={() => navigate('/map')}
        right={
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/80 border border-amber-200">
            <CircleDollarSign className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-black text-slate-900">{coins}</span>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="space-y-4">
          <div className="rounded-3xl border border-amber-200 bg-white/80 shadow-sm p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-700">推荐</div>
              <div className="text-lg font-black text-slate-900 mt-1">让伙伴状态更好</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">买了就能在养成屋或野外使用</div>
            </div>
            <div className="w-12 h-12 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-amber-700" />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 pb-1 pt-1">
            {SHOP_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 active:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {currentItems.map((itemId) => {
              const item = ITEMS[itemId];
              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-3xl border flex items-center justify-center ${item.tone}`}>
                      <ItemImage itemId={item.id} className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900">{item.name}</div>
                      <div className="text-xs font-semibold text-slate-500 mt-1">{item.description}</div>
                      <div className="text-[11px] font-bold text-slate-400 mt-1">
                        拥有：{inventory[item.id] ?? 0}
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => buy(item.id)}
                    className="shrink-0 px-4 py-3 rounded-2xl bg-amber-500 text-white font-black shadow-lg shadow-amber-200 hover:bg-amber-600 transition-colors"
                  >
                    {item.price} 金币
                  </motion.button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
