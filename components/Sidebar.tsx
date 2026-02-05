
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Settings, Navigation2, History, X, Loader2, Zap, Utensils, Coffee, Play, Pause, SkipForward, Wind, Thermometer, CarFront } from 'lucide-react';
import { Destination } from '../types';

interface SidebarProps {
  onSearch: (query: string) => void;
  searchResults: Destination[];
  isSearching: boolean;
  onSelectDestination: (dest: Destination) => void;
  activeDestination?: string;
  onClearResults: () => void;
  onOpenCar: () => void;
}

const QuickCategory: React.FC<{ icon: React.ElementType, label: string, onClick: () => void, color: string }> = ({ icon: Icon, label, onClick, color }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-2 md:p-3 rounded-2xl bg-black/5 hover:bg-black/10 border border-black/5 transition-all group active:scale-95"
  >
    <div className={`p-1.5 md:p-2 rounded-xl mb-1 ${color} shadow-sm group-hover:scale-110 transition-transform`}>
      <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
    </div>
    <span className="text-[8px] md:text-[10px] font-bold text-slate-600 group-hover:text-slate-900 uppercase tracking-tighter truncate w-full text-center">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  onSearch, 
  searchResults, 
  isSearching, 
  onSelectDestination, 
  onClearResults,
  onOpenCar
}) => {
  const [query, setQuery] = useState("");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songProgress, setSongProgress] = useState(30);

  useEffect(() => {
    const saved = localStorage.getItem('gps_recent_searches');
    if (saved) {
      try {
        setRecentQueries(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar recentes", e);
      }
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch(query);
    }
  };

  const performSearch = (q: string) => {
    if (!q.trim()) return;
    onSearch(q);
    const updated = [q, ...recentQueries.filter(item => item !== q)].slice(0, 5);
    setRecentQueries(updated);
    localStorage.setItem('gps_recent_searches', JSON.stringify(updated));
  };

  return (
    <div 
      className="h-full w-24 md:w-[30rem] flex flex-col border-r border-black/5 z-20 transition-all duration-500 overflow-hidden relative shadow-2xl"
      style={{
        background: '#F3E5D8' 
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-black/5 pointer-events-none" />
      
      <style>{`
        .album-art-shadow {
          box-shadow: 0 8px 20px -6px rgba(0,0,0,0.6);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>

      {/* Header Branding */}
      <div className="p-4 md:p-6 flex flex-col items-center md:items-start z-10">
        <div className="flex items-center justify-center md:justify-between mb-4 md:mb-6 w-full">
            <div className="relative">
                 <div className="flex items-baseline relative group cursor-default">
                    <span className="text-slate-800 font-black text-xl md:text-3xl tracking-tighter italic uppercase drop-shadow-sm">
                        E2008
                    </span>
                    <span className="text-blue-600 font-black text-xl md:text-3xl tracking-tighter italic relative ml-0.5 md:ml-[-2px] uppercase">GT</span>
                 </div>
            </div>
            <div className="hidden md:flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-black/5 px-2 py-1 rounded-lg border border-black/5">
                    <Thermometer className="w-3 h-3 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">21°C</span>
                </div>
            </div>
        </div>

        {/* Search Bar */}
        <div className="relative group w-full">
          <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
            {isSearching ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 text-blue-500 animate-spin" /> : <Search className="h-4 w-4 md:h-5 md:w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full pl-9 pr-8 md:pl-11 md:pr-10 py-3 md:py-4 bg-white/40 hover:bg-white/60 focus:bg-white/80 backdrop-blur-xl border border-black/5 rounded-2xl leading-5 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-xs md:text-base shadow-sm"
            placeholder={window.innerWidth < 768 ? "Buscar..." : "Para onde vamos?"}
          />
          {(query || searchResults.length > 0) && (
            <button 
              onClick={() => { setQuery(""); onClearResults(); }}
              className="absolute inset-y-0 right-0 pr-2 md:pr-3 flex items-center text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Search Grid */}
      {!searchResults.length && (
        <div className="px-2 md:px-6 mb-2 md:mb-4 grid grid-cols-1 md:grid-cols-4 gap-2 z-10">
          <QuickCategory icon={Zap} label="Carga" color="bg-blue-600" onClick={() => { setQuery("Carregamento Elétrico"); onSearch("Carregamento Elétrico"); }} />
          <QuickCategory icon={Utensils} label="Comer" color="bg-orange-500" onClick={() => { setQuery("Restaurantes"); onSearch("Restaurantes"); }} />
          <QuickCategory icon={Coffee} label="Café" color="bg-amber-700" onClick={() => { setQuery("Café"); onSearch("Café"); }} />
          <QuickCategory icon={MapPin} label="Lazer" color="bg-green-600" onClick={() => { setQuery("Parques"); onSearch("Parques"); }} />
        </div>
      )}

      {/* Results or History */}
      <div className="flex-1 overflow-y-auto px-2 md:px-6 space-y-2 custom-scrollbar z-10 pb-4">
        {searchResults.length > 0 ? (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Resultados</div>
            {searchResults.map((dest, i) => (
              <button 
                key={i} 
                onClick={() => onSelectDestination(dest)}
                className="w-full flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/40 hover:bg-white/70 border border-white/20 transition-all group text-left active:scale-[0.98] shadow-sm"
              >
                <div className="hidden md:flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Navigation2 className="w-5 h-5" />
                </div>
                <div className="flex-1 w-full overflow-hidden">
                  <div className="text-slate-800 font-bold text-xs md:text-base truncate">{dest.name}</div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded uppercase">{dest.distance}</span>
                    <span className="text-slate-500 text-[10px] md:text-xs truncate">{dest.address}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="hidden md:block">
            {recentQueries.length > 0 && (
              <div className="mb-4">
                <h3 className="px-1 mb-2 text-slate-500 text-[10px] font-bold tracking-widest uppercase">Recentes</h3>
                {recentQueries.map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setQuery(q); onSearch(q); }}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-black/5 transition-all group text-left"
                  >
                    <History className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                    <span className="text-slate-600 group-hover:text-slate-900 text-sm font-medium truncate">{q}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Shortcuts (Updated with Car Button) */}
      <div className="px-6 py-2 flex justify-between items-center z-10 border-t border-black/5">
        <button 
            onClick={onOpenCar}
            className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors group"
        >
            <div className="p-2 rounded-full bg-slate-200 group-hover:bg-blue-100 transition-colors">
                <CarFront className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider hidden md:block">Veículo</span>
        </button>

        <button className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors">
            <Wind className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden md:block">Clima</span>
        </button>
        <button className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors">
            <Settings className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden md:block">Ajustes</span>
        </button>
      </div>

      {/* SPOTIFY INTEGRATION WIDGET */}
      <div className="mt-auto m-2 md:m-4 bg-[#18181b] rounded-[2rem] p-4 md:p-5 relative overflow-hidden group shadow-2xl z-20 border border-black/5">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1DB954]/20 via-transparent to-[#8b5cf6]/10 opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
        
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-[#1DB954] rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-black fill-current" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                    </div>
                    <span className="text-[10px] font-bold text-[#1DB954] tracking-widest uppercase">Spotify</span>
                </div>
                <div className="h-1 w-8 bg-white/20 rounded-full"></div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-neutral-800 overflow-hidden album-art-shadow flex-shrink-0 relative ring-1 ring-white/10">
                   <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070&auto=format&fit=crop" alt="Album" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm md:text-lg truncate leading-tight">Midnight City</div>
                    <div className="text-white/60 text-xs md:text-sm truncate">M83 • Hurry Up, We're Dreaming</div>
                </div>
            </div>

            <div className="mt-4 flex flex-col space-y-3">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1DB954] rounded-full" style={{ width: `${songProgress}%` }}></div>
                </div>

                <div className="flex items-center justify-between px-2 pt-1">
                    <button className="text-white/60 hover:text-white transition-colors">
                        <svg className="w-5 h-5 md:w-6 md:h-6 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                    </button>
                    
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg shadow-white/10"
                    >
                        {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" /> : <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-1" />}
                    </button>

                    <button className="text-white/60 hover:text-white transition-colors">
                         <SkipForward className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
