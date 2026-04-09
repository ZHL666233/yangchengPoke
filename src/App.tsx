import { useState, useCallback } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Play from "@/pages/Play";
import MapPage from "@/pages/Map";
import Shop from "@/pages/Shop";
import Wild from "@/pages/Wild";
import Dungeon from "@/pages/Dungeon";
import Wheel from "@/pages/Wheel";
import Pokedex from "@/pages/Pokedex";
import BoxPage from "@/pages/Box";
import Menu from "@/pages/Menu";
import TeamPage from "@/pages/Team";
import Settings from "@/pages/Settings";
import LoadingScreen from "@/components/LoadingScreen";

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const handleLoadComplete = useCallback(() => setLoaded(true), []);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex justify-center items-center overflow-hidden">
        <div className="w-full max-w-md h-[100dvh] bg-white sm:h-[800px] sm:rounded-3xl sm:shadow-2xl overflow-hidden relative">
          {!loaded && <LoadingScreen onComplete={handleLoadComplete} />}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/play" element={<Play />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/wild" element={<Wild />} />
            <Route path="/dungeon" element={<Dungeon />} />
            <Route path="/wheel" element={<Wheel />} />
            <Route path="/pokedex" element={<Pokedex />} />
            <Route path="/box" element={<BoxPage />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
