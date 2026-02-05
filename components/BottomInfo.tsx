
import React, { useState, useEffect } from 'react';
import { Clock, Navigation } from 'lucide-react';
import { Destination } from '../types';

interface BottomInfoProps {
  destination?: Destination;
  onCancel: () => void;
}

const BottomInfo: React.FC<BottomInfoProps> = ({ destination, onCancel }) => {
  const [arrivalTime, setArrivalTime] = useState<string>("--:--");

  useEffect(() => {
    if (!destination || !destination.duration) return;

    const calculateArrival = () => {
      const now = new Date();
      let totalMinutes = 0;

      // Parsing simples para formatos como "1 h 20 min" ou "15 mins"
      const durationStr = destination.duration.toLowerCase();
      
      const hoursMatch = durationStr.match(/(\d+)\s*h/);
      const minsMatch = durationStr.match(/(\d+)\s*min/);

      if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
      if (minsMatch) totalMinutes += parseInt(minsMatch[1]);
      
      // Se não deu match nos padrões acima (ex: apenas "25 mins"), tenta um fallback numérico simples
      if (!hoursMatch && !minsMatch) {
        const fallbackMatch = durationStr.match(/(\d+)/);
        if (fallbackMatch) totalMinutes += parseInt(fallbackMatch[1]);
      }

      const arrivalDate = new Date(now.getTime() + totalMinutes * 60000);
      setArrivalTime(arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };

    calculateArrival();
    // Atualiza a cada minuto para manter o sincronismo com o relógio atual
    const interval = setInterval(calculateArrival, 30000);
    return () => clearInterval(interval);
  }, [destination]);

  if (!destination) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex flex-col min-w-[100px]">
            <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Chegada</div>
            <div className="flex items-baseline space-x-1">
              <span className="text-4xl font-black text-white tracking-tighter">{arrivalTime}</span>
            </div>
          </div>
          
          <div className="h-10 w-[1px] bg-white/10" />

          <div className="flex items-center space-x-8">
            <div className="flex flex-col items-center">
              <Clock className="w-5 h-5 text-blue-400 mb-1" />
              <span className="text-white font-bold text-lg">{destination.duration}</span>
            </div>
            <div className="flex flex-col items-center">
              <Navigation className="w-5 h-5 text-green-400 mb-1" />
              <span className="text-white font-bold text-lg">{destination.distance}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onCancel}
          className="bg-red-500/90 hover:bg-red-600 transition-all text-white font-black uppercase tracking-widest text-xs px-8 py-5 rounded-3xl shadow-xl shadow-red-900/20 active:scale-95"
        >
          Parar
        </button>
      </div>
    </div>
  );
};

export default BottomInfo;
