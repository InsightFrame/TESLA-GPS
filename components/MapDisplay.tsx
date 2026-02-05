
import React, { useEffect, useRef, useState } from 'react';
import { Compass, Layers } from 'lucide-react';
import { Coordinates, Destination } from '../types';

declare var google: any;

interface MapDisplayProps {
  location?: Coordinates;
  activeDestination?: Destination;
  onRouteInfoUpdate?: (distance: string, duration: string) => void;
}

const ThreeDIcon = ({ active }: { active: boolean }) => (
  <div className={`relative flex items-center justify-center transition-all duration-300 ${active ? 'scale-110' : 'scale-100 opacity-40'}`}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M3 12L12 7L21 12L12 17L3 12Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinejoin="round" 
        className={active ? 'text-cyan-400' : 'text-white'}
      />
      <path 
        d="M3 16L12 21L21 16" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinejoin="round"
        className={active ? 'text-cyan-400/50' : 'text-white/50'}
      />
      <text 
        x="12" 
        y="14" 
        fill="currentColor" 
        fontSize="5" 
        fontWeight="900" 
        textAnchor="middle" 
        className={active ? 'text-cyan-400' : 'text-white'}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        3D
      </text>
    </svg>
    {active && (
      <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse" />
    )}
  </div>
);

const MapDisplay: React.FC<MapDisplayProps> = ({ location, activeDestination, onRouteInfoUpdate }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const directionsService = useRef<any>(null);
  const carMarker = useRef<any>(null);
  const activeRoutePolylines = useRef<{ outer: any; core: any } | null>(null);
  const fullPathPoints = useRef<any[]>([]);
  
  const [isReady, setIsReady] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [isSatellite, setIsSatellite] = useState(false);
  const [is3D, setIs3D] = useState(true);

  // Fallback seguro para evitar crash se location for undefined
  const centerPoint = { lat: 38.7223, lng: -9.1393 }; // Lisboa como fallback padrão

  const teslaMapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#12151c" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#2a2e38" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#1b1e26" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c414d" }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1b1e26" }] },
    { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
  ];

  const navigationArrowSVG = `
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="greenGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur">
            <animate attributeName="stdDeviation" values="2;6;2" dur="2s" repeatCount="indefinite" />
          </feGaussianBlur>
          <feFlood flood-color="#22c55e" flood-opacity="0.8" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="arrowGradGreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#22c55e;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="10" fill="#22c55e" opacity="0.4">
        <animate attributeName="r" values="10;45;10" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
      <g filter="url(#greenGlow)">
        <path d="M50 10 L88 90 L50 72 L12 90 Z" fill="url(#arrowGradGreen)" stroke="#15803d" stroke-width="2" stroke-linejoin="round">
           <animateTransform attributeName="transform" type="scale" values="1;1.08;1" dur="2s" repeatCount="indefinite" additive="sum" pivot="50 50" />
        </path>
      </g>
    </svg>
  `;

  // Função robusta para limpar rotas
  const clearRoutes = () => {
    if (activeRoutePolylines.current) {
      if (activeRoutePolylines.current.outer) activeRoutePolylines.current.outer.setMap(null);
      if (activeRoutePolylines.current.core) activeRoutePolylines.current.core.setMap(null);
      activeRoutePolylines.current = null;
    }
    fullPathPoints.current = [];
  };

  const drawNeonPath = (pathPoints: any[]) => {
    clearRoutes(); // Garante que a rota anterior foi removida
    fullPathPoints.current = pathPoints;

    if (!googleMap.current) return;

    const glowOuter = new google.maps.Polyline({
      path: pathPoints,
      geodesic: true,
      strokeColor: '#00f2ff',
      strokeOpacity: 0.15,
      strokeWeight: 14,
      map: googleMap.current,
      zIndex: 40
    });

    const coreLine = new google.maps.Polyline({
      path: pathPoints,
      geodesic: true,
      strokeColor: '#007aff',
      strokeOpacity: 0.9,
      strokeWeight: 6,
      map: googleMap.current,
      zIndex: 42,
      icons: [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          scale: 4,
          strokeColor: '#fff'
        },
        offset: '0',
        repeat: '20px'
      }]
    });

    activeRoutePolylines.current = { outer: glowOuter, core: coreLine };
    animateFlow(coreLine);
  };

  const animateFlow = (line: any) => {
    let count = 0;
    const flowInterval = setInterval(() => {
      // Verifica se a linha ainda existe e está no mapa
      if (!line || !line.getMap()) {
        clearInterval(flowInterval);
        return;
      }
      count = (count + 1) % 200;
      const icons = line.get('icons');
      if (icons && icons[0]) {
        icons[0].offset = (count / 2) + 'px';
        line.set('icons', icons);
      }
    }, 50);
  };

  // Inicialização do Mapa
  useEffect(() => {
    if (!mapRef.current || typeof google === 'undefined') return;

    try {
      const mapOptions: any = {
        center: location || centerPoint,
        zoom: 18,
        tilt: 45,
        heading: location?.heading || 0,
        mapId: '69f37330743b194d',
        disableDefaultUI: true,
        backgroundColor: '#05070a',
        mapTypeId: 'roadmap',
        gestureHandling: 'greedy',
        styles: teslaMapStyle,
        renderingType: 'VECTOR'
      };

      googleMap.current = new google.maps.Map(mapRef.current, mapOptions);
      directionsService.current = new google.maps.DirectionsService();

      carMarker.current = new google.maps.Marker({
        position: location || centerPoint,
        map: googleMap.current,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(navigationArrowSVG),
          anchor: new google.maps.Point(50, 50),
          scaledSize: new google.maps.Size(60, 60),
          rotation: location?.heading || 0
        },
        zIndex: 100,
        optimized: false
      });

      googleMap.current.addListener('dragstart', () => setIsFollowing(false));
      setIsReady(true);
    } catch (e) {
      console.error("Map Init Error - Verifique a chave API ou conexão", e);
    }
  }, []); // Executa apenas uma vez na montagem

  // Atualização de Estilos e Modos
  useEffect(() => {
    if (!googleMap.current) return;
    googleMap.current.setMapTypeId(isSatellite ? 'hybrid' : 'roadmap');
  }, [isSatellite]);

  useEffect(() => {
    if (!googleMap.current) return;
    googleMap.current.setTilt(is3D ? 45 : 0);
  }, [is3D]);

  // Atualização da Posição do Carro
  useEffect(() => {
    if (!isReady || !location || !carMarker.current) return;

    const pos = new google.maps.LatLng(location.lat, location.lng);
    carMarker.current.setPosition(pos);

    if (location.heading !== null && location.heading !== undefined) {
      const currentIcon = carMarker.current.getIcon();
      // Verificação de segurança
      if (currentIcon) {
          carMarker.current.setIcon({
            ...currentIcon,
            rotation: location.heading
          });
      }
      
      if (isFollowing) {
        googleMap.current.setHeading(location.heading);
      }
    }

    if (isFollowing) {
      googleMap.current.panTo(pos);
    }
  }, [location, isFollowing, isReady]);

  // Gerenciamento de Rotas
  useEffect(() => {
    if (!isReady || !directionsService.current) return;

    if (!activeDestination) {
      clearRoutes(); // CRÍTICO: Remove a rota se o destino for cancelado
      return;
    }

    if (activeDestination.lat && activeDestination.lng) {
      const start = new google.maps.LatLng(
        location?.lat || centerPoint.lat, 
        location?.lng || centerPoint.lng
      );
      const end = new google.maps.LatLng(activeDestination.lat, activeDestination.lng);

      directionsService.current.route(
        {
          origin: start,
          destination: end,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === google.maps.DirectionsStatus.OK) {
            const path = result.routes[0].overview_path;
            const leg = result.routes[0].legs[0];
            
            drawNeonPath(path);
            
            if (onRouteInfoUpdate) {
              onRouteInfoUpdate(leg.distance.text, leg.duration.text);
            }
          } else {
            console.warn("Rota não encontrada ou erro na API Directions:", status);
          }
        }
      );
    }
  }, [activeDestination, isReady]); // Dependência em activeDestination garante re-execução ao cancelar

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#05070a]">
      <div ref={mapRef} className="absolute inset-0 z-0 scale-110 transition-transform duration-1000" />
      
      {/* Controles de Mapa - Otimizados para Mobile (Posição e Tamanho) */}
      <div className="absolute bottom-24 right-4 md:bottom-12 md:right-12 flex flex-col space-y-4 z-50">
        <div className="flex flex-col bg-black/80 backdrop-blur-3xl p-1.5 rounded-[2.2rem] border border-white/10 shadow-2xl">
          <button 
            onClick={() => setIsSatellite(!isSatellite)} 
            className={`p-4 md:p-5 rounded-t-[2rem] transition-all flex items-center justify-center ${isSatellite ? 'text-cyan-400 bg-cyan-400/10' : 'text-white/40 hover:text-white'}`}
          >
            <Layers className="w-6 h-6 md:w-7 md:h-7" />
          </button>
          <div className="h-[1px] bg-white/5 w-full" />
          <button 
            onClick={() => setIs3D(!is3D)} 
            className={`p-4 md:p-5 rounded-b-[2rem] transition-all flex items-center justify-center group`}
          >
            <ThreeDIcon active={is3D} />
          </button>
        </div>

        <button 
          onClick={() => {
            setIsFollowing(true);
            if (location && googleMap.current) {
              googleMap.current.panTo(new google.maps.LatLng(location.lat, location.lng));
              googleMap.current.setHeading(location.heading || 0);
              googleMap.current.setTilt(45);
            }
          }} 
          className={`p-5 md:p-6 rounded-[2rem] border transition-all shadow-2xl ${isFollowing ? 'bg-green-600 border-green-400 text-white' : 'bg-black/80 backdrop-blur-3xl border-white/10 text-white/40'}`}
        >
          <Compass className={`w-6 h-6 md:w-8 md:h-8 ${isFollowing ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-t from-[#05070a] via-transparent to-black/20 opacity-80" />
    </div>
  );
};

export default MapDisplay;
