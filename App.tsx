
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MapDisplay from './components/MapDisplay';
import NavigationOverlay from './components/NavigationOverlay';
import BottomInfo from './components/BottomInfo';
import { Destination, Coordinates } from './types';
import { Loader2, X, Navigation2 } from 'lucide-react';

declare var google: any;

const App: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | undefined>();
  const [currentLocation, setCurrentLocation] = useState<Coordinates | undefined>();

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading
        });
      },
      (error) => console.error("Erro GPS:", error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleSearch = (query: string) => {
    if (!query || typeof google === 'undefined') return;
    setIsSearching(true);
    
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    const request = {
      query: query,
      location: currentLocation ? new google.maps.LatLng(currentLocation.lat, currentLocation.lng) : undefined,
      radius: 50000,
    };

    service.textSearch(request, (results: any, status: any) => {
      setIsSearching(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const formatted: Destination[] = results.slice(0, 5).map((place: any) => ({
          name: place.name,
          address: place.formatted_address || place.vicinity,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          distance: "A calcular...",
          duration: "12 min",
          batteryUsage: 4
        }));
        setSearchResults(formatted);
      } else {
        setSearchResults([]);
      }
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white selection:bg-blue-500/30">
      <Sidebar onSearch={handleSearch} activeDestination={selectedDestination?.name} />

      <main className="flex-1 relative overflow-hidden bg-[#05070a]">
        <MapDisplay location={currentLocation} activeDestination={selectedDestination} />

        {selectedDestination && (
          <NavigationOverlay 
            step={{ instruction: `Rumo a ${selectedDestination.name}`, distance: "800 m", icon: "straight" }} 
            nextStep={`Chegada às 14:54`}
          />
        )}

        <BottomInfo destination={selectedDestination} onCancel={() => setSelectedDestination(undefined)} />

        {/* Modal de Resultados - Responsivo */}
        {(isSearching || searchResults.length > 0) && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md">
             <div className="w-full max-w-2xl bg-[#0a0c10] border border-white/10 rounded-2xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <h2 className="text-base md:text-xl font-bold text-white">Resultados</h2>
                    </div>
                    <button onClick={() => setSearchResults([])} className="p-2">
                        <X className="w-5 h-5 md:w-6 md:h-6 text-white/40" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 md:p-4">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-12 md:py-24 space-y-4">
                            <Loader2 className="w-8 h-8 md:w-12 md:h-12 text-white animate-spin opacity-40" />
                            <p className="text-white/40 text-[8px] md:text-[10px] font-black tracking-widest uppercase">Satélites...</p>
                        </div>
                    ) : (
                        searchResults.map((result, i) => (
                            <button key={i} onClick={() => { setSelectedDestination(result); setSearchResults([]); }} className="w-full group p-3 md:p-5 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-3xl transition-all flex items-center justify-between text-left mb-2 md:mb-3">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm md:text-lg font-bold text-white group-hover:text-white truncate">{result.name}</h4>
                                    <p className="text-white/40 text-[10px] md:text-sm truncate">{result.address}</p>
                                </div>
                                <div className="ml-2 md:ml-4 p-3 md:p-5 bg-[#007aff] rounded-lg md:rounded-2xl shrink-0">
                                    <Navigation2 className="w-4 h-4 md:w-6 md:h-6 text-white" />
                                </div>
                            </button>
                        ))
                    )}
                </div>
             </div>
          </div>
        )}

        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
           <div className="px-3 py-1 md:px-4 md:py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-[10px] md:text-xs font-black text-white/90">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
