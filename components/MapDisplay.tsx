
import React, { useEffect, useRef, useState } from 'react';
import { Compass, Layers } from 'lucide-react';
import { Coordinates, Destination } from '../types';

declare var google: any;

interface MapDisplayProps {
  location?: Coordinates;
  activeDestination?: Destination;
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

const MapDisplay: React.FC<MapDisplayProps> = ({ location, activeDestination }) => {
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

  const centerPoint = { lat: 41.30250, lng: -8.20670 };

  const teslaMapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#12151c" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#2a2e38" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c414d" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
  ];

  const navigationArrowSVG = `
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feFlood flood-color="#00f2ff" flood-opacity="0.6" />
          <feComposite in2="blur" operator="in" />
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#007aff;stop-opacity:1" />
        </linearGradient>
      </defs>
      <g filter="url(#glow)">
        <path d="M50 10 L88 90 L50 72 L12 90 Z" fill="url(#arrowGrad)" stroke="#007aff" stroke-width="1.5" stroke-linejoin="round"/>
      </g>
    </svg>
  `;

  const clearRoutes = () => {
    if (activeRoutePolylines.current) {
      activeRoutePolylines.current.outer.setMap(null);
      activeRoutePolylines.current.core.setMap(null);
      activeRoutePolylines.current = null;
    }
    fullPathPoints.current = [];
  };

  const drawNeonPath = (pathPoints: any[]) => {
    clearRoutes();
    fullPathPoints.current = pathPoints;

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
      zIndex: 42
    });

    activeRoutePolylines.current = { outer: glowOuter, core: coreLine };
  };

  useEffect(() => {
    if (!mapRef.current || typeof google === 'undefined') return;

    const mapOptions: any = {
      center: location || centerPoint,
      zoom: 18,
      tilt: 75, // Ajustado para 75% conforme solicitado
      heading: location?.heading || 0,
      disableDefaultUI: true,
      backgroundColor: '#05070a',
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
        scaledSize: new google.maps.Size(54, 54),
        rotation: location?.heading || 0
      },
      zIndex: 100,
      optimized: false
    });

    googleMap.current.addListener('dragstart', () => setIsFollowing(false));
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!googleMap.current) return;
    googleMap.current.setMapTypeId(isSatellite ? 'hybrid' : 'roadmap');
  }, [isSatellite]);

  useEffect(() => {
    if (!googleMap.current) return;
    googleMap.current.setTilt(is3D ? 75 : 0); // Ajustado para 75% no modo 3D
  }, [is3D]);

  useEffect(() => {
    if (!isReady || !location) return;
    const pos = new google.maps.LatLng(location.lat, location.lng);
    carMarker.current.setPosition(pos);
    if (location.heading !== null && location.heading !== undefined) {
      const currentIcon = carMarker.current.getIcon();
      carMarker.current.setIcon({ ...currentIcon, rotation: location.heading });
      if (isFollowing) googleMap.current.setHeading(location.heading);
    }
    if (isFollowing) googleMap.current.panTo(pos);
  }, [location, isFollowing, isReady]);

  useEffect(() => {
    if (isReady && activeDestination?.lat) {
      const start = new google.maps.LatLng(location?.lat || centerPoint.lat, location?.lng || centerPoint.lng);
      const end = new google.maps.LatLng(activeDestination.lat, activeDestination.lng);

      directionsService.current.route({
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING,
      }, (result: any, status: any) => {
        if (status === google.maps.DirectionsStatus.OK) {
          drawNeonPath(result.routes[0].overview_path);
        }
      });
    } else if (isReady && !activeDestination) {
      clearRoutes();
    }
  }, [activeDestination, isReady]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#05070a]">
      <div ref={mapRef} className="absolute inset-0 z-0" />
      
      <div className="absolute bottom-12 right-12 flex flex-col space-y-4 z-50">
        <div className="flex flex-col bg-black/80 backdrop-blur-3xl p-1.5 rounded-[2.2rem] border border-white/10 shadow-2xl">
          <button 
            onClick={() => setIsSatellite(!isSatellite)} 
            className={`p-5 rounded-t-[2rem] transition-all flex items-center justify-center ${isSatellite ? 'text-cyan-400 bg-cyan-400/10' : 'text-white/40 hover:text-white'}`}
          >
            <Layers className="w-7 h-7" />
          </button>
          <div className="h-[1px] bg-white/5 w-full" />
          <button onClick={() => setIs3D(!is3D)} className="p-5 rounded-b-[2rem] transition-all flex items-center justify-center">
            <ThreeDIcon active={is3D} />
          </button>
        </div>

        <button 
          onClick={() => setIsFollowing(true)} 
          className={`p-6 rounded-[2rem] border transition-all shadow-2xl ${isFollowing ? 'bg-blue-600 border-blue-400 text-white' : 'bg-black/80 backdrop-blur-3xl border-white/10 text-white/40'}`}
        >
          <Compass className={`w-8 h-8 ${isFollowing ? 'animate-pulse' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default MapDisplay;
