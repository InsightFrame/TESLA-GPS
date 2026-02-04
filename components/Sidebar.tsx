
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Music, Wind, Settings, Navigation2, MoreHorizontal, History } from 'lucide-react';

interface SidebarProps {
  onSearch: (query: string) => void;
  activeDestination?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onSearch, activeDestination }) => {
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('gps_recent_searches');
    if (saved) {
      try {
        setRecentQueries(JSON.parse(saved));
      } catch (e) {
        console.error("Falha ao carregar buscas recentes", e);
      }
    }
  }, []);

  const saveQuery = (query: string) => {
    if (!query.trim()) return;
    setRecentQueries(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 5);
      localStorage.setItem('gps_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = (e.target as HTMLInputElement).value;
      if (value) {
        onSearch(value);
        saveQuery(value);
      }
    }
  };

  return (
    <div 
      className="h-full w-20 md:w-80 flex flex-col border-r border-white/5 z-20 transition-all duration-300"
      style={{
        background: 'linear-gradient(180deg, #00c2ff 0%, #22c55e 8%, #000000 22%, #000000 100%)'
      }}
    >
      <style>{`
        @keyframes electric-lightning {
          0%, 88%, 94%, 100% { text-shadow: 0 0 8px rgba(255,255,255,0.6); filter: brightness(1); }
          90% { text-shadow: 0 0 25px #fff, 0 0 45px #00c2ff; filter: brightness(3); transform: skewX(-1deg); }
          92% { text-shadow: 0 0 15px #fff, 0 0 30px #00f2ff; filter: brightness(2); }
          93% { text-shadow: 0 0 40px #fff, 0 0 70px #00f2ff; filter: brightness(4); transform: scale(1.03); }
        }
        @keyframes flow-energy { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
        @keyframes pulse-status {
          0%, 100% { opacity: 0.5; filter: drop-shadow(0 0 2px #00c2ff); }
          50% { opacity: 1; filter: drop-shadow(0 0 10px #00c2ff); }
        }
        .text-brand-white { color: #ffffff; animation: electric-lightning 5s infinite; display: inline-block; }
        .cable-container { position: absolute; pointer-events: none; overflow: visible; }
        .cable-path { stroke-dasharray: 6; animation: flow-energy 1.5s infinite linear; }
        .plug-glow { animation: pulse-status 2s infinite ease-in-out; }
      `}</style>

      {/* Cabeçalho do Veículo - Adaptativo */}
      <div className="p-3 md:p-6">
        <div className="flex items-center justify-between mb-2 md:mb-8">
            <div className="flex flex-col relative scale-[0.6] md:scale-100 origin-left">
                 <div className="flex items-baseline relative">
                    <span className="text-brand-white font-black text-4xl tracking-tighter italic">
                        E2008 G
                    </span>
                    <span className="text-brand-white font-black text-4xl tracking-tighter italic relative ml-[-2px]">
                        T
                        <svg className="cable-container" width="80" height="50" style={{ left: '8px', bottom: '-8px' }}>
                            <path d="M0 6 C 10 6, 15 25, 45 25" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" className="cable-path opacity-80"/>
                            <g transform="translate(45, 18)" className="plug-glow">
                                <rect x="0" y="0" width="14" height="14" rx="3" fill="white" />
                                <rect x="14" y="3" width="4" height="2" rx="1" fill="white" />
                                <rect x="14" y="9" width="4" height="2" rx="1" fill="white" />
                                <circle cx="7" cy="7" r="2" fill="#00c2ff" />
                            </g>
                        </svg>
                    </span>
                 </div>
            </div>
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative group mt-1 md:mt-6">
          <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 md:h-5 md:w-5 text-white/40 group-focus-within:text-white transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 md:pl-11 pr-2 md:pr-4 py-2 md:py-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl md:rounded-2xl leading-5 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-blue-400/50 transition-all text-sm md:text-lg font-medium"
            placeholder="Pesquisar..."
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* Lista de Navegação - Scroll suave em telas baixas */}
      <div className="flex-1 overflow-y-auto px-2 md:px-4 space-y-1 md:space-y-2 pb-2">
        <h3 className="px-2 mb-1 text-white/30 text-[8px] md:text-[10px] font-bold tracking-widest uppercase mobile-hide">Recentes</h3>
        
        {recentQueries.length === 0 ? (
          <div className="p-2 text-white/10 text-[10px] md:text-sm font-medium italic text-center mobile-hide">Vazio</div>
        ) : (
          recentQueries.map((query, i) => (
            <button 
              key={i} 
              onClick={() => onSearch(query)}
              className="w-full flex items-center space-x-2 md:space-x-4 p-2 md:p-4 rounded-xl md:rounded-2xl hover:bg-white/5 transition-colors group text-left"
            >
              <div className="bg-white/5 p-2 md:p-3 rounded-lg md:rounded-xl text-white/40 group-hover:text-white transition-all">
                <History className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex-1 truncate hidden md:block">
                <div className="text-white font-semibold text-base truncate">{query}</div>
                <div className="text-white/30 text-[10px] uppercase tracking-wider font-bold">Histórico</div>
              </div>
            </button>
          ))
        )}

        <div className="h-[1px] bg-white/5 mx-2 my-2 mobile-hide" />

        <button className="w-full flex items-center space-x-2 md:space-x-4 p-2 md:p-4 rounded-xl md:rounded-2xl hover:bg-white/5 transition-colors group text-left">
          <div className="bg-white/5 p-2 md:p-3 rounded-lg md:rounded-xl text-white/60">
            <MapPin className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="flex-1 truncate hidden md:block">
            <div className="text-white font-semibold text-base">Casa</div>
          </div>
        </button>
      </div>

      {/* Controlos Inferiores */}
      <div className="p-2 md:p-4 bg-black/40 backdrop-blur-lg border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2">
        <button className="p-2 md:p-3 rounded-lg md:rounded-2xl bg-white/5 text-white/60 hover:text-white flex justify-center transition-colors">
            <Wind className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button className="p-2 md:p-3 rounded-lg md:rounded-2xl bg-white/5 text-white/60 hover:text-white flex justify-center transition-colors">
            <Music className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button className="p-2 md:p-3 rounded-lg md:rounded-2xl bg-white/5 text-white/60 hover:text-white flex justify-center transition-colors hidden md:flex">
            <Settings className="w-6 h-6" />
        </button>
        <button className="p-2 md:p-3 rounded-lg md:rounded-2xl bg-white/5 text-white/60 hover:text-white flex justify-center transition-colors hidden md:flex">
            <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
