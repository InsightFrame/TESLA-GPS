
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MapDisplay from './components/MapDisplay';
import NavigationOverlay from './components/NavigationOverlay';
import BottomInfo from './components/BottomInfo';
import CarVisualizer from './components/CarVisualizer';
import { askAssistant } from './services/geminiService';
import { Destination, Coordinates } from './types';
import { Volume2, Sparkles } from 'lucide-react';
import { GenerateContentResponse } from "@google/genai";

declare var google: any;
declare var window: any;

const App: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | undefined>();
  const [currentLocation, setCurrentLocation] = useState<Coordinates | undefined>();
  
  // States para a visualização do carro
  const [showCarVisualizer, setShowCarVisualizer] = useState(false);

  // Voice System State
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
        console.warn("Geolocalização não suportada.");
        return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading
        });
      },
      (error) => console.error("GPS Error:", error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    initVoiceSystem();

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  const initVoiceSystem = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-PT';

        recognition.onresult = async (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('')
            .toLowerCase();

          if (transcript.includes('peugeot') && !isListening && !isProcessingVoice) {
            setIsListening(true);
            setVoiceFeedback("Diga o destino...");
            
            setTimeout(() => {
                const parts = transcript.split('peugeot');
                const command = parts[parts.length - 1]?.trim();
                if (command && command.length > 2) {
                    handleVoiceCommand(command);
                }
            }, 3000);
          }
        };

        recognition.onend = () => {
            try { recognition.start(); } catch (e) {}
        };
        
        recognition.start();
        recognitionRef.current = recognition;
    } catch (error) {
        console.error("Erro voz:", error);
    }
  };

  const handleVoiceCommand = async (command: string) => {
    setIsProcessingVoice(true);
    setVoiceFeedback(`A procurar: ${command}`);
    
    try {
      const response: GenerateContentResponse = await askAssistant(`Utilizador: "${command}". Extraia apenas o local de destino.`);
      const destName = response.text?.trim();
      if (destName && destName !== "NONE") {
        handleSearch(destName);
        setVoiceFeedback("Resultados encontrados!");
      }
    } catch (err) {
      setVoiceFeedback("Erro ao processar voz.");
    } finally {
      setIsProcessingVoice(false);
      setTimeout(() => {
        setIsListening(false);
        setVoiceFeedback("");
      }, 4000);
    }
  };

  const handleSearch = (query: string) => {
    if (!query || typeof google === 'undefined') return;
    
    setIsSearching(true);
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    const request = {
      query: query,
      location: currentLocation ? new google.maps.LatLng(currentLocation.lat, currentLocation.lng) : undefined,
      radius: 15000,
      rankBy: google.maps.places.RankBy.PROMINENCE
    };

    service.textSearch(request, (results: any, status: any) => {
      setIsSearching(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        const formatted: Destination[] = results.slice(0, 10).map((place: any) => {
          let distanceValue = 0;
          let distanceStr = "---";
          
          if (currentLocation && place.geometry?.location) {
            distanceValue = google.maps.geometry.spherical.computeDistanceBetween(
              new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
              place.geometry.location
            );
            distanceStr = distanceValue > 1000 ? `${(distanceValue / 1000).toFixed(1)} km` : `${Math.round(distanceValue)} m`;
          }

          return {
            name: place.name,
            address: place.formatted_address || place.vicinity,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            distance: distanceStr,
            distanceValue: distanceValue,
            duration: "Calculando...",
            batteryUsage: Math.floor(Math.random() * 5) + 2
          };
        })
        .sort((a: any, b: any) => a.distanceValue - b.distanceValue);

        setSearchResults(formatted);
      } else {
        setSearchResults([]);
      }
    });
  };

  const selectDestination = (dest: Destination) => {
    setSelectedDestination(dest);
    setSearchResults([]); // Limpa a lista ao selecionar para focar na rota
    setIsListening(false);
  };

  const handleCancelNavigation = () => {
      setSelectedDestination(undefined);
      setSearchResults([]);
  };

  const handleRouteInfoUpdate = (distance: string, duration: string) => {
    if (selectedDestination) {
      setSelectedDestination(prev => prev ? {
        ...prev,
        distance: distance,
        duration: duration
      } : undefined);
    }
  };

  return (
    <div className="flex flex-row h-screen w-screen overflow-hidden bg-[#05070a] text-white selection:bg-blue-500/30">
      <style>{`
        @keyframes flow-bar {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .voice-glow-bar {
          background: linear-gradient(90deg, #3b82f6, #10b981, #ef4444, #3b82f6);
          background-size: 300% 300%;
          animation: flow-bar 2s infinite linear;
        }
      `}</style>

      <Sidebar 
        onSearch={handleSearch} 
        searchResults={searchResults}
        isSearching={isSearching}
        onSelectDestination={selectDestination}
        activeDestination={selectedDestination?.name}
        onClearResults={() => setSearchResults([])}
        onOpenCar={() => setShowCarVisualizer(true)}
      />

      <main className="flex-1 relative overflow-hidden bg-[#05070a]">
        
        {showCarVisualizer ? (
          <CarVisualizer onClose={() => setShowCarVisualizer(false)} />
        ) : (
          <>
            <MapDisplay 
              location={currentLocation} 
              activeDestination={selectedDestination} 
              onRouteInfoUpdate={handleRouteInfoUpdate}
            />

            {isListening && (
                <div className="absolute top-0 left-0 w-full z-[100] h-24 md:h-32 bg-gradient-to-b from-black/80 via-black/20 to-transparent flex items-start justify-center pt-8 animate-in fade-in slide-in-from-top duration-700 pointer-events-none">
                    <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-3xl px-8 py-4 rounded-full border border-white/10 shadow-2xl">
                        <div className="relative">
                            <Volume2 className="w-6 h-6 text-blue-400 animate-pulse" />
                        </div>
                        <span className="text-white font-black tracking-tight text-lg md:text-xl italic uppercase">
                            {voiceFeedback || "Diga o seu destino..."}
                        </span>
                        <Sparkles className="w-5 h-5 text-blue-300 animate-bounce" />
                    </div>
                </div>
            )}

            {isListening && (
                <div className="absolute bottom-0 left-0 w-full z-[110] h-2 voice-glow-bar shadow-[0_-10px_30px_rgba(59,130,246,0.4)] animate-in slide-in-from-bottom duration-500"></div>
            )}

            {selectedDestination && (
              <NavigationOverlay 
                step={{ instruction: `A caminhar para ${selectedDestination.name}`, distance: "CALC", icon: "straight" }} 
                nextStep={`${selectedDestination.duration} restantes`}
              />
            )}

            <BottomInfo 
              destination={selectedDestination} 
              onCancel={handleCancelNavigation} 
            />

            <div className="absolute top-6 right-6 z-50 pointer-events-none">
              <div className="px-5 py-2.5 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full text-xs font-black text-white shadow-2xl flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,1)]"></div>
                  <span className="tracking-widest uppercase font-mono">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
