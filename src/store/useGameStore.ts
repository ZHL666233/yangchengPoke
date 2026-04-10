import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Pokemon, MAX_HUNGER, MAX_HAPPINESS, EXP_TO_NEXT_LEVEL, Inventory, ItemId, ITEMS, emptyInventory, 
  getInitialSkills, checkNewSkills, generateRandomIvs, generateRandomNature, getBaseStats, calculateStats,
  generateAbility, emptyEvs, PokedexData, BaseStats, canEvolve, SPECIES_INFO, getAllLearnedSkills, Skill
} from '../types';

interface GameState {
  party: Pokemon[];
  unlockedRooms: number;
  box: Pokemon[];
  battleTeam: string[]; // IDs of Pokemon in the battle team
  coins: number;
  inventory: Inventory;
  pokedex: PokedexData;
  lastSpinAt: number | null;
  dungeonFloor: number;
  dungeonBest: number;
  unlockedMaps: string[];
  currentMapId: string;
  defeatedBosses: string[];
  gameStarted: boolean;
  adoptPokemon: (speciesId: number, name: string) => void;
  catchPokemon: (pokemon: Pokemon) => void;
  markSeen: (speciesId: number) => void;
  switchPokemon: (idInParty: string, idInBox: string | null) => void;
  toggleTeamMember: (id: string) => void;
  unlockRoom: () => boolean;
  feed: (id: string) => void;
  play: (id: string) => void;
  work: (id: string, jobName: string, durationMs: number, reward: number, itemChance?: number, hungerCost?: number, happinessCost?: number) => void;
  finishWork: (id: string) => void;
  train: (id: string, intensityName: string, durationMs: number, evTotal: number, hungerCost?: number, happinessCost?: number) => void;
  finishTrain: (id: string) => void;
  checkStatus: () => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addItem: (itemId: ItemId, amount: number) => void;
  consumeItem: (itemId: ItemId, targetId?: string) => boolean;
  gainExp: (amount: number, targetId?: string) => void;
  changeStats: (delta: { hunger?: number; happiness?: number; hp?: number }, targetId?: string) => void;
  gainRandomEv: (targetId: string, amount?: number) => void;
  restorePp: () => void;
  healTeam: () => boolean;
  restoreTeamHunger: () => boolean;
  restoreTeamHappiness: () => boolean;
  consumeSkillPp: (skillId: string, targetId: string) => boolean;
  setLastSpinAt: (timestamp: number) => void;
  setDungeonFloor: (floor: number) => void;
  setDungeonBest: (floor: number) => void;
  dungeonClaimedFloors: number[];
  claimDungeonFloorReward: (floor: number) => boolean;
  useIvItem: (itemId: string, targetId: string) => boolean;
  setCurrentMap: (mapId: string) => void;
  unlockMap: (mapId: string) => void;
  defeatBoss: (mapId: string) => void;
  releasePokemon: (id: string) => void;
  moveTeamMemberUp: (index: number) => void;
  evolvePokemon: (id: string, newSpeciesId: number) => void;
  toggleShiny: (id: string) => void;
  setSkills: (targetId: string, newSkills: Skill[]) => void;
  autoFillSkills: () => void;
  // Test Mode Actions
  test_addLevel: () => void;
  test_addLevels: (amount: number) => void;
  test_setLevel: (level: number) => void;
  test_evolveFirst: () => void;
  test_toggleShinyFirst: () => void;
  test_addCoins: () => void;
  test_addAllItems: () => void;
  test_resetCooldowns: () => void;
  test_healAll: () => void;
  test_addExp: (amount: number) => void;
}

const applyExp = (pokemon: Pokemon, expGain: number): Pokemon => {
  let newExp = pokemon.exp + expGain;
  let newLevel = pokemon.level;
  let newSpeciesId = pokemon.speciesId;

  let newSkills = pokemon.skills || getInitialSkills(pokemon.speciesId);
  let allLearned = checkNewSkills(newSpeciesId, newLevel, newSkills);

  let expNeeded = EXP_TO_NEXT_LEVEL(newLevel);
  while (newExp >= expNeeded && newLevel < 100) {
    newExp -= expNeeded;
    newLevel += 1;
    expNeeded = EXP_TO_NEXT_LEVEL(newLevel);
    allLearned = checkNewSkills(newSpeciesId, newLevel, allLearned);
  }

  // equipped skills: keep the first 4 from allLearned that were already equipped, plus new ones if slots available
  const equippedIds = new Set(newSkills.map(s => s.id));
  let equipped: Skill[] = newSkills.filter(s => equippedIds.has(s.id));
  for (const s of allLearned) {
    if (equipped.length >= 4) break;
    if (!equipped.find(e => e.id === s.id)) {
      equipped.push(s);
    }
  }
  equipped = equipped.slice(0, 4);

  // Update base stats
  const newBaseStats = getBaseStats(newSpeciesId);
  const newStats = calculateStats(newBaseStats, pokemon.ivs, pokemon.evs || emptyEvs(), pokemon.nature, newLevel, pokemon.isShiny);

  const resultHp = pokemon.hp <= 0
    ? 0
    : Math.min(Math.max(pokemon.hp, 0) + (newStats.hp - pokemon.maxHp), newStats.hp);
  console.log('[applyExp]', pokemon.name, 'hp:', pokemon.hp, 'maxHp:', pokemon.maxHp, '→ hp:', resultHp, 'newMaxHp:', newStats.hp, 'level:', pokemon.level, '→', newLevel, '【store HP after update will be:', resultHp, '】');
  return {
    ...pokemon,
    exp: newExp,
    level: newLevel,
    hp: resultHp,
    maxHp: newStats.hp,
    baseStats: newBaseStats,
    stats: newStats,
    skills: equipped,
    learnableSkills: allLearned,
    speciesId: newSpeciesId,
    lastInteraction: Date.now(),
  };
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      const updatePokemon = (id: string, updater: (p: Pokemon) => Pokemon) => {
        const state = get();
        const partyIdx = state.party.findIndex(p => p.id === id);
        if (partyIdx >= 0) {
          const newParty = [...state.party];
          newParty[partyIdx] = updater(newParty[partyIdx]);
          return { party: newParty };
        }
        const boxIdx = state.box.findIndex(p => p.id === id);
        if (boxIdx >= 0) {
          const newBox = [...state.box];
          newBox[boxIdx] = updater(newBox[boxIdx]);
          return { box: newBox };
        }
        return {};
      };

      return {
      party: [],
      unlockedRooms: 1,
      box: [],
      battleTeam: [],
      coins: 0,
      inventory: emptyInventory(),
      pokedex: {},
      lastSpinAt: null,
      dungeonFloor: 1,
      dungeonBest: 1,
      dungeonClaimedFloors: [],
      unlockedMaps: ['map1'],
      currentMapId: 'map1',
      defeatedBosses: [],
      gameStarted: false,

      adoptPokemon: (speciesId, name) => {
        const level = 5;
        const nature = generateRandomNature();
        const ivs = generateRandomIvs();
        const evs = emptyEvs();
        const abilityInfo = generateAbility(speciesId);
        const baseStats = getBaseStats(speciesId);
        const stats = calculateStats(baseStats, ivs, evs, nature, level);
        
        const initialId = Date.now().toString();

        set((state) => ({
          party: [{
            id: initialId,
            speciesId,
            name,
            level,
            exp: 0,
            hunger: 80,
            happiness: 80,
            hp: stats.hp,
            maxHp: stats.hp,
            nature,
            ivs,
            evs,
            ability: abilityInfo.ability,
            isHiddenAbility: abilityInfo.isHidden,
            baseStats,
            stats,
            skills: getInitialSkills(speciesId),
            lastInteraction: Date.now(),
          }],
          unlockedRooms: 1,
          box: [],
          battleTeam: [initialId],
          coins: 200,
          inventory: emptyInventory(),
          pokedex: {
            ...state.pokedex,
            [speciesId]: { seen: true, caught: true },
          },
          lastSpinAt: null,
          dungeonFloor: 1,
          dungeonBest: 1,
          dungeonClaimedFloors: [],
          unlockedMaps: ['map1'],
          currentMapId: 'map1',
          defeatedBosses: [],
          gameStarted: true,
        }));
      },

      catchPokemon: (caught) => {
        set((state) => {
          if (state.party.length < state.unlockedRooms) {
            return {
              party: [...state.party, caught],
              pokedex: {
                ...state.pokedex,
                [caught.speciesId]: { seen: true, caught: true },
              },
            };
          }
          return { 
            box: [...(state.box || []), caught],
            pokedex: {
              ...state.pokedex,
              [caught.speciesId]: { seen: true, caught: true },
            },
          };
        });
      },

      markSeen: (speciesId) => {
        set((state) => {
          if (state.pokedex?.[speciesId]?.seen) return state;
          return {
            pokedex: {
              ...state.pokedex,
              [speciesId]: { caught: false, ...state.pokedex?.[speciesId], seen: true },
            },
          };
        });
      },

      switchPokemon: (idInParty, idInBox) => {
        set((state) => {
          const party = [...state.party];
          const box = [...state.box];
          
          const partyIdx = party.findIndex(p => p.id === idInParty);
          const boxIdx = idInBox ? box.findIndex(p => p.id === idInBox) : -1;
          
          if (partyIdx === -1 && boxIdx !== -1 && party.length < state.unlockedRooms) {
            party.push(box[boxIdx]);
            box.splice(boxIdx, 1);
          } else if (partyIdx !== -1 && boxIdx !== -1) {
            const temp = party[partyIdx];
            party[partyIdx] = box[boxIdx];
            box[boxIdx] = temp;
          } else if (partyIdx !== -1 && idInBox === null) {
            box.push(party[partyIdx]);
            party.splice(partyIdx, 1);
          }
          
          return { party, box };
        });
      },

      toggleTeamMember: (id) => {
        set((state) => {
          if (state.battleTeam.includes(id)) {
            return { battleTeam: state.battleTeam.filter(x => x !== id) };
          } else {
            if (state.battleTeam.length >= 6) return state;
            return { battleTeam: [...state.battleTeam, id] };
          }
        });
      },

      unlockRoom: () => {
        let ok = false;
        set((state) => {
          const cost = state.unlockedRooms * 1000;
          if (state.coins < cost || state.unlockedRooms >= 20) return state;
          ok = true;
          return { coins: state.coins - cost, unlockedRooms: state.unlockedRooms + 1 };
        });
        return ok;
      },

      feed: (id) => {
        set(() => updatePokemon(id, p => ({
          ...p,
          hunger: Math.min(p.hunger + 20, MAX_HUNGER),
          happiness: Math.min(p.happiness + 5, MAX_HAPPINESS),
          lastInteraction: Date.now(),
        })));
      },

      play: (id) => {
        set(() => updatePokemon(id, p => ({
          ...p,
          happiness: Math.min(p.happiness + 20, MAX_HAPPINESS),
          hunger: Math.max(p.hunger - 10, 0),
          lastInteraction: Date.now(),
        })));
      },

      work: (id, jobName, durationMs, reward, itemChance = 0, hungerCost = 20, happinessCost = 20) => {
        set((state) => {
          const p = state.party.find(x => x.id === id) || state.box.find(x => x.id === id);
          if (!p || p.hunger < hungerCost || p.happiness < happinessCost || p.work || p.train) return state;
          
          return updatePokemon(id, x => ({
            ...x,
            hunger: Math.max(x.hunger - hungerCost, 0),
            happiness: Math.max(x.happiness - happinessCost, 0),
            lastInteraction: Date.now(),
            work: {
              jobName,
              endTime: Date.now() + durationMs,
              reward,
              itemChance,
            }
          }));
        });
      },

      finishWork: (id) => {
        set((state) => {
          const p = state.party.find(x => x.id === id) || state.box.find(x => x.id === id);
          if (!p || !p.work || Date.now() < p.work.endTime) return state;
          
          const reward = p.work.reward;
          const itemChance = p.work.itemChance || 0;
          
          const res = updatePokemon(id, x => {
            const newP = { ...x };
            delete newP.work;
            return newP;
          });
          
          const newState = { ...state, ...res, coins: state.coins + reward };
          
          if (itemChance > 0 && Math.random() < itemChance) {
            const dropTable: ItemId[] = ['berry', 'candy', 'toy', 'pokeball', 'greatball'];
            const item = dropTable[Math.floor(Math.random() * dropTable.length)];
            newState.inventory = { ...state.inventory };
            newState.inventory[item] = (newState.inventory[item] || 0) + 1;
          }
          
          return newState;
        });
      },

      train: (id, intensityName, durationMs, evTotal, hungerCost = 20, happinessCost = 10) => {
        set((state) => {
          const p = state.party.find(x => x.id === id) || state.box.find(x => x.id === id);
          if (!p || p.hunger < hungerCost || p.happiness < happinessCost || p.work || p.train) return state;
          
          return updatePokemon(id, x => ({
            ...x,
            hunger: Math.max(x.hunger - hungerCost, 0),
            happiness: Math.max(x.happiness - happinessCost, 0),
            lastInteraction: Date.now(),
            train: {
              intensityName,
              endTime: Date.now() + durationMs,
              evTotal,
            }
          }));
        });
      },

      finishTrain: (id) => {
        set((state) => {
          const p = state.party.find(x => x.id === id) || state.box.find(x => x.id === id);
          if (!p || !p.train || Date.now() < p.train.endTime) return state;
          
          const newEvs = { ...p.evs };
          let remainingEvs = p.train.evTotal;
          const statKeys: (keyof BaseStats)[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
          
          while (remainingEvs > 0) {
            const totalEv = Object.values(newEvs).reduce((a, b) => a + b, 0);
            if (totalEv >= 600) break;

            const validKeys = statKeys.filter(k => newEvs[k] < 100);
            if (validKeys.length === 0) break;

            const key = validKeys[Math.floor(Math.random() * validKeys.length)];
            newEvs[key] += 1;
            remainingEvs--;
          }

          const newStats = calculateStats(p.baseStats, p.ivs, newEvs, p.nature, p.level);
          const hpDiff = newStats.hp - (p.stats?.hp || newStats.hp);

          return updatePokemon(id, x => {
            const newP = { ...x };
            delete newP.train;
            return {
              ...newP,
              evs: newEvs,
              stats: newStats,
              maxHp: newStats.hp,
              hp: Math.min(newStats.hp, x.hp <= 0 ? 0 : x.hp + hpDiff)
            };
          });
        });
      },

      // Called periodically or on load to decrease stats over time
      checkStatus: () => {
        set((state) => {
          const now = Date.now();
          const newParty = state.party.map(p => {
            const hoursPassed = (now - p.lastInteraction) / (1000 * 60 * 60);
            if (hoursPassed < 1) return p;
            const hungerDrop = Math.floor(hoursPassed * 10);
            const happinessDrop = Math.floor(hoursPassed * 5);

            // 培育屋中的宝可梦（不在打工/训练）缓慢回复饱食度和心情
            if (!p.work && !p.train) {
              const hungerRecovery = Math.floor(hoursPassed * 3);
              const happinessRecovery = Math.floor(hoursPassed * 2);
              const netHungerChange = hungerDrop - hungerRecovery;
              const netHappinessChange = happinessDrop - happinessRecovery;
              return {
                ...p,
                hunger: Math.max(0, Math.min(MAX_HUNGER, p.hunger - netHungerChange)),
                happiness: Math.max(0, Math.min(MAX_HAPPINESS, p.happiness - netHappinessChange)),
                lastInteraction: now,
              };
            }

            return {
              ...p,
              hunger: Math.max(p.hunger - hungerDrop, 0),
              happiness: Math.max(p.happiness - happinessDrop, 0),
              lastInteraction: now,
            };
          });
          const newBox = state.box.map(p => {
            const hoursPassed = (now - p.lastInteraction) / (1000 * 60 * 60);
            if (hoursPassed < 1) return p;
            const hungerDrop = Math.floor(hoursPassed * 10);
            const happinessDrop = Math.floor(hoursPassed * 5);
            return {
              ...p,
              hunger: Math.max(p.hunger - hungerDrop, 0),
              happiness: Math.max(p.happiness - happinessDrop, 0),
              lastInteraction: now,
            };
          });
          return { party: newParty, box: newBox };
        });
      },

      addCoins: (amount) => {
        set((state) => ({ coins: Math.max(0, state.coins + amount) }));
      },

      spendCoins: (amount) => {
        let ok = false;
        set((state) => {
          if (state.coins < amount) return state;
          ok = true;
          return { coins: state.coins - amount };
        });
        return ok;
      },

      addItem: (itemId, amount) => {
        set((state) => ({
          inventory: {
            ...state.inventory,
            [itemId]: Math.max(0, (state.inventory[itemId] ?? 0) + amount),
          },
        }));
      },

      consumeItem: (itemId, targetId) => {
        const item = ITEMS[itemId];
        if (!item) return false;
        let ok = false;
        set((state) => {
          const count = state.inventory[itemId] ?? 0;
          if (count <= 0) return state;

          if (targetId) {
            ok = true;
            const res = updatePokemon(targetId, (p) => applyExp(
              {
                ...p,
                hunger: Math.min(MAX_HUNGER, Math.max(0, p.hunger + (item.effect.hunger ?? 0))),
                happiness: Math.min(MAX_HAPPINESS, Math.max(0, p.happiness + (item.effect.happiness ?? 0))),
              },
              item.effect.exp ?? 0
            ));
            return { ...res, inventory: { ...state.inventory, [itemId]: count - 1 } };
          }
          
          ok = true;
          return { inventory: { ...state.inventory, [itemId]: count - 1 } };
        });
        return ok;
      },

      gainExp: (amount, targetId) => {
        set((state) => {
          if (!targetId && state.party.length > 0) {
            targetId = state.party[0].id;
          }
          if (!targetId) return state;
          console.log('[gainExp] called for', targetId, 'amount:', amount, 'current hp:', state.party.find(p => p.id === targetId)?.hp ?? 'not in party');
          return updatePokemon(targetId, p => applyExp(p, amount));
        });
      },

      changeStats: (delta, targetId) => {
        set((state) => {
          if (!targetId && state.party.length > 0) {
            targetId = state.party[0].id;
          }
          if (!targetId) return state;
          return updatePokemon(targetId, p => {
            const newHp = delta.hp !== undefined ? Math.min(p.maxHp, Math.max(0, Math.floor(p.hp + delta.hp))) : p.hp;
            console.log('[changeStats]', targetId, 'hp delta:', delta.hp, 'from:', p.hp, '→', newHp, '【STORE UPDATE】');
            return {
              ...p,
              hp: newHp,
              hunger: delta.hunger !== undefined ? Math.min(MAX_HUNGER, Math.max(0, p.hunger + delta.hunger)) : p.hunger,
              happiness: delta.happiness !== undefined ? Math.min(MAX_HAPPINESS, Math.max(0, p.happiness + delta.happiness)) : p.happiness,
              lastInteraction: Date.now(),
            };
          });
        });
      },

      gainRandomEv: (targetId, amount = 1) => {
        set((state) => {
          const p = state.party.find((x) => x.id === targetId) || state.box.find((x) => x.id === targetId);
          if (!p) return state;

          const statKeys: (keyof BaseStats)[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

          let newEvs = { ...(p.evs || emptyEvs()) };
          let remaining = amount;
          while (remaining > 0) {
            const total = Object.values(newEvs).reduce((a, b) => a + b, 0);
            if (total >= 600) break;
            const valid = statKeys.filter((k) => newEvs[k] < 100);
            if (valid.length === 0) break;
            const key = valid[Math.floor(Math.random() * valid.length)];
            newEvs[key] += 1;
            remaining -= 1;
          }

          const baseStats = p.baseStats || getBaseStats(p.speciesId);
          const newStats = calculateStats(baseStats, p.ivs, newEvs, p.nature, p.level, p.isShiny);

          const res = updatePokemon(targetId, (x) => ({
            ...x,
            evs: newEvs,
            stats: newStats,
            baseStats,
            hp: Math.min(x.hp <= 0 ? 0 : Math.max(x.hp, 0) + (newStats.hp - x.maxHp), newStats.hp),
            maxHp: newStats.hp,
          }));

          return { ...state, ...res };
        });
      },

      restorePp: () => {
        set((state) => {
          const newParty = state.party.map(p => ({
            ...p,
            skills: (p.skills || getInitialSkills(p.speciesId)).map(s => ({ ...s, pp: s.maxPp }))
          }));
          const newBox = state.box.map(p => ({
            ...p,
            skills: (p.skills || getInitialSkills(p.speciesId)).map(s => ({ ...s, pp: s.maxPp }))
          }));
          return { party: newParty, box: newBox };
        });
      },

      healTeam: () => {
        let ok = false;
        let healedCount = 0;
        set((state) => {
          const allPokemon = [...state.party, ...state.box];
          const teamIds = state.battleTeam;

          // 计算实际需要恢复的精灵数量
          const needHealIds = teamIds.filter(id => {
            const p = allPokemon.find(x => x.id === id);
            if (!p) return false;
            if (p.hp < p.maxHp) return true;
            const skills = p.skills || getInitialSkills(p.speciesId);
            return skills.some(s => s.pp < s.maxPp);
          });

          if (needHealIds.length === 0) return state;

          const cost = needHealIds.length * 30;
          if (state.coins < cost) return state;

          ok = true;
          healedCount = needHealIds.length;
          const newParty = state.party.map(p => {
            if (needHealIds.includes(p.id)) {
              return { ...p, hp: p.maxHp, skills: (p.skills || getInitialSkills(p.speciesId)).map(s => ({ ...s, pp: s.maxPp })) };
            }
            return p;
          });
          const newBox = state.box.map(p => {
            if (needHealIds.includes(p.id)) {
              return { ...p, hp: p.maxHp, skills: (p.skills || getInitialSkills(p.speciesId)).map(s => ({ ...s, pp: s.maxPp })) };
            }
            return p;
          });
          
          return { party: newParty, box: newBox, coins: state.coins - cost };
        });
        return ok;
      },

      restoreTeamHunger: () => {
        let ok = false;
        set((state) => {
          const allPokemon = [...state.party, ...state.box];
          const teamIds = state.battleTeam;

          // 只对实际需要恢复饱食度的精灵收费
          const needRestoreIds = teamIds.filter(id => {
            const p = allPokemon.find(x => x.id === id);
            return p && p.hunger < MAX_HUNGER;
          });

          if (needRestoreIds.length === 0) return state;

          const cost = needRestoreIds.length * 50;
          if (state.coins < cost) return state;

          ok = true;
          const newParty = state.party.map(p => {
            if (needRestoreIds.includes(p.id)) {
              return { ...p, hunger: MAX_HUNGER };
            }
            return p;
          });
          const newBox = state.box.map(p => {
            if (needRestoreIds.includes(p.id)) {
              return { ...p, hunger: MAX_HUNGER };
            }
            return p;
          });
          return { party: newParty, box: newBox, coins: state.coins - cost };
        });
        return ok;
      },

      restoreTeamHappiness: () => {
        let ok = false;
        set((state) => {
          const allPokemon = [...state.party, ...state.box];
          const teamIds = state.battleTeam;

          // 只对实际需要恢复心情的精灵收费
          const needRestoreIds = teamIds.filter(id => {
            const p = allPokemon.find(x => x.id === id);
            return p && p.happiness < MAX_HAPPINESS;
          });

          if (needRestoreIds.length === 0) return state;

          const cost = needRestoreIds.length * 50;
          if (state.coins < cost) return state;

          ok = true;
          const newParty = state.party.map(p => {
            if (needRestoreIds.includes(p.id)) {
              return { ...p, happiness: MAX_HAPPINESS };
            }
            return p;
          });
          const newBox = state.box.map(p => {
            if (needRestoreIds.includes(p.id)) {
              return { ...p, happiness: MAX_HAPPINESS };
            }
            return p;
          });
          return { party: newParty, box: newBox, coins: state.coins - cost };
        });
        return ok;
      },

      consumeSkillPp: (skillId, targetId) => {
        const state = get();
        let ok = false;
        
        const newParty = state.party.map(p => {
          if (p.id !== targetId) return p;
          const skills = p.skills || getInitialSkills(p.speciesId);
          const idx = skills.findIndex(s => s.id === skillId);
          if (idx === -1 || skills[idx].pp <= 0) return p;

          ok = true;
          const newSkills = [...skills];
          newSkills[idx] = { ...newSkills[idx], pp: newSkills[idx].pp - 1 };
          return { ...p, skills: newSkills };
        });

        const newBox = state.box.map(p => {
          if (p.id !== targetId) return p;
          const skills = p.skills || getInitialSkills(p.speciesId);
          const idx = skills.findIndex(s => s.id === skillId);
          if (idx === -1 || skills[idx].pp <= 0) return p;

          ok = true;
          const newSkills = [...skills];
          newSkills[idx] = { ...newSkills[idx], pp: newSkills[idx].pp - 1 };
          return { ...p, skills: newSkills };
        });

        if (ok) {
          set({ party: newParty, box: newBox });
        }
        return ok;
      },

      setLastSpinAt: (timestamp) => set({ lastSpinAt: timestamp }),
      setDungeonFloor: (floor) => set({ dungeonFloor: floor }),
      setDungeonBest: (floor) => set({ dungeonBest: floor }),
      claimDungeonFloorReward: (floor) => {
        let ok = false;
        set((state) => {
          if (state.dungeonClaimedFloors.includes(floor)) return state;
          ok = true;
          return { dungeonClaimedFloors: [...state.dungeonClaimedFloors, floor] };
        });
        return ok;
      },
      useIvItem: (itemId, targetId) => {
        let ok = false;
        const ivMap: Record<string, 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe'> = {
          hp_up: 'hp',
          protein: 'atk',
          iron: 'def',
          calcium: 'spa',
          zinc: 'spd',
          carbos: 'spe',
        };
        const stat = ivMap[itemId];
        if (!stat) return false;
        
        set((state) => {
          // Check if item exists in inventory
          if ((state.inventory[itemId as keyof typeof state.inventory] || 0) <= 0) return state;
          
          // Find the pokemon
          const partyIdx = state.party.findIndex(p => p.id === targetId);
          const boxIdx = partyIdx < 0 ? state.box.findIndex(p => p.id === targetId) : -1;
          const list = partyIdx >= 0 ? 'party' : boxIdx >= 0 ? 'box' : null;
          const idx = partyIdx >= 0 ? partyIdx : boxIdx;
          
          if (list === null || idx === -1) return state;
          
          const pokemon = list === 'party' ? state.party[idx] : state.box[idx];
          const currentIv = pokemon.ivs?.[stat] ?? 0;
          
          if (currentIv >= 31) return state; // Already maxed
          
          const newIv = Math.min(31, currentIv + 5);
          const newIvs = { ...pokemon.ivs, [stat]: newIv };
          
          // Recalculate stats
          const baseStats = pokemon.baseStats || getBaseStats(pokemon.speciesId);
          const newStats = calculateStats(baseStats, newIvs, pokemon.evs || emptyEvs(), pokemon.nature, pokemon.level, pokemon.isShiny);
          
          // Update maxHp if HP changed (dead pokemon stays dead)
          const hpDiff = newStats.hp - (pokemon.stats?.hp ?? 0);
          const newHp = pokemon.hp <= 0 ? 0 : Math.max(0, pokemon.hp) + hpDiff;
          
          const updatedPokemon = {
            ...pokemon,
            ivs: newIvs,
            stats: newStats,
            maxHp: newStats.hp,
            hp: Math.min(newHp, newStats.hp),
          };
          
          ok = true;
          const newInventory = { ...state.inventory, [itemId]: (state.inventory[itemId as keyof typeof state.inventory] || 0) - 1 };
          
          if (list === 'party') {
            const newParty = [...state.party];
            newParty[idx] = updatedPokemon;
            return { party: newParty, inventory: newInventory };
          } else {
            const newBox = [...state.box];
            newBox[idx] = updatedPokemon;
            return { box: newBox, inventory: newInventory };
          }
        });
        return ok;
      },
      
      setCurrentMap: (mapId) => set({ currentMapId: mapId }),
      unlockMap: (mapId) => set((state) => ({ 
        unlockedMaps: state.unlockedMaps.includes(mapId) ? state.unlockedMaps : [...state.unlockedMaps, mapId] 
      })),
      defeatBoss: (mapId) => set((state) => ({ 
        defeatedBosses: state.defeatedBosses.includes(mapId) ? state.defeatedBosses : [...state.defeatedBosses, mapId] 
      })),

      releasePokemon: (id) => set((state) => {
        // 不允许释放最后一只宝可梦
        if (state.party.length + state.box.length <= 1) return state;
        
        const partyIdx = state.party.findIndex(p => p.id === id);
        const boxIdx = state.box.findIndex(p => p.id === id);
        
        if (partyIdx >= 0) {
          const newParty = [...state.party];
          newParty.splice(partyIdx, 1);
          return {
            party: newParty,
            battleTeam: state.battleTeam.filter(tId => tId !== id),
            coins: state.coins + 500
          };
        }
        
        if (boxIdx >= 0) {
          const newBox = [...state.box];
          newBox.splice(boxIdx, 1);
          return {
            box: newBox,
            battleTeam: state.battleTeam.filter(tId => tId !== id),
            coins: state.coins + 500
          };
        }
        
        return state;
      }),

      moveTeamMemberUp: (index) => set((state) => {
        if (index <= 0 || index >= state.battleTeam.length) return state;
        const newTeam = [...state.battleTeam];
        const temp = newTeam[index - 1];
        newTeam[index - 1] = newTeam[index];
        newTeam[index] = temp;
        return { battleTeam: newTeam };
      }),

      evolvePokemon: (id, newSpeciesId) => {
        try {
          const state = get();
          let updated = false;
          
          const updateFn = (p: Pokemon) => {
            if (p.id === id) {
              updated = true;
              const newBaseStats = getBaseStats(newSpeciesId);
              const newStats = calculateStats(newBaseStats, p.ivs, p.evs || emptyEvs(), p.nature, p.level, p.isShiny);
              const abilityInfo = generateAbility(newSpeciesId);

              return {
                ...p,
                speciesId: newSpeciesId,
                name: SPECIES_INFO[newSpeciesId]?.name || p.name,
                hp: Math.min(p.hp <= 0 ? 0 : Math.max(p.hp, 0) + (newStats.hp - p.maxHp), newStats.hp),                maxHp: newStats.hp,
                baseStats: newBaseStats,
                stats: newStats,
                ability: abilityInfo.ability,
                isHiddenAbility: abilityInfo.isHidden,
              };
            }
            return p;
          };

          const newParty = state.party.map(updateFn);
          const newBox = state.box.map(updateFn);

          if (!updated) {
            console.error('[Store] Evolution failed: Pokemon not found in party or box with id:', id);
            return;
          }

          const prev = state.pokedex?.[newSpeciesId];
          const newPokedex = {
            ...(state.pokedex || {}),
            [newSpeciesId]: {
              ...(prev || { seen: false, caught: false }),
              seen: true,
              caught: true,
            },
          };

          set({ party: newParty, box: newBox, pokedex: newPokedex });
        } catch (error) {
          console.error('[Store] Fatal error during evolvePokemon:', error);
        }
      },

      toggleShiny: (id) => {
        set(() =>
          updatePokemon(id, (p) => {
            const isShiny = !p.isShiny;
            const baseStats = p.baseStats || getBaseStats(p.speciesId);
            const newStats = calculateStats(baseStats, p.ivs, p.evs || emptyEvs(), p.nature, p.level, isShiny);
            return {
              ...p,
              isShiny,
              hp: Math.min(p.hp <= 0 ? 0 : Math.max(p.hp, 0) + (newStats.hp - p.maxHp), newStats.hp),
              maxHp: newStats.hp,
              baseStats,
              stats: newStats,
            };
          })
        );
      },

      setSkills: (targetId, newSkills) => {
        set(() => updatePokemon(targetId, (p) => ({ ...p, skills: newSkills })));
      },

      // 自动为所有宝可梦填补技能到4个
      autoFillSkills: () => {
        set((state) => {
          const fillPkmn = (p: Pokemon): Pokemon => {
            if (p.skills.length >= 4) return p;
            const allLearned = checkNewSkills(p.speciesId, p.level, p.skills);
            const equippedIds = new Set(p.skills.map(s => s.id));
            const equipped: Skill[] = [...p.skills];
            for (const s of allLearned) {
              if (equipped.length >= 4) break;
              if (!equippedIds.has(s.id)) {
                equipped.push({ ...s, pp: s.maxPp });
                equippedIds.add(s.id);
              }
            }
            return { ...p, skills: equipped.slice(0, 4), learnableSkills: allLearned };
          };
          return {
            party: state.party.map(fillPkmn),
            box: state.box.map(fillPkmn),
          };
        });
      },

      // Test Mode Actions
      test_addLevel: () => {
        set((state) => {
          if (state.battleTeam.length === 0) return state;
          const targetId = state.battleTeam[0];
          return updatePokemon(targetId, (p) => {
            if (p.level >= 100) return p;
            // 传入足够升恰好一级的经验：剩余所需经验
            const expNeeded = EXP_TO_NEXT_LEVEL(p.level);
            const expToLevel = expNeeded - p.exp;
            return applyExp(p, expToLevel);
          });
        });
      },
      test_addLevels: (amount) => {
        set((state) => {
          if (state.battleTeam.length === 0) return state;
          const targetId = state.battleTeam[0];
          return updatePokemon(targetId, (p) => {
            const fakeExp = amount * (p.level + 1) * 50; // enough exp to level up `amount` times
            return applyExp(p, fakeExp);
          });
        });
      },
      test_setLevel: (level) => {
        set((state) => {
          if (state.battleTeam.length === 0) return state;
          const targetId = state.battleTeam[0];
          return updatePokemon(targetId, (p) => {
            // Use applyExp with huge exp to reach target level, then set directly
            const newLevel = Math.max(1, Math.min(100, level));
            const allLearned = checkNewSkills(p.speciesId, newLevel, p.skills || getInitialSkills(p.speciesId));
            const newBaseStats = getBaseStats(p.speciesId);
            const newStats = calculateStats(newBaseStats, p.ivs, p.evs || emptyEvs(), p.nature, newLevel, p.isShiny);
            return {
              ...p,
              exp: 0,
              level: newLevel,
              hp: newStats.hp,
              maxHp: newStats.hp,
              baseStats: newBaseStats,
              stats: newStats,
              skills: allLearned.slice(0, 4),
              learnableSkills: allLearned,
            };
          });
        });
      },
      test_evolveFirst: () => {
        const state = get();
        if (state.battleTeam.length === 0) return;
        const targetId = state.battleTeam[0];
        const p = state.party.find(x => x.id === targetId) || state.box.find(x => x.id === targetId);
        if (!p) return;
        const newSpeciesId = canEvolve(p.speciesId, p.level);
        if (!newSpeciesId) return;
        get().evolvePokemon(p.id, newSpeciesId);
      },
      test_toggleShinyFirst: () => {
        set((state) => {
          if (state.battleTeam.length === 0) return state;
          const targetId = state.battleTeam[0];
          return updatePokemon(targetId, (p) => {
            const isShiny = !p.isShiny;
            const newBaseStats = getBaseStats(p.speciesId);
            const newStats = calculateStats(newBaseStats, p.ivs, p.evs || emptyEvs(), p.nature, p.level, isShiny);
            return {
              ...p,
              isShiny,
              hp: Math.min(p.hp <= 0 ? 0 : Math.max(p.hp, 0) + (newStats.hp - p.maxHp), newStats.hp),
              maxHp: newStats.hp,
              baseStats: newBaseStats,
              stats: newStats,
            };
          });
        });
      },
      test_addCoins: () => {
        set((state) => ({ coins: state.coins + 9999 }));
      },
      test_addAllItems: () => {
        set((state) => {
          const newInv = { ...state.inventory };
          Object.keys(ITEMS).forEach((k) => {
            newInv[k as ItemId] = (newInv[k as ItemId] || 0) + 99;
          });
          return { inventory: newInv };
        });
      },
      test_resetCooldowns: () => {
        set({ lastSpinAt: 0 }); // Reset spin wheel timer
      },
      test_healAll: () => {
        set((state) => {
          const newParty = state.party.map(p => ({
            ...p,
            hp: p.maxHp,
            hunger: 100,
            happiness: 100,
            work: undefined,
            skills: (p.skills || getInitialSkills(p.speciesId)).map(s => ({ ...s, pp: s.maxPp }))
          }));
          const newBox = state.box.map(p => ({
            ...p,
            hp: p.maxHp,
            hunger: 100,
            happiness: 100,
            work: undefined,
            skills: (p.skills || getInitialSkills(p.speciesId)).map(s => ({ ...s, pp: s.maxPp }))
          }));
          return { party: newParty, box: newBox };
        });
      },
      test_addExp: (amount) => {
        set((state) => {
          if (state.battleTeam.length === 0) return state;
          const targetId = state.battleTeam[0];
          return updatePokemon(targetId, (p) => applyExp(p, amount));
        });
      },
    };
  },
  {
    name: 'pokemon-storage',
  }
)
);
