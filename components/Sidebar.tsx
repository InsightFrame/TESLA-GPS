
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
    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/40 hover:bg-white/80 border border-black/5 transition-all group active:scale-95 shadow-sm"
  >
    <div className={`p-2.5 rounded-2xl mb-2 ${color} shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 uppercase tracking-tighter truncate w-full text-center">{label}</span>
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
  const [songProgress, setSongProgress] = useState(34);

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

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    onSearch(term);
  };

  return (
    <div 
      className="h-full w-24 md:w-[28rem] flex flex-col border-r border-black/5 z-20 transition-all duration-500 overflow-hidden relative shadow-2xl"
      style={{ background: '#F8F9FB' }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-black/5 pointer-events-none" />
      
      {/* Header Branding */}
      <div className="p-6 flex flex-col items-center md:items-start z-10">
        <div className="flex items-center justify-between mb-6 w-full">
            <div className="relative">
                 <div className="flex items-baseline relative group cursor-default">
                    <span className="text-slate-800 font-black text-2xl md:text-3xl tracking-tighter italic uppercase drop-shadow-sm">
                        E2008
                    </span>
                    <span className="text-blue-600 font-black text-2xl md:text-3xl tracking-tighter italic ml-0.5 uppercase">GT</span>
                 </div>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-white/60 px-3 py-1.5 rounded-full border border-black/5 shadow-sm">
                <Thermometer className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-bold text-slate-700">22°C</span>
            </div>
        </div>

        {/* Search Bar - Apple Style */}
        <div className="relative group w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isSearching ? <Loader2 className="h-5 w-5 text-blue-500 animate-spin" /> : <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full pl-12 pr-10 py-4 bg-white hover:bg-white focus:bg-white border border-black/5 rounded-2xl leading-5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-sm md:text-base shadow-sm"
            placeholder="Procure um destino..."
          />
          {(query || searchResults.length > 0) && (
            <button 
              onClick={() => { setQuery(""); onClearResults(); }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Search Grid */}
      {!searchResults.length && (
        <div className="px-6 mb-6 grid grid-cols-4 gap-3 z-10">
          <QuickCategory icon={Zap} label="Carga" color="bg-blue-500" onClick={() => handleQuickSearch("Posto de Carregamento")} />
          <QuickCategory icon={Utensils} label="Comer" color="bg-orange-500" onClick={() => handleQuickSearch("Restaurantes")} />
          <QuickCategory icon={Coffee} label="Café" color="bg-amber-700" onClick={() => handleQuickSearch("Café")} />
          <QuickCategory icon={MapPin} label="Lazer" color="bg-green-600" onClick={() => handleQuickSearch("Parques")} />
        </div>
      )}

      {/* Results or History */}
      <div className="flex-1 overflow-y-auto px-6 space-y-3 z-10 pb-4 scroll-smooth">
        {searchResults.length > 0 ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Melhores Resultados</div>
            {searchResults.map((dest, i) => (
              <button 
                key={i} 
                onClick={() => {
                   onSelectDestination(dest);
                   setQuery(""); // Limpa ao selecionar
                }}
                className="w-full flex items-center space-x-4 p-4 rounded-2xl bg-white hover:bg-blue-50 border border-black/5 transition-all group text-left active:scale-[0.98] shadow-sm hover:shadow-md hover:border-blue-200"
              >
                <div className="flex items-center justify-center w-11 h-11 bg-slate-100 rounded-full text-slate-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-inner">
                  <Navigation2 className="w-5 h-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-slate-800 font-bold text-sm md:text-base truncate leading-tight">{dest.name}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">{dest.distance}</span>
                    <span className="text-slate-400 text-[11px] truncate font-medium">{dest.address}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="hidden md:block">
            {recentQueries.length > 0 && (
              <div className="mb-4">
                <h3 className="px-1 mb-3 text-slate-400 text-[11px] font-bold tracking-widest uppercase">Pesquisas Recentes</h3>
                {recentQueries.map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleQuickSearch(q)}
                    className="w-full flex items-center space-x-3 p-3.5 rounded-xl hover:bg-white transition-all group text-left border border-transparent hover:border-black/5 hover:shadow-sm"
                  >
                    <History className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                    <span className="text-slate-600 group-hover:text-slate-900 text-sm font-medium truncate">{q}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-8 py-4 flex justify-between items-center z-10 bg-white/40 backdrop-blur-md border-t border-black/5">
        <button 
            onClick={onOpenCar}
            className="flex flex-col items-center space-y-1 text-slate-400 hover:text-blue-600 transition-colors group"
        >
            <div className="p-2.5 rounded-2xl bg-slate-100 group-hover:bg-blue-100 transition-colors">
                <CarFront className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Carro</span>
        </button>

        <button className="flex flex-col items-center space-y-1 text-slate-400 hover:text-slate-900 transition-colors group">
            <div className="p-2.5 rounded-2xl bg-slate-100 group-hover:bg-slate-200 transition-colors">
                <Wind className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">A/C</span>
        </button>
        
        <button className="flex flex-col items-center space-y-1 text-slate-400 hover:text-slate-900 transition-colors group">
            <div className="p-2.5 rounded-2xl bg-slate-100 group-hover:bg-slate-200 transition-colors">
                <Settings className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Menu</span>
        </button>
      </div>

      {/* Spotify Widget - Dark Theme */}
      <div className="m-4 bg-[#121214] rounded-[2rem] p-5 relative overflow-hidden group shadow-2xl z-20 border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1DB954]/10 via-transparent to-[#8b5cf6]/5 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-[#1DB954] rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-black fill-current" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                    </div>
                    <span className="text-[10px] font-black text-[#1DB954] tracking-widest uppercase">Spotify</span>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800 overflow-hidden shadow-xl flex-shrink-0 relative ring-1 ring-white/10">
                   <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070&auto=format&fit=crop" alt="Album" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-base truncate leading-tight">Midnight City</div>
                    <div className="text-white/40 text-xs truncate mt-0.5">M83 • Hurry Up, We're Dreaming</div>
                </div>
            </div>

            <div className="mt-4 flex flex-col space-y-3">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1DB954] rounded-full" style={{ width: `${songProgress}%` }}></div>
                </div>

                <div className="flex items-center justify-between px-2 pt-1">
                    <button className="text-white/40 hover:text-white transition-colors">
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                    </button>
                    
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg"
                    >
                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                    </button>

                    <button className="text-white/40 hover:text-white transition-colors">
                         <SkipForward className="w-6 h-6 fill-current" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
