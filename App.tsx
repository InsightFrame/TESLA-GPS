
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
    // Verificação de segurança para geolocalização
    if (!navigator.geolocation) {
        console.warn("Geolocalização não suportada neste navegador.");
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
          try {
             recognitionRef.current.stop();
          } catch(e) {}
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
            
            // Timeout para esperar o usuário falar o comando após a "wake word"
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
            // Reinicia automaticamente para escutar "Peugeot" novamente
            try {
                recognition.start();
            } catch (e) {
                // Ignora erro se já estiver iniciado
            }
        };
        
        recognition.start();
        recognitionRef.current = recognition;
    } catch (error) {
        console.error("Erro ao iniciar reconhecimento de voz:", error);
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
        setVoiceFeedback("Escolha o destino na barra lateral");
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
    if (!query || typeof google === 'undefined') {
        console.warn("Google Maps API não carregada ainda.");
        return;
    }
    
    setIsSearching(true);
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    const request = {
      query: query,
      location: currentLocation ? new google.maps.LatLng(currentLocation.lat, currentLocation.lng) : undefined,
      radius: 10000,
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
            batteryUsage: 4
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
    setSearchResults([]);
    setIsListening(false);
  };

  const handleCancelNavigation = () => {
      setSelectedDestination(undefined);
      // Limpa os resultados para voltar ao estado inicial limpo
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
    <div className="flex flex-row h-screen w-screen overflow-hidden bg-black text-white selection:bg-blue-500/30">
      <style>{`
        @keyframes flow-bar {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .voice-glow-bar {
          background: linear-gradient(90deg, #00c2ff, #22c55e, #ff0055, #00c2ff);
          background-size: 300% 300%;
          animation: flow-bar 2s infinite linear;
        }
      `}</style>

      {/* Sidebar com largura responsiva */}
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
                <div className="absolute top-0 left-0 w-full z-[100] h-20 md:h-28 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-start justify-center pt-4 md:pt-8 animate-in fade-in slide-in-from-top duration-700 pointer-events-none">
                    <div className="flex items-center space-x-4 bg-white/5 backdrop-blur-3xl px-6 py-3 md:px-10 md:py-5 rounded-full border border-white/10 shadow-2xl">
                        <div className="relative">
                            <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-[#00c2ff] animate-pulse" />
                        </div>
                        <span className="text-white font-black tracking-tight text-sm md:text-xl italic uppercase truncate max-w-[200px] md:max-w-none">
                            {voiceFeedback || "Aguardando comando..."}
                        </span>
                        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 animate-bounce" />
                    </div>
                </div>
            )}

            {isListening && (
                <div className="absolute bottom-0 left-0 w-full z-[110] h-1.5 md:h-2.5 voice-glow-bar shadow-[0_-15px_40px_rgba(0,194,255,0.5)] animate-in slide-in-from-bottom duration-500"></div>
            )}

            {selectedDestination && (
              <NavigationOverlay 
                step={{ instruction: `Siga para ${selectedDestination.name}`, distance: "-->", icon: "straight" }} 
                nextStep={`Chegada em ${selectedDestination.duration}`}
              />
            )}

            <BottomInfo 
              destination={selectedDestination} 
              onCancel={handleCancelNavigation} 
            />

            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50 pointer-events-none">
              <div className="px-4 py-2 md:px-6 md:py-3 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full text-[10px] md:text-xs font-black text-white/80 shadow-2xl flex items-center space-x-3">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                  <span className="tracking-widest uppercase hidden md:inline">GPS ONLINE • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="tracking-widest uppercase md:hidden">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
