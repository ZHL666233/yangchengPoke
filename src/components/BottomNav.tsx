import { useNavigate, useLocation } from 'react-router-dom';
import { Tent, Map as MapIcon, Menu as MenuIcon, Shield, Box } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: '/map', label: '冒险', icon: MapIcon, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { id: '/play', label: '培育屋', icon: Tent, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { id: '/team', label: '队伍', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: '/box', label: '仓库', icon: Box, color: 'text-amber-600', bg: 'bg-amber-100' },
    { id: '/menu', label: '大菜单', icon: MenuIcon, color: 'text-slate-800', bg: 'bg-slate-200' },
  ];

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-200 px-4 py-3 flex justify-between items-center pb-safe z-50">
      {tabs.map(tab => {
        const isActive = location.pathname === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all ${isActive ? tab.bg : 'bg-transparent'}`}
          >
            <tab.icon className={`w-6 h-6 ${isActive ? tab.color : 'text-slate-400'}`} />
            <span className={`text-[10px] font-bold mt-1 ${isActive ? tab.color : 'text-slate-400'}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
